# Task 015: Session State Integration

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on**: ["task-014-team-shutdown.md"]

## Description

Extend SessionEntry type with team-related fields and update session storage to persist team context.

## Files to Modify

- `src/config/sessions/types.ts` - Extend SessionEntry type
- `src/config/sessions/cache-fields.test.ts` - Add tests for new fields
- `src/config/sessions/cache-fields.ts` - Update session field handling

## Implementation Requirements

### SessionEntry Extensions

Add the following fields to SessionEntry:

1. `teamId?: string` - ID of team session belongs to
2. `teamRole?: 'lead' | 'member'` - Role in team
3. `teamName?: string` - Name of team for reference
4. `teamCapabilities?: string[]` - Assigned capabilities

### Session Cache Integration

Update session cache handling to:
1. Include new team fields in cache entries
2. Validate team field types
3. Handle team field updates

### Tests

1. Test that team fields are persisted to session
2. Test that team fields are loaded from session
3. Test that team fields merge correctly
4. Test validation of teamRole enum values

## Constraints

- Maintain backward compatibility (all team fields are optional)
- Use existing session merge pattern
- Follow existing session field conventions

## Verification

1. Run tests: `pnpm test src/config/sessions/cache-fields.test.ts`
2. Verify type checking passes for new fields
3. Ensure existing session tests still pass

## BDD Scenario References

- Feature 1: Team Lifecycle (Session state scenarios)
- Feature 5: Team Lead Coordination (Scenario 12)