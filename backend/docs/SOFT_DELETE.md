# Soft Delete Implementation

## Overview

The SL Academy Platform implements soft delete functionality across all entities to preserve data while hiding deleted records from users. This allows for data recovery and audit trails while maintaining clean user-facing queries.

## Implementation Details

### Tables with Soft Delete

All major tables have a `deleted_at` timestamp column:
- `hospitals`
- `profiles`
- `tracks`
- `lessons`
- `questions`
- `doubts`
- `indicators`

### How It Works

1. **Soft Delete**: When a record is deleted, the `deleted_at` column is set to the current timestamp
2. **Query Filtering**: All SELECT queries filter by `deleted_at IS NULL` to exclude soft-deleted records
3. **Permanent Purge**: Records older than 90 days are permanently deleted via scheduled job

### API Endpoints

#### Delete Endpoints (Soft Delete)
- `DELETE /api/tracks/{track_id}` - Soft delete track (manager only)
- `DELETE /api/lessons/{lesson_id}` - Soft delete lesson (manager only)
- `DELETE /api/doubts/{doubt_id}` - Soft delete doubt (manager only)
- `DELETE /api/indicators/{indicator_id}` - Soft delete indicator (manager only)

#### Purge Endpoint
- `POST /api/admin/purge-deleted?dry_run=true` - Purge records older than 90 days (manager only)

### CLI Script

Run the purge operation from command line:

```bash
# Dry run (preview only)
python scripts/purge_deleted_records.py --dry-run

# Live run (actually delete)
python scripts/purge_deleted_records.py
```



### Scheduled Job Setup

For production, set up a cron job to run the purge script daily:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/backend && python scripts/purge_deleted_records.py >> /var/log/purge.log 2>&1
```

## Query Examples

### Correct (with soft delete filtering)
```python
# Get all non-deleted tracks
db.table("tracks").select("*").eq("deleted_at", None).execute()

# Get specific track (non-deleted)
db.table("tracks").select("*").eq("id", track_id).eq("deleted_at", None).single().execute()
```

### Incorrect (missing soft delete filter)
```python
# BAD - includes deleted records
db.table("tracks").select("*").execute()
```

## Requirements Satisfied

This implementation satisfies the following requirements:
- **14.1**: Soft delete sets deleted_at timestamp
- **14.2**: All queries filter out soft-deleted records
- **14.6**: Permanent purge for records older than 90 days

## Testing

Test soft delete functionality:
1. Create a record
2. Soft delete it (verify deleted_at is set)
3. Query records (verify deleted record is not returned)
4. Run purge with dry_run=true (verify old records would be purged)
5. Run purge (verify old records are permanently deleted)
