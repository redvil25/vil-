/**
 * Utilities for generating DynamoDB partition keys (PK) and sort keys (SK)
 * following single-table design patterns
 */

/**
 * Generate user partition key
 */
export const userPK = (userId: string): `USER#${string}` => `USER#${userId}`;

/**
 * Generate profile sort key (constant)
 */
export const profileSK = (): 'PROFILE' => 'PROFILE';

/**
 * Generate metadata sort key (constant)
 */
export const metadataSK = (): 'METADATA' => 'METADATA';

/**
 * Extract user ID from user partition key
 */
export const extractUserIdFromPK = (pk: string): string => {
  return pk.replace('USER#', '');
};

/**
 * Generate current ISO timestamp
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Convert ISO timestamp to Unix timestamp (milliseconds)
 * Used for GSI sorting where DynamoDB requires numeric sort keys
 * @param isoString - ISO 8601 timestamp string (e.g., "2024-01-15T10:30:00.000Z")
 * @returns Unix timestamp in milliseconds
 */
export const isoToTimestamp = (isoString: string): number => {
  return new Date(isoString).getTime();
};

/**
 * Convert Unix timestamp back to ISO string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO 8601 timestamp string
 */
export const timestampToISO = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

/**
 * Validate that a string is a valid UUID v4
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Add your own entity key generators below
