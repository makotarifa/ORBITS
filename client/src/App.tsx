import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { RegisterForm } from './components/forms/RegisterForm';
import { LoginForm } from './components/forms/LoginForm';
import { GameView } from './components/game/GameView';
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    console.log('User logged out');
  };

  // Show authenticated view (game view)
  if (isAuthenticated) {
    return (
      <AuthProvider>
        <GameView onLogout={handleLogout} />
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