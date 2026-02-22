# Task 030: Team State Injection

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-029-tool-registration.md"]

## Description

Implement team state injection that adds team information as "ground truth" to the system prompt, preventing context amnesia for the Team Lead.

## Files to Create

- `src/teams/state-injection.ts` - Team state injection implementation

## Implementation Requirements

### Team State Injection Function

1. `injectTeamState(session: SessionEntry, stateDir: string): Promise<string>`
   - Check if session has teamId and teamRole === 'lead'
   - Get TeamManager using getTeamManager
   - Call getTeamState to load aggregated state
   - Format team state as text
   - Return formatted string

### State Format

```typescript
function formatTeamState(state: TeamState): string {
  let output = '\n\n=== TEAM STATE ===\n';
  output += `Team: ${state.name} (${state.id})\n`;
  output += `Status: ${state.status}\n`;
  output += `Description: ${state.description || 'N/A'}\n\n`;

  output += `Members (${state.members.length}):\n`;
  for (const member of state.members) {
    const role = member.role === 'lead' ? 'Lead' : 'Member';
    output += `  - ${member.name || member.sessionKey} (${role})\n`;
  }

  output += `\nTask Counts:\n`;
  output += `  - Pending: ${state.pendingTaskCount}\n`;
  output += `  - In Progress: ${state.inProgressTaskCount}\n`;
  output += `  - Completed: ${state.completedTaskCount}\n`;

  output += '====================\n\n';
  return output;
}
```

### System Prompt Integration

Update the system prompt construction to include team state:

```typescript
// In system prompt construction function
if (session.teamId && session.teamRole === 'lead') {
  const teamState = await injectTeamState(session, stateDir);
  systemPrompt += teamState;
}
```

## Constraints

- Only inject for team lead sessions
- Include all active members with their roles
- Show current task counts by status
- Use consistent formatting

## Verification

1. Create test file `src/teams/state-injection.test.ts`
2. Test state injection for team lead
3. Test no injection for team members
4. Test no injection for non-team sessions
5. Run tests: `pnpm test src/teams/state-injection.test.ts`

## BDD Scenario References

- Feature 5: Team Lead Coordination (Scenarios 1-3, 12-14)
  - Scenario 12: Team lead state persists across context compression
  - Scenario 13: Team lead knows about team after compression
  - Scenario 14: Team lead maintains member roster in ground truth