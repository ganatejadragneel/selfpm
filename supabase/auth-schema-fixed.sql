-- SelfPM Authentication Schema (Fixed for PostgreSQL compatibility)
-- This extends the existing schema with user authentication

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Encrypted password
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add user_id to existing tables to make them user-specific
-- First, add user_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Update the trigger function for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS Policies to be user-specific
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on subtasks" ON subtasks;
DROP POLICY IF EXISTS "Allow all operations on task_updates" ON task_updates;
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (Note: These are basic policies for custom auth)
-- In production, you might want to use Supabase Auth instead

-- Users policies - Allow all operations for now (since we're using custom auth)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Tasks policies - users can only access tasks with their user_id
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (user_id = current_setting('app.current_user_id')::UUID);

-- Subtasks policies
CREATE POLICY "Users can view own subtasks" ON subtasks
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can create own subtasks" ON subtasks
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can update own subtasks" ON subtasks
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can delete own subtasks" ON subtasks
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

-- Task updates policies
CREATE POLICY "Users can view own task_updates" ON task_updates
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can create own task_updates" ON task_updates
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can update own task_updates" ON task_updates
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can delete own task_updates" ON task_updates
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

-- Helper function to set current user context (for use in application)
CREATE OR REPLACE FUNCTION set_current_user_id(user_uuid UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments and Instructions:
-- 1. Run your existing schema.sql first (if not already done)
-- 2. Then run this auth-schema-fixed.sql
-- 3. In your application, call set_current_user_id() after user login
-- 4. This sets the user context for RLS policies to work properly