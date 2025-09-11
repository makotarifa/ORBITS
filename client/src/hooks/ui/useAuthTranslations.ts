import { useTranslation } from 'react-i18next';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

/**
 * Custom hook for authentication-related translations
 * Provides type-safe access to auth translation keys
 */
export const useAuthTranslations = () => {
  const { t } = useTranslation();

  return {
    labels: {
      email: t(AUTH_CONSTANTS.LABELS.EMAIL),
      password: t(AUTH_CONSTANTS.LABELS.PASSWORD),
      confirmPassword: t(AUTH_CONSTANTS.LABELS.CONFIRM_PASSWORD),
      username: t(AUTH_CONSTANTS.LABELS.USERNAME),
      createAccount: t(AUTH_CONSTANTS.LABELS.CREATE_ACCOUNT),
      login: t(AUTH_CONSTANTS.LABELS.LOGIN),
    },
    placeholders: {
      email: t(AUTH_CONSTANTS.PLACEHOLDERS.EMAIL),
      password: t(AUTH_CONSTANTS.PLACEHOLDERS.PASSWORD),
      username: t(AUTH_CONSTANTS.PLACEHOLDERS.USERNAME),
    },
    messages: {
      loginSuccess: t(AUTH_CONSTANTS.MESSAGES.LOGIN_SUCCESS),
      registerSuccess: t(AUTH_CONSTANTS.MESSAGES.REGISTER_SUCCESS),
      invalidCredentials: t(AUTH_CONSTANTS.MESSAGES.INVALID_CREDENTIALS),
      creatingAccount: t(AUTH_CONSTANTS.MESSAGES.CREATING_ACCOUNT),
      joinBattle: t(AUTH_CONSTANTS.MESSAGES.JOIN_BATTLE),
      alreadyHaveAccount: t(AUTH_CONSTANTS.MESSAGES.ALREADY_HAVE_ACCOUNT),
    },
    validation: {
      emailRequired: t(AUTH_CONSTANTS.VALIDATION.EMAIL_REQUIRED),
      emailInvalid: t(AUTH_CONSTANTS.VALIDATION.EMAIL_INVALID),
      usernameRequired: t(AUTH_CONSTANTS.VALIDATION.USERNAME_REQUIRED),
      usernameMinLength: t(AUTH_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH),
      usernameMaxLength: t(AUTH_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH),
      usernamePattern: t(AUTH_CONSTANTS.VALIDATION.USERNAME_PATTERN),
      passwordRequired: t(AUTH_CONSTANTS.VALIDATION.PASSWORD_REQUIRED),
      passwordMinLength: t(AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH),
      passwordPattern: t(AUTH_CONSTANTS.VALIDATION.PASSWORD_PATTERN),
      confirmPasswordRequired: t(AUTH_CONSTANTS.VALIDATION.CONFIRM_PASSWORD_REQUIRED),
      passwordsNotMatch: t(AUTH_CONSTANTS.VALIDATION.PASSWORDS_NOT_MATCH),
    },
  };
};