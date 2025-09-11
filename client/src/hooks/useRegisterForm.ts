import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/auth/auth.service';
import { RegisterRequest, FormErrors } from '../types/auth';
import { useAuthTranslations } from './ui/useAuthTranslations';

// Dynamic validation schema using i18n
const createRegisterSchema = (validation: any) => z.object({
  email: z
    .string()
    .min(1, validation.emailRequired)
    .email(validation.emailInvalid),
  username: z
    .string()
    .min(3, validation.usernameMinLength)
    .max(20, validation.usernameMaxLength)
    .regex(/^\w+$/, validation.usernamePattern),
  password: z
    .string()
    .min(8, validation.passwordMinLength)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, validation.passwordPattern),
  confirmPassword: z.string().min(1, validation.confirmPasswordRequired),
}).refine((data) => data.password === data.confirmPassword, {
  message: validation.passwordsNotMatch,
  path: ['confirmPassword'],
});

type RegisterFormData = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export const useRegisterForm = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { validation, general } = useAuthTranslations();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(validation)),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrors({});

    try {
      const registerData: RegisterRequest = {
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      const response = await authService.register(registerData);

      if (response.success) {
        // Registration successful - store token
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
  console.error('Registration error:', error);
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