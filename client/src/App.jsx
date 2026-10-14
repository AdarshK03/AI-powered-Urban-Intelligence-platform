import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { IssueProvider } from './context/IssueContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import CitizenLayout from './components/public/CitizenLayout';
import CitizenShell from './components/citizen/CitizenShell';
import OnboardingPanel from './pages/OnboardingPanel';
import LoginPanel from './pages/LoginPanel';
import SignUpPanel from './pages/SignUpPanel';
import LoginScreen from './pages/LoginScreen';
import AdminDashboard from './pages/AdminDashboard';
import CitizenHome from './pages/CitizenHome';
import ReportIssue from './pages/ReportIssue';
import IssueMap from './pages/IssueMap';
import IssueDetails from './pages/IssueDetails';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <IssueProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Citizen Portal Routes */}
            <Route element={<CitizenLayout />}>
              <Route path="/" element={<OnboardingPanel />} />
              <Route path="/login" element={<LoginPanel />} />
              <Route path="/signup" element={<SignUpPanel />} />
            </Route>

            {/* Protected Citizen App (login required, role: citizen) */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute requiredRole="citizen" redirectTo="/login">
                  <CitizenShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<CitizenHome />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="map" element={<IssueMap />} />
              <Route path="issues/:id" element={<IssueDetails />} />
              <Route path="my-reports" element={<MyReports />} />
              <Route path="profile" element={<Profile />} />
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
      </IssueProvider>
    </AuthProvider>
  );
}