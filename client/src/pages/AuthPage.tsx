import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterForm } from '../components/forms/RegisterForm';
import { LoginForm } from '../components/forms/LoginForm';

type AuthView = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to game if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/game', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    console.log('Login successful! Navigating to game...');
    navigate('/game', { replace: true });
  };

  const handleRegisterSuccess = () => {
    console.log('Registration successful!');
    setCurrentView('login');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {currentView === 'login' ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
};