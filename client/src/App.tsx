import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { RegisterForm } from './components/forms/RegisterForm';
import { LoginForm } from './components/forms/LoginForm';
import { useAppTranslations } from './hooks/ui/useAppTranslations';

type AuthView = 'login' | 'register';

function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { messages } = useAppTranslations();

  const handleLoginSuccess = () => {
    console.log('Login successful!');
    setIsAuthenticated(true);
    // For now, show success message - later this will navigate to game
    alert(messages.loginSuccessAlert);
  };

  const handleRegisterSuccess = () => {
    console.log('Registration successful!');
    // Auto-switch to login after successful registration
    setCurrentView('login');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  // Show authenticated view (placeholder for now)
  if (isAuthenticated) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">{messages.welcomeTitle}</h1>
            <p className="text-slate-300">{messages.authSuccessMessage}</p>
          </div>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;