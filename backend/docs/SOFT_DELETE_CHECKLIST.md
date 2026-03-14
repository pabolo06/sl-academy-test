# Soft Delete Implementation Checklist

## Task 27.1: Implement soft delete for all entities

### ✅ Requirement 14.1: All delete operations set deleted_at timestamp

- [x] Tracks - DELETE endpoint sets deleted_at
- [x] Lessons - DELETE endpoint sets deleted_at  
- [x] Doubts - DELETE endpoint sets deleted_at
- [x] Indicators - DELETE endpoint sets deleted_at

### ✅ Requirement 14.2: All queries filter out soft-deleted records

#### API Routes
- [x] `backend/api/routes/tracks.py` - All queries filter by deleted_at
- [x] `backend/api/routes/lessons.py` - All queries filter by deleted_at
- [x] `backend/api/routes/questions.py` - All queries filter by deleted_at
- [x] `backend/api/routes/doubts.py` - All queries filter by deleted_at
- [x] `backend/api/routes/indicators.py` - All queries filter by deleted_at
- [x] `backend/api/routes/test_attempts.py` - Lesson verification filters by deleted_at
- [x] `backend/api/routes/auth.py` - Profile query filters by deleted_at
- [x] `backend/api/routes/ai.py` - Lesson queries filter by deleted_at

#### Services
- [x] `backend/services/scoring.py` - Questions query filters by deleted_at
- [x] `backend/services/indicators.py` - Duplicate check filters by deleted_at

### ✅ Requirement 14.6: Permanent purge for records older than 90 days

- [x] Created `backend/utils/purge_deleted.py` with PurgeService
- [x] Created `backend/api/routes/admin.py` with purge endpoint
- [x] Created `backend/scripts/purge_deleted_records.py` CLI script
- [x] Registered admin router in main.py
- [x] Supports dry_run mode for safe testing
- [x] Includes audit logging

## Implementation Files

### New Files Created
1. ✅ `backend/utils/purge_deleted.py` - Purge service
2. ✅ `backend/api/routes/admin.py` - Admin endpoints
3. ✅ `backend/scripts/purge_deleted_records.py` - CLI script
4. ✅ `backend/docs/SOFT_DELETE.md` - Documentation
5. ✅ `backend/docs/TASK_27.1_SUMMARY.md` - Implementation summary
6. ✅ `backend/docs/SOFT_DELETE_CHECKLIST.md` - This checklist
7. ✅ `backend/tests/test_soft_delete.py` - Test structure

### Files Modified
1. ✅ `backend/api/routes/doubts.py` - Added deleted_at filters and DELETE endpoint
2. ✅ `backend/api/routes/indicators.py` - Added deleted_at filters and DELETE endpoint
3. ✅ `backend/api/routes/questions.py` - Added deleted_at filter
4. ✅ `backend/api/routes/auth.py` - Added deleted_at filter
5. ✅ `backend/api/routes/lessons.py` - Added deleted_at filter to questions query
6. ✅ `backend/services/scoring.py` - Added deleted_at filter
7. ✅ `backend/services/indicators.py` - Added deleted_at filter
8. ✅ `backend/main.py` - Registered admin router



## Testing Checklist

### Manual Testing
- [ ] Test DELETE /api/tracks/{id} - verify deleted_at is set
- [ ] Test DELETE /api/lessons/{id} - verify deleted_at is set
- [ ] Test DELETE /api/doubts/{id} - verify deleted_at is set
- [ ] Test DELETE /api/indicators/{id} - verify deleted_at is set
- [ ] Test GET endpoints don't return deleted records
- [ ] Test POST /api/admin/purge-deleted?dry_run=true
- [ ] Test POST /api/admin/purge-deleted (actual purge)

### Integration Testing
- [ ] Verify soft-deleted tracks hide their lessons
- [ ] Verify soft-deleted lessons hide their questions
- [ ] Verify RLS policies work with soft delete
- [ ] Verify foreign key references to deleted records return 404

### CLI Script Testing
- [ ] Run `python scripts/purge_deleted_records.py --dry-run`
- [ ] Verify output shows correct record counts
- [ ] Run actual purge and verify records are deleted
- [ ] Test error handling with invalid database connection

## Deployment Checklist

- [ ] Deploy code to staging environment
- [ ] Run manual tests on staging
- [ ] Set up cron job for purge script
- [ ] Configure monitoring/alerting for purge failures
- [ ] Update API documentation
- [ ] Deploy to production
- [ ] Monitor logs for first 24 hours

## Monitoring

### Metrics to Track
- Number of records purged per day
- Purge operation duration
- Purge operation errors
- Soft delete operation counts per entity

### Alerts to Configure
- Purge operation failures
- Purge duration exceeds threshold (e.g., 5 minutes)
- Unexpected high volume of soft deletes

## Notes

- All DELETE endpoints require manager role
- Purge endpoint requires manager role
- CLI script should be run with service account credentials
- Recommend running purge daily at low-traffic hours (e.g., 2 AM)
- Always test with dry_run first in production
