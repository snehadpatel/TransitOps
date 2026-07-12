import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const getNavItems = (role: Role) => {
  const items = [{ name: 'Dashboard', path: '/' }];
  
  if (role === 'Fleet Manager') {
    items.push({ name: 'Fleet', path: '/fleet' });
    items.push({ name: 'Drivers', path: '/drivers' }); // view only
    items.push({ name: 'Maintenance', path: '/maintenance' });
    items.push({ name: 'Settings', path: '/settings' });
  } else if (role === 'Dispatcher') {
    items.push({ name: 'Drivers', path: '/drivers' }); // view only
    items.push({ name: 'Trips', path: '/trips' });
  } else if (role === 'Safety Officer') {
    items.push({ name: 'Drivers', path: '/drivers' });
    items.push({ name: 'Trips', path: '/trips' }); // view only
  } else if (role === 'Financial Analyst') {
    items.push({ name: 'Fleet', path: '/fleet' }); // view only
    items.push({ name: 'Fuel & Expenses', path: '/expenses' });
    items.push({ name: 'Analytics', path: '/analytics' });
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
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#161A24] text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-amber-500">TransitOps</h1>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-500 border-r-4 border-amber-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'dark bg-[#0B0F17]' : 'bg-gray-50'}`}>
        {/* Top Header */}
        <header className={`h-16 border-b flex items-center px-8 shadow-sm z-10 ${isDark ? 'bg-[#151B26] border-[#222B3C]' : 'bg-white border-gray-200'}`}>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search..."
              className={`w-96 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'text-amber-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{user.role}: {user.name}</span>
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto p-8 ${isDark ? 'bg-[#0B0F17]' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
