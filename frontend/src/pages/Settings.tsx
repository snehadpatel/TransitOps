import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isManager = user?.role === 'Fleet Manager';

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'rbac'>('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const rbacMatrix = [
    { role: 'Fleet Manager', fleet: '✓', drivers: 'view', trips: '–', fuel: '–', analytics: '–', description: 'Full control over fleet and maintenance' },
    { role: 'Dispatcher', fleet: '–', drivers: 'view', trips: '✓', fuel: '–', analytics: '–', description: 'Dispatch and manage trip operations' },
    { role: 'Safety Officer', fleet: '–', drivers: '✓', trips: 'view', fuel: '–', analytics: '–', description: 'Manage drivers and safety compliance' },
    { role: 'Financial Analyst', fleet: 'view', drivers: '–', trips: '–', fuel: '✓', analytics: 'view', description: 'Track expenses and generate reports' },
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile update not yet implemented');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    alert('Password change not yet implemented');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-gear" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Settings</div>
          <div className="section-subtitle">Manage your profile, preferences, and system settings</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--tx-border)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn btn-primary btn-sm' : 'btn btn-light btn-sm'}
          style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--tx-primary)' : '2px solid transparent' }}
        >
          <i className="fas fa-user"></i> Profile
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'btn btn-primary btn-sm' : 'btn btn-light btn-sm'}
          style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid var(--tx-primary)' : '2px solid transparent' }}
        >
          <i className="fas fa-sliders"></i> Preferences
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={activeTab === 'rbac' ? 'btn btn-primary btn-sm' : 'btn btn-light btn-sm'}
          style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === 'rbac' ? '2px solid var(--tx-primary)' : '2px solid transparent' }}
        >
          <i className="fas fa-shield-halved"></i> Access Control
        </button>
      </div>
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '800px' }}>
          {/* User Info Card */}
          <div className="tx-card">
            <div className="tx-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div className="sidebar-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>{user?.name.charAt(0)}</div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.2rem' }}>{user?.name}</h4>
                  <span className="badge badge-info">{user?.role}</span>
                  <span className="badge badge-available" style={{ marginLeft: '8px' }}>Active</span>
                  <div style={{ color: 'var(--tx-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                    <i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>{user?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="tx-card">
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px' }}>
                <i className="fas fa-user-pen" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                Edit Profile
              </h3>
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Full Name</label>
                    <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="form-control" />
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input type="email" value={profileForm.email} className="form-control" disabled />
                    <div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)', marginTop: '4px' }}>Contact admin to change email</div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="form-control" placeholder="+91-9876543210" />
                </div>
                <div>
                  <label className="form-label">Profile Picture</label>
                  <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp" />
                </div>
                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save"></i> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="tx-card">
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px' }}>
                <i className="fas fa-key" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                Change Password
              </h3>
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Current Password</label>
                  <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="form-control" placeholder="••••••••" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">New Password</label>
                    <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} className="form-control" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="form-control" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="btn btn-warning" style={{ width: 'fit-content' }}>
                  <i className="fas fa-shield-halved"></i> Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Appearance */}
          <div className="tx-card">
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px' }}>
                <i className="fas fa-palette" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                Appearance
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Theme</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)' }}>Current: {isDark ? 'Dark' : 'Light'} Mode</div>
                </div>
                <button onClick={toggleTheme} className="btn btn-light">
                  <i className={`fas fa-${isDark ? 'sun' : 'moon'}`}></i> Toggle Theme
                </button>
              </div>
            </div>
          </div>

          {/* General Settings - Only for Fleet Manager */}
          {isManager && (
            <div className="tx-card">
              <div className="tx-card-body">
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px' }}>
                  <i className="fas fa-sliders" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                  General Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Depot Name</label>
                    <input type="text" defaultValue="Gandhinagar Depot (HQ)" className="form-control" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Currency</label>
                      <select className="form-select">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Distance Unit</label>
                      <select className="form-select">
                        <option>Kilometers (km)</option>
                        <option>Miles (mi)</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: 'fit-content' }}>
                    <i className="fas fa-save"></i> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account & Security */}
          <div className="tx-card">
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '20px' }}>
                <i className="fas fa-shield-halved" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                Account & Security
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px 0', borderBottom: '1px solid var(--tx-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Session Timeout</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)' }}>Auto logout after 30 minutes of inactivity</div>
                </div>
                <div style={{ padding: '12px 0', borderBottom: '1px solid var(--tx-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Role & Permissions</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)' }}>Your current role and access level</div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Tab */}
      {activeTab === 'rbac' && (
        <div className="tx-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-shield" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Role-Based Access Control (RBAC)
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Fleet</th>
                  <th style={{ textAlign: 'center' }}>Drivers</th>
                  <th style={{ textAlign: 'center' }}>Trips</th>
                  <th style={{ textAlign: 'center' }}>Fuel/Exp</th>
                  <th style={{ textAlign: 'center' }}>Analytics</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.role}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{row.fleet}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{row.drivers}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{row.trips}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{row.fuel}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{row.analytics}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)' }}>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--tx-border)', background: 'var(--tx-bg-alt)', fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>
            <strong>Legend:</strong> ✓ = Full Edit Access | view = Read-only | – = No Access
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
