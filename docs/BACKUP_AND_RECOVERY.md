# Backup and Recovery Guide

## Overview

The SL Academy Platform includes comprehensive backup and recovery procedures to protect against data loss and ensure business continuity.

## Backup Strategy

### Backup Types

1. **Automated Daily Backups**
   - Frequency: Daily at 2:00 AM (configurable)
   - Retention: 30 days
   - Location: `./backups/` directory
   - Format: Compressed SQL dumps (.sql.gz)

2. **Manual Backups**
   - On-demand backups before major changes
   - Pre-deployment backups
   - Testing and development snapshots

3. **Point-in-Time Recovery (Supabase)**
   - Supabase provides automatic PITR
   - Available for Pro plan and above
   - Retention: 7-30 days depending on plan

### What is Backed Up

- ✅ All database tables and data
- ✅ Database schema and structure
- ✅ Indexes and constraints
- ✅ Triggers and functions
- ✅ Row Level Security policies
- ✅ User roles and permissions

### What is NOT Backed Up

- ❌ Supabase Storage files (images, videos)
- ❌ Application code
- ❌ Environment variables
- ❌ Server configurations

**Note**: Supabase Storage should be backed up separately using Supabase CLI or S3 sync.

## Setup Instructions

### 1. Install Dependencies

```bash
# Install PostgreSQL client tools
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Configure Environment Variables

Add to `backend/.env`:

```bash
# Backup Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

### 3. Set Up Automated Backups

```bash
cd backend/scripts

# Make scripts executable
chmod +x backup_database.py
chmod +x restore_database.py
chmod +x setup_backup_cron.sh

# Set up daily automated backups
./setup_backup_cron.sh
```

This will:
- Create backup and log directories
- Configure cron job for daily backups at 2 AM
- Set up log rotation

### 4. Verify Setup

```bash
# Test backup manually
python3 backend/scripts/backup_database.py

# Check backup was created
ls -lh backups/

# View backup logs
tail -f backend/logs/backup.log
```

## Manual Backup

### Create Backup

```bash
cd backend

# Set environment variables
export DATABASE_URL="your-database-url"
export BACKUP_DIR="./backups"

# Run backup script
python3 scripts/backup_database.py
```

**Output**:
```
============================================================
SL Academy Platform - Database Backup
============================================================
Backup directory: /path/to/backups
Starting backup to /path/to/backups/sl_academy_backup_20240314_120000.sql
Backup completed successfully: /path/to/backups/sl_academy_backup_20240314_120000.sql
Backup size: 15.43 MB
Compressing backup: /path/to/backups/sl_academy_backup_20240314_120000.sql
Compression completed: /path/to/backups/sl_academy_backup_20240314_120000.sql.gz
Compressed size: 3.21 MB
Backup verification passed: /path/to/backups/sl_academy_backup_20240314_120000.sql.gz
Cleaning up backups older than 30 days
Deleted 2 old backup(s)
============================================================
Backup completed successfully
============================================================
```

### Using pg_dump Directly

```bash
# Basic backup
pg_dump "$DATABASE_URL" > backup.sql

# Compressed backup
pg_dump "$DATABASE_URL" | gzip > backup.sql.gz

# Backup specific tables
pg_dump "$DATABASE_URL" -t profiles -t tracks > partial_backup.sql

# Backup schema only (no data)
pg_dump "$DATABASE_URL" --schema-only > schema.sql

# Backup data only (no schema)
pg_dump "$DATABASE_URL" --data-only > data.sql
```

## Restore Procedures

### Interactive Restore

```bash
cd backend

# Set environment variables
export DATABASE_URL="your-database-url"
export BACKUP_DIR="./backups"

# Run restore script
python3 scripts/restore_database.py
```

**Interactive Prompts**:
```
============================================================
SL Academy Platform - Database Restore
============================================================

Available backups:
------------------------------------------------------------
1. sl_academy_backup_20240314_120000.sql.gz
   Date: 2024-03-14 12:00:00
   Size: 3.21 MB

2. sl_academy_backup_20240313_020000.sql.gz
   Date: 2024-03-13 02:00:00
   Size: 3.15 MB

Select backup to restore (1-2) or 'q' to quit: 1
Perform dry run first? (y/n): y
DRY RUN: Would restore from /path/to/backups/sl_academy_backup_20240314_120000.sql.gz
No changes made to database
```

### Direct Restore

```bash
# Restore from compressed backup
gunzip -c backup.sql.gz | psql "$DATABASE_URL"

# Restore from uncompressed backup
psql "$DATABASE_URL" < backup.sql

# Restore with verbose output
psql "$DATABASE_URL" -f backup.sql -v ON_ERROR_STOP=1
```

### Restore Specific Tables

```bash
# Extract specific table from backup
pg_restore -t profiles backup.sql | psql "$DATABASE_URL"

# Or using grep (for SQL dumps)
grep -A 1000 "CREATE TABLE profiles" backup.sql | psql "$DATABASE_URL"
```

## Recovery Scenarios

### Scenario 1: Accidental Data Deletion

**Situation**: User accidentally deleted important records

**Recovery Steps**:
1. Identify when deletion occurred
2. Find most recent backup before deletion
3. Restore to temporary database
4. Extract deleted records
5. Insert records into production database

```bash
# 1. Restore to temporary database
createdb temp_restore
gunzip -c backup.sql.gz | psql "postgresql://localhost/temp_restore"

# 2. Extract deleted records
psql "postgresql://localhost/temp_restore" -c "COPY (SELECT * FROM profiles WHERE id IN ('id1', 'id2')) TO STDOUT" > deleted_records.csv

# 3. Import to production
psql "$DATABASE_URL" -c "\COPY profiles FROM 'deleted_records.csv' CSV"

# 4. Clean up
dropdb temp_restore
```

### Scenario 2: Database Corruption

**Situation**: Database is corrupted and won't start

**Recovery Steps**:
1. Stop application
2. Restore from most recent backup
3. Verify data integrity
4. Restart application

```bash
# 1. Stop application
# (Stop backend server)

# 2. Restore database
python3 scripts/restore_database.py

# 3. Verify data integrity
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM profiles;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM tracks;"

# 4. Restart application
# (Start backend server)
```

### Scenario 3: Failed Migration

**Situation**: Database migration failed and left database in inconsistent state

**Recovery Steps**:
1. Create backup of current state (for forensics)
2. Restore from backup before migration
3. Fix migration script
4. Re-run migration

```bash
# 1. Backup current state
python3 scripts/backup_database.py

# 2. Restore from before migration
python3 scripts/restore_database.py
# Select backup from before migration

# 3. Fix migration script
# Edit migration file

# 4. Re-run migration
psql "$DATABASE_URL" -f supabase/migrations/XXX_fixed_migration.sql
```

### Scenario 4: Complete Data Loss

**Situation**: Entire database is lost

**Recovery Steps**:
1. Create new database
2. Restore from most recent backup
3. Verify all data
4. Update application configuration
5. Test thoroughly before going live

```bash
# 1. Database should be recreated by Supabase

# 2. Restore from backup
python3 scripts/restore_database.py

# 3. Verify data
psql "$DATABASE_URL" << EOF
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'tracks', COUNT(*) FROM tracks
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'doubts', COUNT(*) FROM doubts
UNION ALL
SELECT 'indicators', COUNT(*) FROM indicators;
EOF

# 4. Test application
curl http://localhost:8000/api/monitoring/health
```

## Backup Verification

### Automated Verification

The backup script automatically verifies:
- ✅ File exists
- ✅ File is not empty
- ✅ Compressed file integrity (gzip -t)

### Manual Verification

```bash
# Check backup file
ls -lh backups/sl_academy_backup_*.sql.gz

# Test gzip integrity
gzip -t backups/sl_academy_backup_20240314_120000.sql.gz

# Decompress and check SQL
gunzip -c backups/sl_academy_backup_20240314_120000.sql.gz | head -n 50

# Count tables in backup
gunzip -c backups/sl_academy_backup_20240314_120000.sql.gz | grep "CREATE TABLE" | wc -l

# Restore to test database
createdb test_restore
gunzip -c backups/sl_academy_backup_20240314_120000.sql.gz | psql "postgresql://localhost/test_restore"
psql "postgresql://localhost/test_restore" -c "\dt"
dropdb test_restore
```

## Backup Monitoring

### Check Backup Status

```bash
# View recent backups
ls -lht backups/ | head -n 10

# Check backup logs
tail -f backend/logs/backup.log

# Check cron logs
tail -f backend/logs/backup_cron.log

# Verify cron job is configured
crontab -l | grep backup
```

### Backup Alerts

Configure alerts for backup failures:

```bash
# Add to backup script or cron wrapper
if [ $? -ne 0 ]; then
    # Send alert
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"❌ Database backup failed!"}'
fi
```

## Best Practices

### DO

- ✅ Test restore procedures regularly (monthly)
- ✅ Store backups in multiple locations
- ✅ Encrypt backups containing sensitive data
- ✅ Monitor backup success/failure
- ✅ Document recovery procedures
- ✅ Keep backup retention policy documented
- ✅ Test backups before major changes
- ✅ Automate backup verification

### DON'T

- ❌ Store backups only on same server as database
- ❌ Ignore backup failures
- ❌ Skip testing restore procedures
- ❌ Delete backups without verification
- ❌ Store backups unencrypted in public locations
- ❌ Forget to backup Supabase Storage files
- ❌ Rely solely on automated backups

## Backup Storage

### Local Storage

**Pros**:
- Fast backup and restore
- No additional costs
- Full control

**Cons**:
- Risk of data loss if server fails
- Limited by disk space
- No off-site protection

### Cloud Storage (Recommended)

**AWS S3**:
```bash
# Sync backups to S3
aws s3 sync ./backups/ s3://your-bucket/sl-academy-backups/

# Restore from S3
aws s3 sync s3://your-bucket/sl-academy-backups/ ./backups/
```

**Google Cloud Storage**:
```bash
# Upload to GCS
gsutil -m rsync -r ./backups/ gs://your-bucket/sl-academy-backups/

# Download from GCS
gsutil -m rsync -r gs://your-bucket/sl-academy-backups/ ./backups/
```

**Supabase Storage**:
```bash
# Upload using Supabase CLI
supabase storage cp ./backups/backup.sql.gz supabase://backups/backup.sql.gz
```

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target**: < 4 hours

- Database restore: 30 minutes
- Application deployment: 30 minutes
- Verification and testing: 2 hours
- DNS propagation: 1 hour

### Recovery Point Objective (RPO)

**Target**: < 24 hours

- Daily backups ensure maximum 24-hour data loss
- For critical systems, consider hourly backups

### Emergency Contacts

Document emergency contacts:
- Database Administrator
- DevOps Team
- Supabase Support
- On-call Engineer

### Recovery Checklist

- [ ] Assess extent of data loss
- [ ] Notify stakeholders
- [ ] Identify most recent valid backup
- [ ] Create backup of current state (if possible)
- [ ] Restore from backup
- [ ] Verify data integrity
- [ ] Test critical functionality
- [ ] Update DNS if needed
- [ ] Monitor for issues
- [ ] Document incident
- [ ] Conduct post-mortem

## Troubleshooting

### Backup Fails with "pg_dump: command not found"

**Solution**: Install PostgreSQL client tools

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Backup Fails with "connection refused"

**Solution**: Check DATABASE_URL and network connectivity

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check firewall rules
# Ensure Supabase IP is allowed
```

### Restore Fails with "permission denied"

**Solution**: Use service_role key or admin user

```bash
# Use service role key in DATABASE_URL
export DATABASE_URL="postgresql://postgres:[SERVICE_KEY]@..."
```

### Backup File is Too Large

**Solution**: Use compression and consider incremental backups

```bash
# Compress backup
gzip backup.sql

# Or use pg_dump with compression
pg_dump "$DATABASE_URL" | gzip -9 > backup.sql.gz
```

## References

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Supabase Backup Guide](https://supabase.com/docs/guides/platform/backups)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html)

## Support

For backup and recovery issues:
1. Check backup logs
2. Verify DATABASE_URL
3. Test with manual backup
4. Review this documentation
5. Contact database administrator
6. Open support ticket with Supabase

