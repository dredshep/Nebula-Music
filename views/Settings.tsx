
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Save, Server, Palette, Layout, CheckCircle, AlertCircle, Activity, ShieldAlert, LogOut, Keyboard } from 'lucide-react';
import { VisualizerMode } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, connectToSubsonic, isDemoMode, credentials, visualizerMode, setVisualizerMode, disconnect } = useStore();
  
  // Local state for form
  const [url, setUrl] = useState(credentials?.serverUrl || '');
  const [user, setUser] = useState(credentials?.username || '');
  const [pass, setPass] = useState('');
  const [connStatus, setConnStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isInsecure, setIsInsecure] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    if (url && !url.startsWith('https://') && url.length > 7) {
        setIsInsecure(true);
    } else {
        setIsInsecure(false);
    }
  }, [url]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnStatus('loading');
    const success = await connectToSubsonic(url, user, pass);
    setConnStatus(success ? 'success' : 'error');
  };

  const Toggle = ({ label, checked, onChange }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-sm text-neutral-300">{label}</span>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-neutral-700'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
    </div>
  );

  // Key Listener for binding
  useEffect(() => {
      if (!editingKey) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const newShortcuts = { ...settings.shortcuts, [editingKey]: e.key };
          updateSettings({ shortcuts: newShortcuts });
          setEditingKey(null);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingKey, settings, updateSettings]);

  const ShortcutRow = ({ id, label, value }: { id: string, label: string, value: string }) => (
      <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
          <span className="text-sm text-neutral-300">{label}</span>
          <button 
              onClick={() => setEditingKey(id)}
              className={`px-3 py-1 rounded-md text-xs font-mono border transition-all min-w-[80px] text-center
                ${editingKey === id ? 'bg-primary text-black border-primary animate-pulse' : 'bg-black/40 border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'}`}
          >
              {editingKey === id ? 'Press Key...' : (value === ' ' ? 'Space' : value)}
          </button>
      </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-8 pb-32">
      <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold">Settings</h2>
          {!isDemoMode && (
              <button 
                onClick={disconnect}
                className="flex items-center px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition text-sm font-bold border border-red-500/20"
              >
                  <LogOut className="w-4 h-4 mr-2" /> Disconnect
              </button>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
        
        {/* COLUMN 1: Server & Appearance */}
        <div className="space-y-8">
            {/* Server Connection */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <Server className="w-5 h-5 mr-2 text-primary" /> Server Connection
                </h3>
                
                <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Server URL</label>
                        <input 
                            type="text" 
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://music.example.com" 
                            className={`w-full bg-black/20 border rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none transition ${isInsecure ? 'border-yellow-500/50' : 'border-white/10'}`}
                        />
                        {isInsecure && (
                            <div className="flex items-start mt-2 text-yellow-500 text-xs">
                                <ShieldAlert className="w-3 h-3 mr-1.5 mt-0.5" />
                                <span>Warning: Not using HTTPS exposes credentials.</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Username</label>
                        <input 
                            type="text"
                            value={user}
                            onChange={e => setUser(e.target.value)} 
                            placeholder="admin" 
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Password</label>
                        <input 
                            type="password" 
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none transition"
                        />
                    </div>

                    <button 
                        disabled={connStatus === 'loading'}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center mt-4"
                    >
                        {connStatus === 'loading' ? 'Connecting...' : 'Save & Connect'}
                    </button>

                    {connStatus === 'success' && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center text-green-500 text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" /> Connected Successfully
                        </div>
                    )}
                    {connStatus === 'error' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" /> Connection Failed. Check credentials.
                        </div>
                    )}
                    {isDemoMode && connStatus === 'idle' && (
                        <div className="text-xs text-yellow-500 text-center mt-2">
                            Currently in Demo Mode.
                        </div>
                    )}
                </form>
            </div>

            {/* Theme */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <Palette className="w-5 h-5 mr-2 text-secondary" /> Appearance
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300">Primary Color</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-neutral-500">{settings.theme.primaryColor}</span>
                            <input 
                                type="color" 
                                value={settings.theme.primaryColor}
                                onChange={(e) => updateSettings({ theme: { ...settings.theme, primaryColor: e.target.value } })}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300">Secondary Color</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-neutral-500">{settings.theme.secondaryColor}</span>
                            <input 
                                type="color" 
                                value={settings.theme.secondaryColor}
                                onChange={(e) => updateSettings({ theme: { ...settings.theme, secondaryColor: e.target.value } })}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMN 2: Config & Sidebar */}
        <div className="space-y-8">
            {/* Sidebar Config */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <Layout className="w-5 h-5 mr-2 text-neutral-400" /> Sidebar Customization
                </h3>
                <div>
                    <Toggle 
                        label="Show Home" 
                        checked={settings.sidebar.showHome} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showHome: v } })} 
                    />
                    <Toggle 
                        label="Show Browse" 
                        checked={settings.sidebar.showBrowse} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showBrowse: v } })} 
                    />
                    <Toggle 
                        label="Show Artists" 
                        checked={settings.sidebar.showArtists} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showArtists: v } })} 
                    />
                    <Toggle 
                        label="Show Albums" 
                        checked={settings.sidebar.showAlbums} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showAlbums: v } })} 
                    />
                    <Toggle 
                        label="Show Songs" 
                        checked={settings.sidebar.showSongs} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showSongs: v } })} 
                    />
                    <Toggle 
                        label="Show Playlists" 
                        checked={settings.sidebar.showPlaylists} 
                        onChange={(v: boolean) => updateSettings({ sidebar: { ...settings.sidebar, showPlaylists: v } })} 
                    />
                </div>
            </div>

            {/* Visualizer Settings */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <Activity className="w-5 h-5 mr-2 text-primary" /> Visualizer Style
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {(['BARS', 'WAVE', 'CIRCLE', 'MIRROR'] as VisualizerMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setVisualizerMode(mode)}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                visualizerMode === mode 
                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                : 'bg-black/20 border-white/10 text-neutral-400 hover:bg-white/5'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUMN 3: Shortcuts & Keys */}
        <div className="space-y-8">
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm h-full">
                 <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <Keyboard className="w-5 h-5 mr-2 text-primary" /> Keyboard Shortcuts
                </h3>
                <div>
                    <ShortcutRow id="playPause" label="Play / Pause" value={settings.shortcuts.playPause} />
                    <ShortcutRow id="prev" label="Previous Song" value={settings.shortcuts.prev} />
                    <ShortcutRow id="next" label="Next Song" value={settings.shortcuts.next} />
                    <ShortcutRow id="loop" label="Toggle Loop" value={settings.shortcuts.loop} />
                    <ShortcutRow id="zen" label="Toggle Zen Mode" value={settings.shortcuts.zen} />
                    <ShortcutRow id="visualizer" label="Cycle Visualizer" value={settings.shortcuts.visualizer} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
