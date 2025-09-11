import { useTranslation } from 'react-i18next';

export const useAppTranslations = () => {
  const { t } = useTranslation();

  return {
    messages: {
      loginSuccessAlert: t('auth.messages.loginSuccessAlert'),
      welcomeTitle: t('auth.messages.welcomeTitle'),
      authSuccessMessage: t('auth.messages.authSuccessMessage'),
      dontHaveAccount: t('auth.messages.dontHaveAccount'),
      loggingIn: t('auth.messages.loggingIn'),
    },
  };
};