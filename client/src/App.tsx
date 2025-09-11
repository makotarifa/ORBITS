import { RegisterForm } from './components/forms/RegisterForm';

function App() {
  const handleSuccess = () => {
    console.log('Registration successful!');
  };

  const handleSwitchToLogin = () => {
    console.log('Switch to login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <RegisterForm 
        onSuccess={handleSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}

export default App;