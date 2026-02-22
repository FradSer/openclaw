# Task 005: Team Storage Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-004-storage-tests.md"]

## Description

Implement team storage operations including config file persistence, directory management, and validation functions.

## Files to Create

- `src/teams/storage.ts` - Team storage implementation

## Implementation Requirements

### Functions

1. **validateTeamName(name: string): boolean**
   - Returns true if name matches: `/^[a-zA-Z0-9_-]{1,50}$/`
   - Returns false for invalid names

2. **validateTeamNameOrThrow(name: string): void**
   - Calls validateTeamName
   - Throws ToolInputError with descriptive message if invalid

3. **createTeamDirectory(teamName: string, stateDir: string): Promise<void>**
   - Creates `{stateDir}/teams/{teamName}/` directory
   - Creates `{stateDir}/teams/{teamName}/inbox/` directory
   - Uses fs.mkdir with recursive: true

4. **writeTeamConfig(teamName: string, stateDir: string, config: TeamConfig): Promise<void>**
   - Uses atomic write pattern (write to .tmp file, then rename)
   - Writes to `{stateDir}/teams/{teamName}/config.json`
   - Sets file mode to 0o600

5. **readTeamConfig(teamName: string, stateDir: string): Promise<TeamConfig | null>**
   - Reads from `{stateDir}/teams/{teamName}/config.json`
   - Returns null if file doesn't exist
   - Parses JSON and validates structure

6. **deleteTeamDirectory(teamName: string, stateDir: string): Promise<void>**
   - Uses fs.rm with recursive: true, force: true
   - Removes `{stateDir}/teams/{teamName}/`

7. **teamDirectoryExists(teamName: string, stateDir: string): Promise<boolean>**
   - Uses fs.access to check directory existence
   - Returns boolean

### Atomic Write Pattern

Implement atomic write helper:
```typescript
async function atomicWrite(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.tmp.${randomUUID()}`;
  try {
    await fs.writeFile(tmpPath, content, { mode: 0o600 });
    await fs.rename(tmpPath, path);
  } catch (err) {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}
```

## Constraints

- All file paths must use path.join()
- Use path sanitization for team names
- Set file mode 0o600 for config files
- Handle ENOENT gracefully in read operations

## Verification

Run tests: `pnpm test src/teams/storage.test.ts`

Ensure all tests pass (GREEN).