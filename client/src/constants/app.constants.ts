// App-related constants
export const APP_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Welcome to Orbits!',
  WELCOME_TITLE: 'Welcome to Orbits!',
  AUTH_SUCCESS_MESSAGE: 'Authentication successful. Game interface coming soon...',
  NO_ACCOUNT_PROMPT: "Don't have an account?",
} as const;

// Form-related constants
export const FORM_CONSTANTS = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
  },
  MESSAGES: {
    CREATING_ACCOUNT: 'Creating account...',
    LOGGING_IN: 'Logging in...',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  },
} as const;