# Task 036: Security Tests

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-035-concurrency-tests.md"]

## Description

Create security tests for path traversal, team isolation, and access control.

## Test Requirements

1. Test path traversal prevention in team names
2. Test team isolation (no cross-team access)
3. Test unauthorized access to other teams
4. Test injection prevention in user inputs

## Verification

Run: `pnpm test --security`

Ensure all security tests pass.
