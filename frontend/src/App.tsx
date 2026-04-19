import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { UpgradePage } from './pages/UpgradePage';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isDevMode } = useAuth();
  
  if (loading) return null; // Or a nice splash screen
  
  if (!user && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
