import React from 'react';
import { useRegisterForm } from '../../hooks/useRegisterForm';
import { useAuthTranslations } from '../../hooks/ui/useAuthTranslations';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const { form, isLoading, errors, onSubmit } = useRegisterForm(onSuccess);
  const { labels, placeholders, messages } = useAuthTranslations();

  const { register, formState: { isValid } } = form;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{labels.createAccount}</h2>
          <p className="text-slate-400">{messages.joinBattle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
              <p className="text-sm text-red-400">{errors.general.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {isLoading ? (
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
                disabled={isLoading}
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