import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lightbulb, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center mb-3 text-sky-400">
            <Lightbulb size={28} className="animate-pulse-glow" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white text-center">
            Startup Idea Validation
          </h2>
          <p className="text-sm text-slate-400 mt-1 text-center">
            Log in to evaluate and design your business models
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                required
                className="w-full pl-11 glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                className="w-full pl-11 glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:pointer-events-none mt-8"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 hover:underline hover:text-sky-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
