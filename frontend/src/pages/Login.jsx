import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const ROLES_DISPLAY = [
  { key: 'FLEET_MANAGER',    label: 'Fleet Manager',     desc: 'Manage vehicles and maintenance' },
  { key: 'DISPATCHER',       label: 'Dispatcher',        desc: 'Manage trips and dispatch' },
  { key: 'SAFETY_OFFICER',   label: 'Safety Officer',    desc: 'Manage drivers and safety' },
  { key: 'FINANCIAL_ANALYST',label: 'Financial Analyst', desc: 'Manage fuel and expenses' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#161A24] text-white p-12">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold">TransitOps</div>
              <div className="text-xs text-white/50">Smart Transport Operations</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            One platform.<br />
            <span className="text-amber-400">Complete fleet control.</span>
          </h1>
          <p className="text-white/60 text-lg mb-12">
            Real-time dispatch, safety compliance, and operational analytics — all in one place.
          </p>

          {/* Roles */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-4 font-semibold">One login, four roles</p>
            <div className="space-y-3">
              {ROLES_DISPLAY.map((r) => (
                <div key={r.key} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="text-xs text-white/40">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-white/30">© 2026 TransitOps · Odoo Hackathon Submission</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6" />
              </svg>
            </div>
            <span className="font-bold text-lg">TransitOps</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to your TransitOps account</p>
            </div>

            {error && (
              <div className="rule-error mb-5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-base"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : null}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo credentials (password: Password123)</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Fleet Manager', email: 'manager@transitops.com' },
                  { label: 'Dispatcher', email: 'dispatcher@transitops.com' },
                  { label: 'Safety Officer', email: 'safety@transitops.com' },
                  { label: 'Financial Analyst', email: 'analyst@transitops.com' },
                ].map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => { setEmail(cred.email); setPassword('Password123'); }}
                    className="flex items-center justify-between w-full text-left px-3 py-1.5 rounded-md hover:bg-white transition-colors group"
                  >
                    <span className="text-xs font-medium text-gray-700">{cred.label}</span>
                    <span className="text-xs text-gray-400 group-hover:text-amber-500 transition-colors">{cred.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
