import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthTranslations } from '../../hooks/ui/useAuthTranslations';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

// Validation schema with i18n messages
const createLoginSchema = (validation: any) => z.object({
  emailOrUsername: z.string().min(1, validation.emailOrUsernameRequired),
  password: z.string().min(1, validation.passwordRequired),
});

type LoginFormData = {
  emailOrUsername: string;
  password: string;
};

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister
}) => {
  const { login } = useAuth();
  const { labels, placeholders, messages, validation, general } = useAuthTranslations();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(validation)),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
    mode: 'onSubmit', // Only validate on submit to avoid premature errors
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    
    try {
      await login(data.emailOrUsername, data.password);
      onSuccess?.();
    } catch (error: any) {
      console.error('Login error:', error);
      setServerError(error.message || general.unexpectedError);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{labels.login}</h2>
          <p className="text-slate-400">{messages.joinBattle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email or Username Field */}
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-slate-300 mb-2">
              {labels.emailOrUsername}
            </label>
            <input
              {...register('emailOrUsername')}
              type="text"
              id="emailOrUsername"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={placeholders.email}
              disabled={isSubmitting}
            />
            {errors.emailOrUsername && (
              <p className="mt-1 text-sm text-red-400">{errors.emailOrUsername.message}</p>
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
                {messages.loggingIn}
              </div>
            ) : (
              labels.login
            )}
          </button>
        </form>

        {/* Switch to Register */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              {messages.dontHaveAccount}{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={isSubmitting}
              >
                {labels.createAccount}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};