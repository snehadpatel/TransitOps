import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
  );
}

export default App;
