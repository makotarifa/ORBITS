import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameView } from '../components/game/GameView';

export const GamePage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    console.log('User logged out, navigating to auth...');
    navigate('/auth', { replace: true });
  };

  // Show loading or nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <GameView onLogout={handleLogout} />;
};