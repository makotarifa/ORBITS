// Test constants for AuthController E2E tests
export const TEST_CONSTANTS = {
  // User data
  VALID_USERNAME: 'testuser',
  VALID_EMAIL: 'test@example.com',
  VALID_PASSWORD: 'Password123',
  INVALID_EMAIL: 'invalid-email',
  SHORT_PASSWORD: 'short',
  EXISTING_USERNAME: 'existinguser',
  EXISTING_EMAIL: 'existing@example.com',

  // Error messages
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  USER_ALREADY_EXISTS: 'User already exists',
  ERROR_CREATING_USER: 'Error creating user',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_DEACTIVATED: 'Account deactivated',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',

  // Success responses
  ACCESS_TOKEN: 'mock-jwt-token',
} as const;