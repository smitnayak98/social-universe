'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Zap } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/dashboard');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#f5c800]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#f5c800]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#f5c800]/20 border border-violet-500/30 mb-4">
            <Zap size={22} className="text-[#b8930a]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Social Universe</h1>
          <p className="text-[#777] text-sm mt-1">Manage all your social media in one place</p>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex rounded-xl bg-[#f5f5f5] p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-[#f5c800] text-[#1a1a1a] shadow-lg' : 'text-[#555] hover:text-[#1a1a1a]'}`}>
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-[#f5c800] text-[#1a1a1a] shadow-lg' : 'text-[#555] hover:text-[#1a1a1a]'}`}>
              Sign Up
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#f5c800]/50 focus:border-[#f5c800]/50 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#f5c800]/50 focus:border-[#f5c800]/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#f5c800]/50 focus:border-[#f5c800]/50 transition-all" />
            </div>
          <button
          type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#f5c800] hover:bg-[#e0b800] text-[#1a1a1a] text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Loading...</>
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#999] mt-6">
          Social Universe &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
