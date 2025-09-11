import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/auth/auth.service';
import { LoginRequest, FormErrors } from '../types/auth';
import { useAuthTranslations } from './ui/useAuthTranslations';

// Dynamic validation schema using i18n
const createLoginSchema = (validation: any) => z.object({
  emailOrUsername: z
    .string()
    .min(1, validation.emailOrUsernameRequired),
  password: z
    .string()
    .min(1, validation.passwordRequired),
});

type LoginFormData = {
  emailOrUsername: string;
  password: string;
};

export const useLoginForm = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { validation, general } = useAuthTranslations();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(validation)),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrors({});

    try {
      const dataToSend: LoginRequest = {
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      };

      const response = await authService.login(dataToSend);

      if (response.success) {
        // Login successful - store token
        if (response.data?.access_token) {
          localStorage.setItem('accessToken', response.data.access_token);
        }
        onSuccess?.();
        return { success: true, user: response.data?.user };
      } else {
        // Handle API errors
        const apiErrors: FormErrors = {};

        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              apiErrors[field as keyof FormErrors] = { message: messages[0] };
            }
          });
        }

        if (response.message && !Object.keys(apiErrors).length) {
          apiErrors.general = { message: response.message };
        }

        setErrors(apiErrors);
        return { success: false, errors: apiErrors };
      }
    } catch (error) {
      console.error('Login error:', error);
      const generalError = { message: general.unexpectedError };
      setErrors({ general: generalError });
      return { success: false, errors: { general: generalError } };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    errors,
    onSubmit: form.handleSubmit(onSubmit),
  };
};