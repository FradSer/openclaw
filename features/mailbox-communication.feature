Feature: Mailbox Communication
  As a team member
  I want to send messages to teammates
  So that we can coordinate and share information

  Background:
    Given the state directory is "/tmp/test-teams"
    And the team "msg-team" exists
    And team has members "lead", "worker-1", "worker-2"

  Scenario: Send direct message to teammate
    When SendMessage is called with type: "message", recipient: "worker-1"
    Then message is written to worker-1's inbox

  Scenario: Message delivery is automatic
    Given message is waiting in inbox
    When recipient has next inference
    Then messages are injected into context as XML

  Scenario: Message delivered only to intended recipient
    When SendMessage sends to "worker-1"
    Then message appears in worker-1's inbox
    And message does NOT appear in worker-2's inbox
    And message does NOT appear in lead's inbox

  Scenario: Plain text output is NOT visible to teammates
    Given agent generates plain text output
    When output is generated to user
    Then teammates do NOT see the output
    And only SendMessage tool content is shared

  Scenario: Broadcast message to all teammates
    When SendMessage is called with type: "broadcast"
    Then message is written to all 2 members' inboxes
    And message is NOT written to lead's inbox

  Scenario: Broadcast delivers to all N teammates
    Given team has 5 members
    When broadcast is sent
    Then all 5 members receive message

  Scenario: Broadcast excludes sender
    Given member "worker-2" sends broadcast
    When broadcast is processed
    Then all other members receive message
    And worker-2 does NOT receive own broadcast

  Scenario: Send shutdown request to member
    When SendMessage sends type: "shutdown_request"
    Then shutdown_request is written to worker-1's inbox
    And request_id is included

  Scenario: Shutdown response with approval
    Given member received shutdown_request with request_id: "abc-123"
    When member responds with shutdown_response, approve: true
    Then response is delivered to team lead
    And request_id matches original request

  Scenario: Shutdown response with rejection and reason
    Given member received shutdown_request
    When member responds with shutdown_response, approve: false, reason: "Busy"
    Then rejection is delivered to team lead
    And reason is included in response

  Scenario: Shutdown protocol includes request_id
    When shutdown request is sent
    Then request_id is unique
    And request_id is included in message

  Scenario: Response matches request_id
    Given shutdown request has request_id: "xyz-789"
    When response is received
    Then response has matching request_id

  Scenario: Message summary provided for UI preview
    Given message content is long
    When summary is generated
    Then summary is 5-10 words
    And summary captures main point

  Scenario: Summary limited to 5-10 words
    Given message content has 20 words
    When summary is generated
    Then summary has exactly 10 words
    And ends with "..."

  Scenario: Idle notification sent to team lead
    Given member "worker-4" completes work and goes idle
    When member goes idle
    Then idle notification is sent to team lead

  Scenario: Team lead does not auto-respond to idle during shutdown
    Given team lead has requested shutdown
    And member sends idle notification
    Then team lead does NOT auto-respond to idle
    And shutdown protocol continues

  Scenario: Peer DM visibility (summary only)
    Given members "worker-a" and "worker-b" communicate
    When worker-a sends DM to worker-b
    Then only summary is shown in UI
    And full content is only between the two

  Scenario: Message persists if recipient offline
    Given message is sent to "offline-member"
    And "offline-member" is not running
    When message is sent
    Then message is written to inbox file
    And message remains until recipient comes online

  Scenario: Message queue processed on next inference
    Given recipient has 3 pending messages
    When recipient has next inference
    Then all 3 messages are injected as XML
    And inbox is cleared after processing