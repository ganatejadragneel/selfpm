-- Script to remove the notifications table from SelfPM database
-- Run this in your Supabase SQL Editor

-- Drop the notifications table
-- This will automatically drop the foreign key constraints due to CASCADE
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Verification query to confirm table is dropped
-- Run this after the DROP statement to verify
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'notifications';
-- (Should return 0 rows if successful)