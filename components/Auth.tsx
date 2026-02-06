
import React, { useState } from 'react';
import { api, setAuthToken } from '../services/api';
import { LogIn, UserPlus, Loader2, Sparkles } from 'lucide-react';

interface AuthProps {
  onAuthenticated: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await api.login({ useremail: email, password });
        setAuthToken(res.access_token);
      } else {
        await api.signup({ useremail: email, password });
        const res = await api.login({ useremail: email, password });
        setAuthToken(res.access_token);
      }
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-purple-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">UAE Life Admin</h1>
          <p className="text-slate-500 mt-2">Manage your renewals and tasks effortlessly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-600 font-bold hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
