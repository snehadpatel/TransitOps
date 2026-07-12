import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (failedAttempts >= 5) {
      setError('Account locked due to too many failed attempts.');
      return;
    }

    if (!email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    // Mock login for now
    if (email === 'test@example.com' && password === 'password') {
      login('mock-jwt-token', {
        id: '1',
        name: 'Test User',
        email,
        role: role as Role,
      });
      navigate('/');
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setError('Account locked due to too many failed attempts.');
      } else {
        setError('Invalid credentials.');
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center w-1/3 bg-[#161A24] text-white p-12">
        <h1 className="text-4xl font-bold mb-2 text-amber-500">TransitOps</h1>
        <p className="text-gray-400 mb-12">Smart Transport Operations Platform</p>
        
        <div className="space-y-4">
          <p className="font-semibold text-lg">One login, four roles:</p>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Fleet Manager</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Dispatcher</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Safety Officer</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Financial Analyst</li>
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md relative">
          <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
          <p className="text-gray-500 mb-8">Enter your credentials to continue</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="you@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="" disabled>Select your role...</option>
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-amber-600 hover:text-amber-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={failedAttempts >= 5}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              Sign In
            </button>
          </form>

          {/* Error Message Tooltip-style */}
          {error && (
            <div className="absolute top-0 -right-64 w-56 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md shadow-sm hidden lg:block">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Status</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile error message */}
          {error && (
            <div className="mt-4 lg:hidden bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
