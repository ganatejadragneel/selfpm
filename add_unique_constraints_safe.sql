-- Safe version: Add unique constraints to user_migration_mapping table
-- This version includes error handling and validation

-- STEP 1: Verify current data has no duplicates
-- (These queries should return empty results if no duplicates exist)

-- Check for duplicate usernames (should be empty):
SELECT username, COUNT(*) as duplicate_count
FROM user_migration_mapping 
GROUP BY username 
HAVING COUNT(*) > 1;

-- Check for duplicate emails (should be empty):
SELECT email, COUNT(*) as duplicate_count
FROM user_migration_mapping 
GROUP BY email 
HAVING COUNT(*) > 1;

-- STEP 2: Add unique constraints (only if above queries return no results)
-- Run these one at a time and check for success

-- Add unique constraint for username
DO $$ 
BEGIN
    ALTER TABLE user_migration_mapping 
    ADD CONSTRAINT unique_username UNIQUE (username);
    RAISE NOTICE 'SUCCESS: Unique constraint added for username';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'CONSTRAINT ALREADY EXISTS: unique_username';
    WHEN unique_violation THEN
        RAISE EXCEPTION 'ERROR: Duplicate usernames exist. Cannot add unique constraint.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR adding username constraint: %', SQLERRM;
END $$;

-- Add unique constraint for email
DO $$ 
BEGIN
    ALTER TABLE user_migration_mapping 
    ADD CONSTRAINT unique_email UNIQUE (email);
    RAISE NOTICE 'SUCCESS: Unique constraint added for email';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'CONSTRAINT ALREADY EXISTS: unique_email';
    WHEN unique_violation THEN
        RAISE EXCEPTION 'ERROR: Duplicate emails exist. Cannot add unique constraint.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR adding email constraint: %', SQLERRM;
END $$;

-- STEP 3: Verify constraints were added successfully
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_migration_mapping'
AND constraint_type = 'UNIQUE';

-- STEP 4: Test the constraints (optional)
-- These should fail with unique constraint violation errors:

-- Test duplicate username (should fail):
-- INSERT INTO user_migration_mapping (old_user_id, new_auth_id, username, email, migration_status, migrated_at) 
-- VALUES ('2e94c75d-a980-4d8a-98c0-74a5d89e44be', 'test-id-1', 'gta', 'test1@example.com', 'test', NOW());

-- Test duplicate email (should fail):
-- INSERT INTO user_migration_mapping (old_user_id, new_auth_id, username, email, migration_status, migrated_at)
-- VALUES ('2e94c75d-a980-4d8a-98c0-74a5d89e44be', 'test-id-2', 'testuser', 'akulaganateja@gmail.com', 'test', NOW());

-- Clean up test records (if any were created):
-- DELETE FROM user_migration_mapping WHERE migration_status = 'test';