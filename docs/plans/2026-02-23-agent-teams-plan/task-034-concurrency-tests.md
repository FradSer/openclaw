# Task 034: Concurrency Control Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-033-mailbox-bdd.md"]

## Description

Create tests for concurrency control features including WAL mode, atomic operations, retry logic, and connection pooling.

## Files to Create

- `tests/concurrency/wal-mode.test.ts` - WAL mode tests
- `tests/concurrency/atomic-operations.test.ts` - Atomic operation tests
- `tests/concurrency/retry-logic.test.ts` - Retry logic tests
- `tests/concurrency/connection-pool.test.ts` - Connection pool tests

## Test Requirements

### WAL Mode Tests

1. Test WAL mode is enabled on database open
2. Test multiple readers can read during single write
3. Test write operation blocks other writers
4. Test concurrent reads don't block each other

### Lock Levels Tests

5. Test SHARED lock for reads
6. Test RESERVED lock for write preparation
7. Test PENDING lock for write preparation
8. Test EXCLUSIVE lock for active write

### Atomic Operations Tests

9. Test atomic task claiming prevents race conditions
10. Test UPDATE with WHERE returns correct row count
11. Test zero rows affected indicates task already claimed
12. Test transaction isolation level SERIALIZABLE for claim

### Retry Logic Tests

13. Test retry on SQLITE_BUSY error
14. Test maximum retry attempts enforced
15. Test exponential backoff between retries
16. Test failure after max attempts

### Deadlock Prevention Tests

17. Test consistent lock ordering prevents deadlocks
18. Test transaction timeout enforcement
19. Test rollback on deadlock detection

### Connection Pool Tests

20. Test connection pooling handles concurrent agents
21. Test connection reuse within same session
22. Test connection cleanup on team shutdown
23. Test pool limits (if implemented)

### Checkpoint Tests

24. Test checkpoint starvation prevention
25. Test configurable WAL checkpoint threshold
26. Test manual checkpoint execution

## Verification

Run concurrency tests: `pnpm test tests/concurrency/`

Ensure all concurrency scenarios pass correctly.

## BDD Scenario References

- Feature 4: Concurrency Control (Scenarios 1-19)