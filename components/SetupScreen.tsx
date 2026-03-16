import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { AlertCircle, ArrowRight, ShieldAlert, Sparkles, Server } from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const { connectToSubsonic, enableDemoMode } = useStore();
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Compute isInsecure without useEffect to avoid re-render focus issues
  const isInsecure = useMemo(() => {
    return url && !url.startsWith('https://') && url.length > 7;
  }, [url]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const success = await connectToSubsonic(url, user, pass);
    if (!success) setStatus('error');
  };

  return (
    <div className="fixed inset-0 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center overflow-hidden font-sans">
      {/* Subtle animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] w-[600px] h-[600px] bg-primary/[0.08] rounded-full filter blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] bg-secondary/[0.06] rounded-full filter blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary via-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-6">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-white stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10v4" className="opacity-50" />
              <path d="M8 7v10" className="opacity-70" />
              <path d="M12 3v18" />
              <path d="M16 7v10" className="opacity-70" />
              <path d="M20 10v4" className="opacity-50" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2">Nebula Music</h1>
          <p className="text-neutral-600 dark:text-white/60 text-sm">Connect to your personal music server</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-neutral-200 dark:border-white/[0.04] rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleConnect} className="space-y-4">
            {/* Server URL */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-white/60 uppercase tracking-wide mb-2">Server URL</label>
              <input
                required
                type="text"
                placeholder="https://music.yourserver.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                autoComplete="url"
                className={`w-full bg-white border rounded-xl px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${isInsecure ? 'border-yellow-500/30' : 'border-neutral-200 dark:border-white/[0.06]'}`}
              />
              {isInsecure && (
                <div className="flex items-start mt-2 text-yellow-600 dark:text-yellow-500/80 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0" />
                  <span>HTTP connections are insecure. Consider using HTTPS.</span>
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-white/60 uppercase tracking-wide mb-2">Username</label>
              <input
                required
                type="text"
                placeholder="Username"
                value={user}
                onChange={e => setUser(e.target.value)}
                autoComplete="username"
                className="w-full bg-white border border-neutral-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-white/60 uppercase tracking-wide mb-2">Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-white border border-neutral-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/10">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                Connection failed. Please check your details.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span className="w-5 h-5 border-2 border-white/50 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/[0.06]" />
            <span className="text-xs text-neutral-600 dark:text-white/50 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/[0.06]" />
          </div>

          {/* Demo Mode */}
          <button
            onClick={enableDemoMode}
            className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.06] text-neutral-700 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/[0.06] font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Try Demo Mode
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-600 dark:text-white/60 text-xs mt-6">
          Nebula Music • Subsonic-compatible client
        </p>
      </div>
    </div>
  );
};


