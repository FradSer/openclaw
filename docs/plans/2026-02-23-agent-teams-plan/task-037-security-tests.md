# Task 037: Security & Path Traversal Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-036-e2e-workflows.md"]

## Description

Create security tests for path traversal prevention, team isolation, and permission validation.

## Files to Create

- `tests/security/path-traversal.test.ts` - Path traversal tests
- `tests/security/team-isolation.test.ts` - Team isolation tests
- `tests/security/permissions.test.ts` - Permission tests

## Test Requirements

### Path Traversal Tests

1. Test team name with "../" is rejected
2. Test team name with absolute path is rejected
3. Test session key with special characters is sanitized
4. Test team name with null bytes is rejected
5. Test team name over 50 characters is rejected
6. Test directory creation prevents directory traversal

### Team Isolation Tests

7. Test team A cannot access team B's ledger
8. Test team A cannot read team B's messages
9. Test task operations are scoped to team
10. Test member operations are scoped to team
11. Test inbox directories are per-team isolated

### Permission Tests

12. Test only team lead can create team
13. Test only team lead can spawn teammates
14. Test only team lead can initiate shutdown
15. Test only team members can claim tasks
16. Test only task owner can complete task
17. Test messages can only be sent within same team

### Input Validation Tests

18. Test SQL injection prevention in task descriptions
19. Test XSS prevention in message content
20. Test message size limit enforcement (100KB)

## Verification

Run security tests: `pnpm test tests/security/`

Ensure all security controls are in place.