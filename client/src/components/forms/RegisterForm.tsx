import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthTranslations } from '../../hooks/ui/useAuthTranslations';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// Dynamic validation schema using i18n
const createRegisterSchema = (validation: any) => z.object({
  email: z
    .string()
    .min(1, validation.emailRequired)
    .email(validation.emailInvalid),
  username: z
    .string()
    .min(1, validation.usernameRequired)
    .min(3, validation.usernameMinLength)
    .max(20, validation.usernameMaxLength)
    .regex(/^\w+$/, validation.usernamePattern),
  password: z
    .string()
    .min(1, validation.passwordRequired)
    .min(8, validation.passwordMinLength)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, validation.passwordPattern),
  confirmPassword: z
    .string()
    .min(1, validation.confirmPasswordRequired),
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

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const { register: registerUser } = useAuth();
  const { labels, placeholders, messages, validation, general } = useAuthTranslations();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(validation)),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit', // Only validate on submit to avoid premature errors
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      await registerUser(data.email, data.username, data.password);
      onSuccess?.();
    } catch (error: any) {
      console.error('Registration error:', error);
      setServerError(error.message || general.unexpectedError);
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{labels.createAccount}</h2>
          <p className="text-slate-400">{messages.joinBattle}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              {labels.email}
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={placeholders.email}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              {labels.username}
            </label>
            <input
              {...register('username')}
              type="text"
              id="username"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={placeholders.username}
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              {labels.password}
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={placeholders.password}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
              {labels.confirmPassword}
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={placeholders.password}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {messages.creatingAccount}
              </div>
            ) : (
              labels.createAccount
            )}
          </button>
        </form>

        {/* Switch to Login */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              {messages.alreadyHaveAccount}{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isSubmitting}
              >
                {labels.login}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};