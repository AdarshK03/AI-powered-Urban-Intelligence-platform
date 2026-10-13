import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import CitizenLayout from './components/public/CitizenLayout';
import OnboardingPanel from './pages/OnboardingPanel';
import LoginPanel from './pages/LoginPanel';
import SignUpPanel from './pages/SignUpPanel';
import LoginScreen from './pages/LoginScreen';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Citizen Portal Routes */}
          <Route element={<CitizenLayout />}>
            <Route path="/" element={<OnboardingPanel />} />
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPanel />} />
            <Route path="/signup" element={<SignUpPanel />} />
          </Route>

          {/* Admin Authentication Screen */}
          <Route path="/admin/login" element={<LoginScreen />} />

          {/* Protected Municipal Admin Console Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
