import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage, GamePage } from './pages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default route redirects to auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* Authentication page */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Game page */}
          <Route path="/game" element={<GamePage />} />
          
          {/* Catch all - redirect to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;