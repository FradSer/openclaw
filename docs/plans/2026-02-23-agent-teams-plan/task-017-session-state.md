# Task 017: Session State Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-016-session-state-tests.md"]

## Description

Implement session state integration for tracking team membership.

## BDD Scenario

```gherkin
Feature: Session State Implementation
  As a developer
  I want session tracking
  So that team context is maintained

  # Must pass all scenarios from Task 016
  Scenario: Session tracks team membership
    Given a session
    When it joins a team
    Then team context is stored
```

## Files to Create

- `src/teams/state-injection.ts` - Session state implementation

## Implementation Requirements

### SessionEntry Extensions

```typescript
export type SessionEntry = {
  // ... existing fields ...
  teamId?: string; // ID of team session belongs to
  teamRole?: "lead" | "member"; // Role in team
  teamCapabilities?: string[]; // Assigned capabilities
};
```

## Verification

Run tests: `pnpm test src/teams/state-injection.test.ts`

Ensure all tests pass (GREEN).
