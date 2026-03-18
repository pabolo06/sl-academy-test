# RLS Hospital Isolation Property-Based Tests

## Overview

This directory contains property-based tests for Row Level Security (RLS) hospital isolation using the Hypothesis library.

**Task:** 1.3 Write property test for RLS hospital isolation  
**Validates:** Requirements 2.1, 2.2, 2.3

## Properties Tested

### Property 1: Hospital Data Isolation
*For any two users from different hospitals, no data item can be accessible to both users simultaneously.*

**Validates: Requirements 2.1, 2.2**

Tests:
- `test_tracks_isolated_by_hospital` - Verifies tracks are isolated between hospitals
- `test_indicators_isolated_by_hospital` - Verifies indicators are isolated between hospitals
- `test_doubts_isolated_by_hospital` - Verifies doubts are isolated through lesson ownership

### Property 2: RLS Policy Enforcement
*For any database query executed by a user, all returned rows must belong to that user's hospital.*

**Validates: Requirements 2.1, 2.3**

Tests:
- `test_rls_filters_all_queries_by_hospital` - Verifies RLS automatically filters all queries
- `test_rls_enforces_hospital_context_on_joins` - Verifies RLS cascades through JOIN operations
- `test_rls_denies_cross_hospital_access` - Verifies cross-hospital access is denied

## Prerequisites

### 1. Install Dependencies

```bash
cd backend
pip install hypothesis==6.92.0 pytest pytest-asyncio httpx supabase python-dotenv
```

### 2. Configure Environment

Ensure your `.env` file has valid Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 3. Apply Database Migrations

The tests require the following migrations to be applied:

1. `001_init_schema.sql` - Core database schema
2. `002_rls_policies_fixed.sql` - RLS policies
3. `006_test_helper_functions.sql` - Test helper functions (optional)

Apply migrations through Supabase SQL Editor or using the Supabase CLI:

```bash
supabase db push
```

## Running the Tests

### Run All RLS Tests

```bash
cd backend
python -m pytest tests/test_rls_hospital_isolation.py -v
```

### Run Specific Property Tests

```bash
# Test Property 1: Hospital Data Isolation
python -m pytest tests/test_rls_hospital_isolation.py::TestHospitalDataIsolation -v

# Test Property 2: RLS Policy Enforcement
python -m pytest tests/test_rls_hospital_isolation.py::TestRLSPolicyEnforcement -v
```

### Run with Hypothesis Statistics

```bash
python -m pytest tests/test_rls_hospital_isolation.py -v --hypothesis-show-statistics
```

### Run with Increased Examples

By default, Hypothesis generates 50 examples per test. To increase:

```bash
python -m pytest tests/test_rls_hospital_isolation.py -v --hypothesis-max-examples=100
```

## Test Configuration

The tests use Hypothesis with the following configuration:

- **max_examples**: 50 (default) - Number of random test cases generated
- **deadline**: None - No time limit per test case (database operations can be slow)
- **stateful testing**: Not used (tests are stateless)

## Understanding Property-Based Testing

Unlike traditional unit tests that test specific examples, property-based tests:

1. **Generate random inputs** - Hypothesis generates many random test cases
2. **Verify invariants** - Tests verify properties that should ALWAYS hold
3. **Find edge cases** - Automatically discovers edge cases you might not think of
4. **Shrink failures** - When a test fails, Hypothesis finds the minimal failing case

### Example

Traditional test:
```python
def test_tracks_isolated():
    # Test with 2 tracks
    assert hospital_a_sees_only_a_tracks()
```

Property-based test:
```python
@given(track_count=st.integers(min_value=1, max_value=10))
def test_tracks_isolated(track_count):
    # Test with 1, 2, 3, ..., 10 tracks (50 random combinations)
    assert hospital_a_sees_only_a_tracks()
```

## Test Structure

Each test follows this pattern:

1. **Setup** - Create test hospitals and users
2. **Generate data** - Create random test data using Hypothesis strategies
3. **Execute** - Query data with hospital context
4. **Assert properties** - Verify isolation properties hold
5. **Cleanup** - Delete test data

## Troubleshooting

### Supabase Connection Errors

If you see connection errors:

1. Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
2. Check that your Supabase project is running
3. Verify network connectivity to Supabase

### RLS Policy Errors

If tests fail due to RLS policy violations:

1. Ensure `002_rls_policies_fixed.sql` is applied (not `002_rls_policies.sql`)
2. Verify helper functions exist: `public.user_hospital_id()`, `public.is_manager()`
3. Check that RLS is enabled on all tables

### Hypothesis Errors

If Hypothesis reports flaky tests:

1. Check for non-deterministic behavior in your code
2. Ensure test cleanup is working properly
3. Verify database state is reset between tests

## CI/CD Integration

To run these tests in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run RLS Property Tests
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: |
    cd backend
    pip install -r requirements.txt
    python -m pytest tests/test_rls_hospital_isolation.py -v --hypothesis-max-examples=100
```

## Further Reading

- [Hypothesis Documentation](https://hypothesis.readthedocs.io/)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

## Notes

- These tests use the **service role key** which bypasses RLS for setup/cleanup
- In production, user queries would use the **anon key** with user context
- Tests create and delete real data in your Supabase database
- Run tests against a **development/test database**, not production
