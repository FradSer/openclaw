# Task 040: Documentation & Examples

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-039-cleanup.md"]

## Description

Create documentation and example usage for the agent teams system.

## Files to Create

- `docs/agent-teams.md` - User documentation
- `examples/teams/simple-workflow.ts` - Example workflow
- `examples/teams/complex-dependencies.ts` - Example with dependencies
- `examples/teams/shutdown-protocol.ts` - Example shutdown workflow

## Documentation Contents

### User Documentation

1. **Overview**
   - What are agent teams?
   - When to use teams vs single agents
   - Team capabilities

2. **Creating Teams**
   - TeamCreate tool usage
   - Team parameters
   - Team naming conventions

3. **Managing Teammates**
   - TeammateSpawn tool usage
   - Choosing agent types
   - Assigning roles

4. **Task Management**
   - TaskCreate tool usage
   - Task dependencies
   - Task claiming workflow

5. **Communication**
   - SendMessage tool usage
   - Direct messages
   - Broadcasting
   - Shutdown protocol

6. **Best Practices**
   - Task decomposition
   - Team size recommendations
   - Avoiding circular dependencies

### Example Code

Provide working examples for:

1. Simple parallel task distribution
2. Sequential task dependencies
3. Diamond dependency pattern
4. Team shutdown with approval
5. Error handling and recovery

## Verification

1. Run all examples: `pnpm tsx examples/teams/*.ts`
2. Verify documentation examples are accurate
3. Update README with teams section

## Final Checklist

Before marking implementation complete:

- [ ] All 84 BDD scenarios pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All concurrency tests pass
- [ ] All security tests pass
- [ ] All performance benchmarks acceptable
- [ ] Documentation is complete
- [ ] Examples work correctly
- [ ] No TypeScript errors
- [ ] No ESLint warnings