import { useTranslation } from 'react-i18next';

/**
 * Custom hook for authentication-related translations
 * Provides type-safe access to auth translation keys
 */
export const useAuthTranslations = () => {
  const { t } = useTranslation();

  return {
    labels: {
      email: t('auth.labels.email'),
      password: t('auth.labels.password'),
      confirmPassword: t('auth.labels.confirmPassword'),
      username: t('auth.labels.username'),
      createAccount: t('auth.labels.createAccount'),
      login: t('auth.labels.login'),
      emailOrUsername: t('auth.labels.emailOrUsername'),
    },
    placeholders: {
      email: t('auth.placeholders.email'),
      password: t('auth.placeholders.password'),
      username: t('auth.placeholders.username'),
    },
    messages: {
      loginSuccess: t('auth.messages.loginSuccess'),
      registerSuccess: t('auth.messages.registerSuccess'),
      invalidCredentials: t('auth.messages.invalidCredentials'),
      creatingAccount: t('auth.messages.creatingAccount'),
      loggingIn: t('auth.messages.loggingIn'),
      joinBattle: t('auth.messages.joinBattle'),
      alreadyHaveAccount: t('auth.messages.alreadyHaveAccount'),
      dontHaveAccount: t('auth.messages.dontHaveAccount'),
    },
    validation: {
      emailRequired: t('auth.validation.emailRequired'),
      emailInvalid: t('auth.validation.emailInvalid'),
      emailOrUsernameRequired: t('auth.validation.emailOrUsernameRequired'),
      usernameRequired: t('auth.validation.usernameRequired'),
      usernameMinLength: t('auth.validation.usernameMinLength'),
      usernameMaxLength: t('auth.validation.usernameMaxLength'),
      usernamePattern: t('auth.validation.usernamePattern'),
      passwordRequired: t('auth.validation.passwordRequired'),
      passwordMinLength: t('auth.validation.passwordMinLength'),
      passwordPattern: t('auth.validation.passwordPattern'),
      confirmPasswordRequired: t('auth.validation.confirmPasswordRequired'),
      passwordsNotMatch: t('auth.validation.passwordsNotMatch'),
    },
    general: {
      unexpectedError: t('auth.messages.unexpectedError'),
    },
  };
};