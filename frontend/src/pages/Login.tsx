import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDENTIALS = [
  { role: 'Fleet Manager', email: 'manager@transitops.com' },
  { role: 'Dispatcher', email: 'dispatcher@transitops.com' },
  { role: 'Safety Officer', email: 'safety@transitops.com' },
  { role: 'Financial Analyst', email: 'analyst@transitops.com' },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123');
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center w-1/3 bg-[#161A24] text-white p-12">
        <h1 className="text-4xl font-bold mb-2 text-amber-500">TransitOps</h1>
        <p className="text-gray-400 mb-12">Smart Transport Operations Platform</p>
        
        <div className="space-y-4 mb-10">
          <p className="font-semibold text-lg">One login, four roles:</p>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Fleet Manager</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Dispatcher</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Safety Officer</li>
            <li className="flex items-center"><span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>Financial Analyst</li>
          </ul>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Quick Demo Login</p>
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.email}
                onClick={() => handleDemoLogin(c.email)}
                className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/10"
              >
                <span className="text-amber-400 font-medium">{c.role}</span>
                <span className="text-gray-500 text-xs block">{c.email}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">All passwords: <span className="text-gray-400">Password123</span></p>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>


          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Mobile demo credentials */}
          <div className="mt-8 md:hidden">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Quick Demo</p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  onClick={() => handleDemoLogin(c.email)}
                  className="w-full text-left px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
                >
                  <span className="text-amber-600 font-medium">{c.role}</span>
                  <span className="text-gray-400 text-xs block">{c.email}</span>
                </button>
              ))}
              <p className="text-xs text-gray-400">All passwords: Password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
