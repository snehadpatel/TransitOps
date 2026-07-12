import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDENTIALS = [
  { role: 'Fleet Manager', email: 'manager@transitops.com', icon: 'fa-truck' },
  { role: 'Dispatcher', email: 'dispatcher@transitops.com', icon: 'fa-route' },
  { role: 'Safety Officer', email: 'safety@transitops.com', icon: 'fa-shield-halved' },
  { role: 'Financial Analyst', email: 'analyst@transitops.com', icon: 'fa-chart-line' },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
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
    <div className="auth-page">
      <div className="auth-card">
        {/* ─── Visual Panel ─── */}
        <div className="auth-visual">
          <div>
            <span className="brand-icon"><i className="fas fa-truck-fast"></i></span>
            <h2>TransitOps</h2>
            <p>Smart Transport Operations Platform — manage your entire fleet, drivers, trips and finances from one beautiful dashboard.</p>
          </div>
          <ul>
            <li><i className="fas fa-circle-check"></i> Real-time fleet &amp; trip tracking</li>
            <li><i className="fas fa-circle-check"></i> Automated business rule enforcement</li>
            <li><i className="fas fa-circle-check"></i> Reports, analytics &amp; CSV export</li>
            <li><i className="fas fa-circle-check"></i> Role-based secure access</li>
          </ul>
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  onClick={() => handleDemoLogin(c.email)}
                  className="demo-cred-btn"
                >
                  <span className="role-name"><i className={`fas ${c.icon}`} style={{ marginRight: '8px' }}></i>{c.role}</span>
                  <span className="role-email">{c.email}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#9aa3bd', marginTop: '10px' }}>All passwords: <span style={{ color: '#fff' }}>Password123</span></p>
          </div>
        </div>

        {/* ─── Form Panel ─── */}
        <div className="auth-form-side">
          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to continue to your dashboard</p>

          {error && (
            <div className="rule-error" style={{ marginBottom: '16px' }}>
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-envelope" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-text-muted)', fontSize: '0.85rem' }}></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="you@transitops.com"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-text-muted)', fontSize: '0.85rem' }}></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tx-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <i className="fas fa-arrow-right"></i>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
