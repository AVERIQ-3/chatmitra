import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  X,
  Lock,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    registerAccount,
    loginAccount,
  } = useChat();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'register') {
      const res = await registerAccount({ username, password });
      if (!res.success) {
        setError(res.error || 'Failed to create account');
      }
    } else {
      const res = await loginAccount({ username, password });
      if (!res.success) {
        setError(res.error || 'Invalid credentials');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#14152b] border border-indigo-950 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 mx-auto mb-3 shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#121327] rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">
            {mode === 'register' ? 'Save & Secure Your Account' : 'Sign In to ChatMitra'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {mode === 'register'
              ? 'Save your conversations and friend list permanently across any browser or device.'
              : 'Welcome back! Log in to restore your previous chats and saved friends.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-indigo-950 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Permanent Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Existing Login
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              placeholder="e.g. rahul_hyd or swathi_24"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-950 text-white placeholder-slate-500 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-950 text-white placeholder-slate-500 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'register' ? 'Confirm & Save Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            ChatMitra is 100% free and privacy-first.
          </p>
        </div>
      </div>
    </div>
  );
};
