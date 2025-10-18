-- Fix user_id column constraint error
-- This script removes the NOT NULL constraint from user_id column

-- Step 1: Remove NOT NULL constraint from user_id column
ALTER TABLE users 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Make sure user_id can be NULL (optional/nullable)
-- This allows users to exist without a user_id value

-- Step 3: Update any existing NULL values to ensure consistency
-- (This step is optional - NULL values are now allowed)

-- Step 4: Add a comment to document the change
COMMENT ON COLUMN users.user_id IS 'Optional unique user ID - can be NULL';

-- Verification query (run this to check the change worked)
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'user_id';

-- Expected result: is_nullable should be 'YES'