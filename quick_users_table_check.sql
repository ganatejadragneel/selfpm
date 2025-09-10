-- ================================================================
-- QUICK USERS TABLE SAFETY CHECK (One-liner)
-- Run this first to get an instant overview
-- ================================================================

WITH fk_check AS (
    SELECT COUNT(*) as fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users' AND tc.table_schema = 'public'
),
data_check AS (
    SELECT COUNT(*) as user_count FROM users
)
SELECT 
    CASE 
        WHEN fk.fk_count = 0 AND dc.user_count = 0 THEN '✅ SAFE TO DROP: No constraints, no data'
        WHEN fk.fk_count = 0 AND dc.user_count > 0 THEN '⚠️ CAUTION: No constraints but ' || dc.user_count || ' users exist'
        WHEN fk.fk_count > 0 THEN '❌ NOT SAFE: ' || fk.fk_count || ' foreign key constraints exist'
        ELSE '❓ UNKNOWN STATE'
    END AS safety_status,
    fk.fk_count AS foreign_keys,
    dc.user_count AS users_count
FROM fk_check fk, data_check dc;