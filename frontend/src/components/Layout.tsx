import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearch from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

const getNavItems = (role: Role): NavItem[] => {
  const items: NavItem[] = [{ name: 'Dashboard', path: '/', icon: 'fa-gauge-high' }];

  if (role === 'Fleet Manager') {
    items.push({ name: 'Fleet', path: '/fleet', icon: 'fa-truck' });
    items.push({ name: 'Drivers', path: '/drivers', icon: 'fa-id-card' });
    items.push({ name: 'Maintenance', path: '/maintenance', icon: 'fa-screwdriver-wrench' });
    items.push({ name: 'Reports', path: '/reports', icon: 'fa-chart-column' });
    items.push({ name: 'Analytics', path: '/analytics', icon: 'fa-chart-line' });
    items.push({ name: 'Users', path: '/users', icon: 'fa-users-gear' });
    items.push({ name: 'Audit Logs', path: '/audit-logs', icon: 'fa-clipboard-list' });
    items.push({ name: 'Settings', path: '/settings', icon: 'fa-gear' });
  } else if (role === 'Dispatcher') {
    items.push({ name: 'Fleet', path: '/fleet', icon: 'fa-truck' });
    items.push({ name: 'Drivers', path: '/drivers', icon: 'fa-id-card' });
    items.push({ name: 'Trips', path: '/trips', icon: 'fa-route' });
    items.push({ name: 'Maintenance', path: '/maintenance', icon: 'fa-screwdriver-wrench' });
  } else if (role === 'Safety Officer') {
    items.push({ name: 'Fleet', path: '/fleet', icon: 'fa-truck' });
    items.push({ name: 'Drivers', path: '/drivers', icon: 'fa-id-card' });
    items.push({ name: 'Trips', path: '/trips', icon: 'fa-route' });
    items.push({ name: 'Maintenance', path: '/maintenance', icon: 'fa-screwdriver-wrench' });
  } else if (role === 'Financial Analyst') {
    items.push({ name: 'Fleet', path: '/fleet', icon: 'fa-truck' });
    items.push({ name: 'Trips', path: '/trips', icon: 'fa-route' });
    items.push({ name: 'Maintenance', path: '/maintenance', icon: 'fa-screwdriver-wrench' });
    items.push({ name: 'Fuel & Expenses', path: '/expenses', icon: 'fa-gas-pump' });
    items.push({ name: 'Reports', path: '/reports', icon: 'fa-chart-column' });
    items.push({ name: 'Analytics', path: '/analytics', icon: 'fa-chart-line' });
  }
  return items;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const navItems = getNavItems(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ─── Sidebar ─── */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon"><i className="fas fa-truck-fast"></i></span>
          <span className="brand-text">Transit<strong>Ops</strong></span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user.name.charAt(0)}</div>
          <div>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link text-danger" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <i className="fas fa-right-from-bracket"></i>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="app-main">
        {/* ─── Navbar ─── */}
        <header className="app-navbar">
          <GlobalSearch />

          <div className="navbar-actions">
            <button className="navbar-icon-btn" onClick={toggleTheme} title="Toggle dark mode">
              {isDark ? (
                <i className="fas fa-sun"></i>
              ) : (
                <i className="fas fa-moon"></i>
              )}
            </button>

            <NotificationDropdown />

            <div className="navbar-user-pill">
              <div className="avatar-sm">{user.name.charAt(0)}</div>
              <span>{user.name}</span>
            </div>
          </div>
        </header>

        {/* ─── Page Content ─── */}
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
