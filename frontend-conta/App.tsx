
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import RecuperarPasswordPage from './pages/RecuperarPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingScreenDashboard from './components/layout/LoadingScreenDashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [showLoading, setShowLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRegistro, setShowRegistro] = useState(false);
  const [showRecuperarPassword, setShowRecuperarPassword] = useState(false);

  useEffect(() => {
    if (user && !showDashboard) {
      // Mostrar loading screen cuando el usuario se loguea
      setShowLoading(true);
    } else if (!user) {
      // Resetear estados cuando el usuario hace logout
      setShowLoading(false);
      setShowDashboard(false);
    }
  }, [user, showDashboard]);

  const handleLoadingComplete = () => {
    setShowLoading(false);
    setShowDashboard(true);
  };

  if (!user) {
    if (showRegistro) {
      return <RegistroPage onBackToLogin={() => setShowRegistro(false)} />;
    }
    if (showRecuperarPassword) {
      return <RecuperarPasswordPage onBackToLogin={() => setShowRecuperarPassword(false)} />;
    }
    return (
      <LoginPage
        onGoToRegistro={() => setShowRegistro(true)}
        onGoToRecuperarPassword={() => setShowRecuperarPassword(true)}
      />
    );
  }

  if (showLoading) {
    return <LoadingScreenDashboard onLoadingComplete={handleLoadingComplete} />;
  }

  return <DashboardLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
