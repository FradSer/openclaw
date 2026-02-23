/**
 * Resource Limits
 * Enforces resource limits for teams and operations
 */

/**
 * Resource limits configuration
 */
export const RESOURCE_LIMITS = {
  MAX_TEAMS: 10,
  MAX_MEMBERS_PER_TEAM: 10,
  MAX_TASKS_PER_TEAM: 1000,
  MAX_MESSAGE_SIZE: 100000, // 100KB in bytes
  MAX_TASK_DESCRIPTION_LENGTH: 10000,
  MAX_TASK_SUBJECT_LENGTH: 200,
} as const;

/**
 * Check if team count exceeds limit
 */
export function checkTeamCount(currentCount: number): boolean {
  return currentCount < RESOURCE_LIMITS.MAX_TEAMS;
}

/**
 * Check if member count exceeds limit
 */
export function checkMemberCount(currentCount: number): boolean {
  return currentCount < RESOURCE_LIMITS.MAX_MEMBERS_PER_TEAM;
}

/**
 * Check if task count exceeds limit
 */
export function checkTaskCount(currentCount: number): boolean {
  return currentCount < RESOURCE_LIMITS.MAX_TASKS_PER_TEAM;
}

/**
 * Validate message size
 */
export function validateMessageSize(message: string): { valid: boolean; error?: string } {
  const byteLength = Buffer.byteLength(message, "utf8");

  if (byteLength > RESOURCE_LIMITS.MAX_MESSAGE_SIZE) {
    return {
      valid: false,
      error: `Message size (${byteLength} bytes) exceeds limit of ${RESOURCE_LIMITS.MAX_MESSAGE_SIZE} bytes`,
    };
  }

  return { valid: true };
}

/**
 * Validate task description length
 */
export function validateTaskDescription(description: string): { valid: boolean; error?: string } {
  const length = description.length;

  if (length > RESOURCE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Task description length (${length}) exceeds limit of ${RESOURCE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate task subject length
 */
export function validateTaskSubject(subject: string): { valid: boolean; error?: string } {
  const length = subject.length;

  if (length > RESOURCE_LIMITS.MAX_TASK_SUBJECT_LENGTH) {
    return {
      valid: false,
      error: `Task subject length (${length}) exceeds limit of ${RESOURCE_LIMITS.MAX_TASK_SUBJECT_LENGTH} characters`,
    };
  }

  return { valid: true };
}
