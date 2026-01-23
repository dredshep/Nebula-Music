
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Server, CheckCircle, AlertCircle, ArrowRight, Music, ShieldAlert } from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const { connectToSubsonic, enableDemoMode } = useStore();
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isInsecure, setIsInsecure] = useState(false);

  useEffect(() => {
    if (url && !url.startsWith('https://') && url.length > 7) {
        setIsInsecure(true);
    } else {
        setIsInsecure(false);
    }
  }, [url]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const success = await connectToSubsonic(url, user, pass);
    if (!success) setStatus('error');
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-secondary/20 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] left-[30%] w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        
        {/* Logo Area */}
        <div className="text-center mb-10">
           <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 transform group hover:rotate-3 transition duration-500">
              <svg viewBox="0 0 24 24" className="w-14 h-14 text-white stroke-current group-hover:scale-110 transition-transform duration-500" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10v4" className="opacity-50" />
                <path d="M8 7v10" className="opacity-75" />
                <path d="M12 3v18" className="opacity-100" />
                <path d="M16 7v10" className="opacity-75" />
                <path d="M20 10v4" className="opacity-50" />
              </svg>
           </div>
           <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Welcome to Nebula Music</h1>
           <p className="text-neutral-400">Your personal high-fidelity music cloud.</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
           <form onSubmit={handleConnect} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 tracking-wider">Server URL</label>
                  <input 
                    required
                    type="text" 
                    placeholder="https://music.yourserver.com" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className={`w-full bg-black/40 border focus:border-primary rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-all ${isInsecure ? 'border-yellow-500/50' : 'border-white/10'}`}
                  />
                  {isInsecure && (
                      <div className="flex items-start mt-2 text-yellow-500 text-xs">
                          <ShieldAlert className="w-3 h-3 mr-1.5 mt-0.5" />
                          <span>Warning: Using HTTP puts your credentials at risk. HTTPS is strongly recommended.</span>
                      </div>
                  )}
               </div>
               <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 tracking-wider">Username</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Username" 
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 tracking-wider">Password</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••" 
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-all"
                  />
               </div>

               {status === 'error' && (
                   <div className="flex items-center text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/10">
                       <AlertCircle className="w-4 h-4 mr-2" /> Connection failed. Check details.
                   </div>
               )}

               <button 
                  disabled={status === 'loading'}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-primary hover:text-white transition-all transform active:scale-95 flex items-center justify-center shadow-lg"
               >
                  {status === 'loading' ? (
                      <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                      <>Connect Server <ArrowRight className="w-5 h-5 ml-2" /></>
                  )}
               </button>
           </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
             <button 
                onClick={enableDemoMode}
                className="text-sm text-neutral-500 hover:text-white transition underline decoration-neutral-700 hover:decoration-white underline-offset-4"
             >
                 No server? Try Demo Mode
             </button>
        </div>

      </div>
    </div>
  );
};
