-- SelfPM Authentication Schema
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

-- Add user_id to other tables through task relationship (they're already connected via task_id)
-- No need to add user_id to subtasks, task_updates, notes as they're linked via tasks

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Update the trigger function for users table
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

-- User-specific policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid() OR id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid() OR id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

-- Tasks policies - users can only access their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (user_id = auth.uid() OR user_id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (user_id = auth.uid() OR user_id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid() OR user_id = (
    SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
  ));

-- Subtasks policies - users can access subtasks of their own tasks
CREATE POLICY "Users can view own subtasks" ON subtasks
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can create own subtasks" ON subtasks
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can update own subtasks" ON subtasks
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can delete own subtasks" ON subtasks
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Task updates policies
CREATE POLICY "Users can view own task_updates" ON task_updates
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can create own task_updates" ON task_updates
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can update own task_updates" ON task_updates
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can delete own task_updates" ON task_updates
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid() OR user_id = (
        SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Function to hash passwords (you'll implement bcrypt hashing in the application)
-- This is just for reference - actual hashing should be done in the application layer
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use proper bcrypt hashing in your application
  -- This is just a placeholder function
  RETURN crypt(password, gen_salt('bf', 8));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: You should run this schema after your existing schema
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run the existing schema.sql first (if not already done)
-- 3. Then run this auth-schema.sql
-- 4. This will add authentication while preserving existing data