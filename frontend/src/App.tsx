import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/fleet" element={
            <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Financial Analyst']}>
              <Layout>
                <Fleet />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['Financial Analyst']}>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['Financial Analyst']}>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Fleet Manager']}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/maintenance" element={
            <ProtectedRoute allowedRoles={['Fleet Manager']}>
              <Layout>
                <Maintenance />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/drivers" element={
            <ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer']}>
              <Layout>
                <Drivers />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/trips" element={
            <ProtectedRoute allowedRoles={['Dispatcher', 'Safety Officer']}>
              <Layout>
                <Trips />
              </Layout>
            </ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
