# Task 033: Mailbox Communication BDD Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-032-task-management-bdd.md"]

## Description

Implement BDD scenarios for Mailbox Communication feature including direct messaging, broadcasting, and shutdown protocol.

## Files to Create

- `features/mailbox-communication.feature` - Gherkin feature file
- `tests/bdd/mailbox-communication.steps.ts` - Step definitions

## Scenario Implementation

Implement the following scenarios:

1. **Send direct message to teammate**
   - Given team has members "lead" and "worker-1"
   - When SendMessage is called with type: "message", recipient: "worker-1"
   - Then message is written to worker-1's inbox

2. **Message delivery is automatic**
   - Given message is waiting in inbox
   - When recipient has next inference
   - Then messages are injected into context as XML

3. **Message delivered only to intended recipient**
   - Given team has members "lead", "worker-1", "worker-2"
   - When SendMessage sends to "worker-1"
   - Then message appears in worker-1's inbox
   - And message does NOT appear in worker-2's inbox
   - And message does NOT appear in lead's inbox

4. **Plain text output is NOT visible to teammates**
   - Given agent generates plain text output
   - When output is generated to user
   *Then teammates do NOT see the output
   - Only SendMessage tool content is shared

5. **Broadcast message to all teammates**
   - Given team has lead and 3 members
   - When SendMessage is called with type: "broadcast"
   - Then message is written to all 3 members' inboxes
   - And message is NOT written to lead's inbox

6. **Broadcast delivers to all N teammates**
   - Given team has 5 members
   - When broadcast is sent
   - Then all 5 members receive message

7. **Broadcast excludes sender**
   - Given member "worker-2" sends broadcast
   - When broadcast is processed
   - Then all other members receive message
   - And worker-2 does NOT receive own broadcast

8. **Send shutdown request to member**
   - Given team has member "worker-3"
   - When SendMessage sends type: "shutdown_request"
   - Then shutdown_request is written to worker-3's inbox
   - And request_id is included

9. **Shutdown response with approval**
   - Given member received shutdown_request with request_id: "abc-123"
   - When member responds with shutdown_response, approve: true
   *Then response is delivered to team lead
   - And request_id matches original request

10. **Shutdown response with rejection and reason**
    - Given member received shutdown_request
    - When member responds with shutdown_response, approve: false, reason: "Busy"
    *Then rejection is delivered to team lead
    - And reason is included in response

11. **Shutdown protocol includes request_id**
    - Given shutdown request is sent
    *Then request_id is unique
    - And request_id is included in message

12. **Response matches request_id**
    - Given shutdown request has request_id: "xyz-789"
    - When response is received
    *Then response has matching request_id

13. **Message summary provided for UI preview**
    - Given message content is long
    *When summary is generated
    *Then summary is 5-10 words
    - And summary captures main point

14. **Summary limited to 5-10 words**
    - Given message content has 20 words
    *When summary is generated
    *Then summary has exactly 10 words
    - And ends with "..."

15. **Idle notification sent to team lead**
    - Given member "worker-4" completes work and goes idle
    *When member goes idle
    *Then idle notification is sent to team lead

16. **Team lead does not auto-respond to idle during shutdown**
    - Given team lead has requested shutdown
    - And member sends idle notification
    *Then team lead does NOT auto-respond to idle
    - Shutdown protocol continues

17. **Peer DM visibility (summary only)**
    - Given members "worker-a" and "worker-b" communicate
    *When worker-a sends DM to worker-b
    *Then only summary is shown in UI
    - Full content is only between the two

18. **Message persists if recipient offline**
    - Given message is sent to "offline-member"
    - And "offline-member" is not running
    *When message is sent
    *Then message is written to inbox file
    - Message remains until recipient comes online

19. **Message queue processed on next inference**
    - Given recipient has 3 pending messages
    *When recipient has next inference
    *Then all 3 messages are injected as XML
    - And inbox is cleared after processing

## Verification

Run BDD tests: `pnpm test tests/bdd/mailbox-communication.steps.ts`

Ensure all 19 scenarios pass.