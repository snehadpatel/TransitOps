import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Fleet Manager');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (register) {
        await register(name, email, password, role);
        navigate('/');
      } else {
        throw new Error('Register function is not implemented in AuthContext');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-[#161A24] flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#161A24] to-[#2A3143] opacity-80 z-0"></div>
        <div className="relative z-10 max-w-md w-full">
          <h1 className="text-4xl font-extrabold mb-4 text-amber-500">TransitOps</h1>
          <p className="text-lg text-gray-300 mb-8">Join the Smart Transport Operations Platform</p>
          <ul className="space-y-4 text-gray-400">
            <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Fleet Manager</li>
            <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Dispatcher</li>
            <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Safety Officer</li>
            <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Financial Analyst</li>
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-2">Enter your details to register</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="you@transitops.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white">
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors mt-4 disabled:opacity-70 flex justify-center">
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-500 hover:text-amber-600 font-medium">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
