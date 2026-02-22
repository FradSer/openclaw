# Task 038: Performance & Resource Limits

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-037-security-tests.md"]

## Description

Implement performance tests and enforce resource limits including team count, member count, task count, and message size.

## Files to Create

- `src/teams/limits.ts` - Resource limit enforcement
- `tests/performance/resource-limits.test.ts` - Resource limit tests
- `tests/performance/benchmarks.test.ts` - Performance benchmarks

## Implementation Requirements

### Resource Limits

Enforce the following limits in team operations:

- Max teams: 10 (configurable)
- Max members per team: 10
- Max tasks per team: 1000
- Max message size: 100KB
- Max task description: 10KB
- Max task subject: 200 characters

### Limits Validation

Implement validation functions that:
1. Check team count before creating new team
2. Check member count before adding member
3. Check task count before adding task
4. Validate message size before sending
5. Validate task description length before creating

### Performance Benchmarks

Create benchmarks for:

1. Task claiming under load (100 concurrent claims)
2. Task list query with 1000 tasks
3. Message injection with 100 pending messages
4. Team state loading with 100 members
5. Dependency resolution with 100 dependent tasks

## Verification

Run tests: `pnpm test tests/performance/`

Ensure all limits are enforced and benchmarks pass.