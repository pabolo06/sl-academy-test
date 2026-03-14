# Backup Quick Start Guide

## Setup (10 minutes)

### 1. Install PostgreSQL Client

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Configure Environment

Add to `backend/.env`:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

### 3. Set Up Automated Backups

```bash
cd backend/scripts
chmod +x *.sh *.py
./setup_backup_cron.sh
```

Done! Backups will run daily at 2 AM.

## Quick Commands

### Create Backup

```bash
cd backend
python3 scripts/backup_database.py
```

### Restore Backup

```bash
cd backend
python3 scripts/restore_database.py
```

### List Backups

```bash
ls -lht backups/
```

### View Logs

```bash
tail -f backend/logs/backup.log
```

## Common Tasks

### Test Backup

```bash
# Create test backup
python3 backend/scripts/backup_database.py

# Verify it was created
ls -lh backups/sl_academy_backup_*.sql.gz

# Check integrity
gzip -t backups/sl_academy_backup_*.sql.gz
```

### Manual Backup Before Changes

```bash
# Before deployment or major changes
cd backend
export DATABASE_URL="your-database-url"
python3 scripts/backup_database.py
```

### Restore from Specific Backup

```bash
cd backend
python3 scripts/restore_database.py
# Select backup from list
# Confirm restore
```

### Sync Backups to Cloud

```bash
# AWS S3
aws s3 sync ./backups/ s3://your-bucket/backups/

# Google Cloud
gsutil -m rsync -r ./backups/ gs://your-bucket/backups/
```

## Troubleshooting

### "pg_dump: command not found"

Install PostgreSQL client tools (see step 1 above)

### "connection refused"

Check DATABASE_URL:
```bash
psql "$DATABASE_URL" -c "SELECT 1"
```

### Backup not running automatically

Check cron:
```bash
crontab -l | grep backup
tail -f backend/logs/backup_cron.log
```

## Recovery Scenarios

### Restore Latest Backup

```bash
python3 backend/scripts/restore_database.py
# Select option 1 (most recent)
# Type 'RESTORE' to confirm
```

### Restore Specific Date

```bash
python3 backend/scripts/restore_database.py
# Find backup from desired date
# Select that option
# Type 'RESTORE' to confirm
```

## Best Practices

- ✅ Test restore monthly
- ✅ Keep 30 days of backups
- ✅ Store backups off-site
- ✅ Monitor backup logs
- ✅ Backup before major changes

## Need Help?

See full documentation: [BACKUP_AND_RECOVERY.md](./BACKUP_AND_RECOVERY.md)
