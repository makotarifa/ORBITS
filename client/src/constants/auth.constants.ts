// Auth constants with i18n keys
export const AUTH_CONSTANTS = {
  LABELS: {
    EMAIL: 'auth.labels.email',
    PASSWORD: 'auth.labels.password',
    CONFIRM_PASSWORD: 'auth.labels.confirmPassword',
    USERNAME: 'auth.labels.username',
    CREATE_ACCOUNT: 'auth.labels.createAccount',
    LOGIN: 'auth.labels.login',
  },
  PLACEHOLDERS: {
    EMAIL: 'auth.placeholders.email',
    PASSWORD: 'auth.placeholders.password',
    USERNAME: 'auth.placeholders.username',
  },
  MESSAGES: {
    LOGIN_SUCCESS: 'auth.messages.loginSuccess',
    REGISTER_SUCCESS: 'auth.messages.registerSuccess',
    INVALID_CREDENTIALS: 'auth.messages.invalidCredentials',
    CREATING_ACCOUNT: 'auth.messages.creatingAccount',
    JOIN_BATTLE: 'auth.messages.joinBattle',
    ALREADY_HAVE_ACCOUNT: 'auth.messages.alreadyHaveAccount',
  },
  VALIDATION: {
    EMAIL_REQUIRED: 'auth.validation.emailRequired',
    EMAIL_INVALID: 'auth.validation.emailInvalid',
    USERNAME_REQUIRED: 'auth.validation.usernameRequired',
    USERNAME_MIN_LENGTH: 'auth.validation.usernameMinLength',
    USERNAME_MAX_LENGTH: 'auth.validation.usernameMaxLength',
    USERNAME_PATTERN: 'auth.validation.usernamePattern',
    PASSWORD_REQUIRED: 'auth.validation.passwordRequired',
    PASSWORD_MIN_LENGTH: 'auth.validation.passwordMinLength',
    PASSWORD_PATTERN: 'auth.validation.passwordPattern',
    CONFIRM_PASSWORD_REQUIRED: 'auth.validation.confirmPasswordRequired',
    PASSWORDS_NOT_MATCH: 'auth.validation.passwordsNotMatch',
  },
} as const;

export type AuthConstantKeys = typeof AUTH_CONSTANTS;