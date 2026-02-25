# Task 018: Security Tests

**Phase:** 4 (Quality Assurance)
**Status:** complete
**depends-on:** []

## Description

Verify security measures prevent common vulnerabilities.

## Implementation Location

`src/teams/security.test.ts`

## BDD Scenario

```gherkin
Feature: Security
  As a developer
  I want security tests to pass
  So that the system is protected from attacks

  Scenario: Prevent path traversal in team names
    When I attempt to create team with name "../../../etc/passwd"
    Then the operation fails with validation error
    And no files are created outside ~/.openclaw/teams/

  Scenario: Prevent path traversal in session keys
    Given session key "../../../etc/passwd"
    When inbox path is created
    Then the path is sanitized
    And no directory traversal occurs

  Scenario: Enforce message size limits
    When I send a message larger than 100KB
    Then the operation fails with size limit error

  Scenario: Enforce team member limits
    Given a team has 10 members
    When I attempt to add another member
    Then the operation fails with limit error

  Scenario: Enforce task limits
    Given a team has 1000 tasks
    When I attempt to create another task
    Then the operation fails with limit error

  Scenario: Validate team name format
    When I create team with invalid name
    Then validation rejects: spaces, special chars, empty, over 50 chars
```

## Security Checks

### Path Traversal Prevention

- Team names validated against `/^[a-z0-9-]{1,50}$/`
- Session keys sanitized before path construction
- No `..` or path separators allowed

### Resource Limits

| Resource         | Limit    |
| ---------------- | -------- |
| Max teams        | 10       |
| Max members/team | 10       |
| Max tasks/team   | 1000     |
| Max message size | 100KB    |
| Max team name    | 50 chars |

### Input Validation

- Team names: alphanumeric, hyphens only
- Task subject: max 200 chars
- Task description: max 10000 chars
- Message content: max 100KB

## Verification

```bash
pnpm test src/teams/security.test.ts
```
