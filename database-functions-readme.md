# Database Functions

## Security Notice

Database functions with elevated privileges have been removed from this repository for security reasons.

### Required Database Function: ensure_user_in_mapping_table

**Purpose**: Allows new Supabase Auth users to be added to the user_migration_mapping table for username login support.

**Security Requirements**:
1. Only grant execute permissions to `authenticated` role (NOT `anon`)
2. Add input validation for username and email parameters
3. Implement rate limiting if possible
4. Sanitize error messages returned to clients
5. Verify the hard-coded `old_user_id` exists in your database

**Manual Application Required**:
This function must be created manually in your Supabase database with proper security measures.

**Contact**: Check with your database administrator for the secure version of this function.

## Fallback Behavior

The application will automatically fall back to direct table insertion if the database function doesn't exist, though this may be subject to RLS policy restrictions.