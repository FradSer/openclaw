# Task 035: Team Lead Coordination Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-034-concurrency-tests.md"]

## Description

Implement BDD scenarios for Team Lead Coordination feature including team discovery, task assignment, progress monitoring, and shutdown coordination.

## Files to Create

- `features/team-lead-coordination.feature` - Gherkin feature file
- `tests/bdd/team-lead-coordination.steps.ts` - Step definitions

## Scenario Implementation

Implement the following scenarios:

1. **Team lead discovers team configuration**
   - Given team lead session exists
   *When team lead queries team state
   *Then team configuration is loaded
   - Team ID, name, description are available

2. **Team lead lists all members**
   - Given team has multiple members
   *When team lead queries members
   *Then all members are listed
   - Each member has name, role, sessionKey

3. **Team lead queries member status**
   - Given member "worker-1" is working on task
   *When team lead checks member status
   *Then member's current task is shown
   - Member's lastActiveAt is visible

4. **Team lead assigns task to idle member**
   - Given team lead has pending task "Write docs"
   - And member "agent-001" is idle
   *When team lead assigns task to member
   *Then task is claimed by member
   - Task status changes to 'claimed'

5. **Task assignment by member ID order preference**
   - Given team has members "agent-001", "agent-002", "agent-003"
   - And "agent-001" and "agent-003" are idle
   *When team lead has pending task
   *Then task is assigned to "agent-001" (lower ID)

6. **Team lead monitors task completion**
   - Given member is working on task
   *When member completes task
   *Then team lead receives notification
   - Task status updates to 'completed'

7. **Team lead receives completion notification**
   - Given task is completed
   *When next inference occurs
   *Then completion info is in context
   - Unblocked tasks are identified

8. **Team lead unblocks dependent tasks**
   - Given task-A was blocking task-B
   *When task-A is completed
   *Then task-B becomes available
   - Team lead can assign task-B

9. **Team lead coordinates shutdown sequence**
   - Given team has active members
   *When team lead initiates shutdown
   *Then shutdown requests sent to all members
   - Shutdown awaits all approvals

10. **Team lead waits for all member approvals**
    - Given shutdown is pending
    - And 2 of 3 members have approved
    *When third member responds
    *Then shutdown completes after approval

11. **Team lead completes team deletion**
    - Given all members have approved shutdown
    *When team lead finalizes shutdown
    *Then team directory is deleted
    - Team is removed from system

12. **Team lead state persists across context compression**
    - Given team state is loaded
    *When context is compressed
    *Then team state is reloaded from file
    - Team information remains available

13. **Team lead knows about team after compression**
    - Given team lead experienced context compression
    *When team lead has next inference
    *Then team state is injected
    - Lead knows team name and members

14. **Team lead maintains member roster in ground truth**
    - Given team has members with various statuses
    *When team lead queries team state
    *Then member roster is shown
    - Active vs idle status is visible

15. **Team lead handles member failure gracefully**
    - Given member stops responding
    *When team lead detects failure
    *Then failure is logged
    - Team continues with remaining members

16. **Team lead spawns replacement member**
    - Given member has failed
    *When team lead spawns replacement
    *Then new member is added to team
    *New member is assigned tasks from failed member

17. **Team lead reports progress to user**
    - Given tasks are being completed
    *When team lead has periodic updates
    *Then progress is reported to user
    - Completed/remaining counts shown

18. **Team lead synthesizes results from members**
    - Given all members have completed work
    *When team lead has final inference
    *Then results are synthesized
    - Summary is provided to user

## Verification

Run BDD tests: `pnpm test tests/bdd/team-lead-coordination.steps.ts`

Ensure all 18 scenarios pass.