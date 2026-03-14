# Database Migrations Guide

## Overview

The SL Academy Platform uses Supabase for database management with SQL migration files. This document provides comprehensive guidance on managing database migrations.

## Migration Files

All migration files are located in `supabase/migrations/` and are executed in numerical order.

### Current Migrations

1. **001_init_schema.sql** - Initial database schema
   - Creates all core tables (hospitals, profiles, tracks, lessons, questions, test_attempts, doubts, indicators)
   - Defines ENUM types (user_role, question_type, doubt_status)
   - Sets up indexes and constraints
   - Adds soft delete support (deleted_at columns)

2. **002_rls_policies.sql** - Row Level Security policies
   - Enables RLS on all tables
   - Creates helper functions (user_hospital_id, user_role, is_manager)
   - Implements multi-tenant isolation policies
   - Enforces role-based access control

3. **003_triggers.sql** - Database triggers
   - Auto-update timestamp triggers
   - Auto-create profile on user signup
   - Error handling for profile creation

4. **004_audit_logs.sql** - Audit logging table
   - Creates audit_logs table for security events
   - Sets up indexes for performance
   - Implements RLS policies for audit logs

5. **002_add_consent_timestamp.sql** - GDPR consent tracking
   - Adds consent_timestamp column to profiles
   - Tracks when users accept privacy policy

## Migration Naming Convention

Migrations follow the pattern: `{number}_{description}.sql`

- **Number**: Sequential number (001, 002, 003, etc.)
- **Description**: Snake_case description of the migration
- **Extension**: Always `.sql`

**Examples:**
- `001_init_schema.sql`
- `002_rls_policies.sql`
- `005_add_new_feature.sql`

## Applying Migrations

### Method 1: Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste into the SQL editor
5. Click **Run** to execute

### Method 2: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --file supabase/migrations/001_init_schema.sql
```

### Method 3: Direct PostgreSQL Connection

```bash
# Using psql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/001_init_schema.sql

# Using Supabase connection string
psql "$DATABASE_URL" -f supabase/migrations/001_init_schema.sql
```

## Migration Order

**CRITICAL:** Migrations must be applied in the correct order:

1. `001_init_schema.sql` - Creates base tables
2. `002_rls_policies.sql` - Sets up security policies
3. `003_triggers.sql` - Adds automation
4. `004_audit_logs.sql` - Adds audit logging
5. `002_add_consent_timestamp.sql` - Adds GDPR consent

**Note:** The consent migration is numbered `002` but should be applied after `004` as it's an additive change.

## Creating New Migrations

### Step 1: Create Migration File

```bash
# Create new migration file with next sequential number
touch supabase/migrations/005_add_new_feature.sql
```

### Step 2: Write Migration SQL

```sql
-- Migration: Add new feature
-- Description: Brief description of what this migration does

-- Add your SQL here
ALTER TABLE profiles ADD COLUMN new_field TEXT;

-- Add indexes if needed
CREATE INDEX idx_profiles_new_field ON profiles(new_field);

-- Add comments for documentation
COMMENT ON COLUMN profiles.new_field IS 'Description of the new field';
```

### Step 3: Test Migration

```bash
# Test on development database first
supabase db push --file supabase/migrations/005_add_new_feature.sql

# Verify the changes
supabase db diff
```

### Step 4: Document Migration

Add entry to this document and update `QUICKSTART.md` if needed.

## Rollback Procedures

### Manual Rollback

Create a rollback migration that reverses the changes:

```sql
-- Rollback for 005_add_new_feature.sql
ALTER TABLE profiles DROP COLUMN IF EXISTS new_field;
```

### Using Supabase CLI

```bash
# Reset database to specific migration
supabase db reset --version 004

# This will drop and recreate the database up to migration 004
```

**WARNING:** `db reset` will delete all data. Only use in development!

## Migration Best Practices

### DO:
- ✅ Always test migrations on development first
- ✅ Use transactions for complex migrations
- ✅ Add comments to explain complex logic
- ✅ Create indexes for frequently queried columns
- ✅ Use `IF EXISTS` / `IF NOT EXISTS` for idempotency
- ✅ Document breaking changes
- ✅ Backup production database before applying

### DON'T:
- ❌ Modify existing migration files after they're applied
- ❌ Skip migrations or apply out of order
- ❌ Apply untested migrations to production
- ❌ Delete data without explicit confirmation
- ❌ Forget to update RLS policies for new tables
- ❌ Commit sensitive data in migrations

## Common Migration Patterns

### Adding a Column

```sql
-- Add column with default value
ALTER TABLE profiles 
ADD COLUMN new_field TEXT DEFAULT 'default_value';

-- Add NOT NULL column (requires default or backfill)
ALTER TABLE profiles 
ADD COLUMN required_field TEXT NOT NULL DEFAULT 'value';

-- Add comment
COMMENT ON COLUMN profiles.new_field IS 'Description';
```

### Adding an Index

```sql
-- Simple index
CREATE INDEX idx_profiles_email ON profiles(email);

-- Partial index (for soft deletes)
CREATE INDEX idx_profiles_active 
ON profiles(email) 
WHERE deleted_at IS NULL;

-- Composite index
CREATE INDEX idx_test_attempts_lookup 
ON test_attempts(profile_id, lesson_id, completed_at DESC);
```

### Adding a Foreign Key

```sql
-- Add foreign key with cascade
ALTER TABLE new_table
ADD CONSTRAINT fk_new_table_profile
FOREIGN KEY (profile_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add foreign key with set null
ALTER TABLE new_table
ADD CONSTRAINT fk_new_table_manager
FOREIGN KEY (manager_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;
```

### Adding RLS Policies

```sql
-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add SELECT policy
CREATE POLICY "Users can view their hospital's data"
ON new_table
FOR SELECT
USING (hospital_id = auth.user_hospital_id());

-- Add INSERT policy
CREATE POLICY "Managers can insert data"
ON new_table
FOR INSERT
WITH CHECK (
    hospital_id = auth.user_hospital_id()
    AND auth.is_manager()
);
```

### Modifying Existing Data

```sql
-- Use transaction for data modifications
BEGIN;

-- Update existing records
UPDATE profiles 
SET new_field = 'migrated_value'
WHERE new_field IS NULL;

-- Verify changes
SELECT COUNT(*) FROM profiles WHERE new_field IS NULL;

-- Commit if everything looks good
COMMIT;
-- Or rollback if there's an issue
-- ROLLBACK;
```

## Environment-Specific Migrations

### Development

- Apply migrations directly via Supabase Dashboard
- Use `supabase db reset` freely for testing
- Test rollback procedures

### Staging

- Apply migrations via Supabase CLI
- Test with production-like data
- Verify RLS policies work correctly
- Monitor performance impact

### Production

- **ALWAYS backup database first**
- Apply during low-traffic hours
- Use Supabase CLI with explicit confirmation
- Monitor for errors immediately after
- Have rollback plan ready
- Document the deployment

## Backup and Recovery

### Before Major Migrations

```bash
# Backup via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Or via pg_dump
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
# Restore via psql
psql "$DATABASE_URL" < backup_20240115_120000.sql

# Or via Supabase CLI
supabase db push --file backup_20240115_120000.sql
```

## Troubleshooting

### Migration Fails with "relation already exists"

**Cause:** Migration was partially applied or run twice

**Solution:**
```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS new_table (...);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS new_field TEXT;
```

### RLS Policy Blocks Legitimate Access

**Cause:** Policy is too restrictive or helper function returns NULL

**Solution:**
```sql
-- Check helper function
SELECT auth.user_hospital_id();
SELECT auth.user_role();

-- Temporarily disable RLS for debugging (development only!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Migration Timeout

**Cause:** Migration is too large or complex

**Solution:**
- Break into smaller migrations
- Add indexes after data is loaded
- Use `CONCURRENTLY` for index creation (doesn't lock table)

```sql
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### Foreign Key Constraint Violation

**Cause:** Referenced data doesn't exist

**Solution:**
```sql
-- Check for orphaned records before adding constraint
SELECT * FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;

-- Clean up orphaned records
DELETE FROM child_table
WHERE parent_id NOT IN (SELECT id FROM parent_table);

-- Then add constraint
ALTER TABLE child_table
ADD CONSTRAINT fk_child_parent
FOREIGN KEY (parent_id) REFERENCES parent_table(id);
```

## Migration Checklist

Before applying any migration to production:

- [ ] Migration tested on development database
- [ ] Migration tested on staging with production-like data
- [ ] Backup created and verified
- [ ] RLS policies updated if new tables added
- [ ] Indexes added for new columns that will be queried
- [ ] Comments added for documentation
- [ ] Rollback procedure documented
- [ ] Team notified of deployment window
- [ ] Monitoring dashboard ready
- [ ] Low-traffic time window selected

## Monitoring After Migration

After applying a migration, monitor:

1. **Error Logs:** Check for SQL errors or constraint violations
2. **Performance:** Monitor query performance for affected tables
3. **RLS Policies:** Verify users can access data correctly
4. **Application Logs:** Check for application errors
5. **User Reports:** Monitor for user-reported issues

## References

- [Supabase Migrations Documentation](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For migration issues:
1. Check this documentation
2. Review Supabase logs in dashboard
3. Check PostgreSQL error messages
4. Contact database administrator
5. Review Supabase community forums
