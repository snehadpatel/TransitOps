import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import TripEdit from './pages/TripEdit';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/fleet" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}>
                <Layout><Fleet /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/drivers" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer']}>
                <Layout><Drivers /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/trips" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}>
                <Layout><Trips /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/trips/:id" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}>
                <Layout><TripDetail /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/trips/:id/edit" element={
              <ProtectedRoute allowedRoles={['Dispatcher']}>
                <Layout><TripEdit /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/maintenance" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}>
                <Layout><Maintenance /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}>
                <Layout><Expenses /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                <Layout><Analytics /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['Fleet Manager']}>
                <Layout><Users /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['Fleet Manager']}>
                <Layout><AuditLogs /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['Fleet Manager']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
