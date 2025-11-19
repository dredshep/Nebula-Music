
import React from 'react';
import { Home, Disc, Mic2, Music, ListMusic, Settings, Compass, Search, Command } from 'lucide-react';
import { useStore } from '../context/Store';
import { View } from '../types';

export const Sidebar: React.FC = () => {
  const { currentView, setView, isDemoMode, settings, openSearchModal } = useStore();
  const s = settings.sidebar;

  const NavItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: View }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg group
        ${currentView === view 
          ? 'bg-primary/20 text-primary border-r-2 border-primary' 
          : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className={`w-5 h-5 mr-3 ${currentView === view ? 'text-primary' : 'group-hover:text-white'}`} />
      {label}
    </button>
  );

  return (
    <div className="hidden md:flex flex-col w-64 h-full glass border-r border-white/5 pt-6 pb-4 z-20 relative bg-neutral-950/50">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-0 group hover:rotate-180 transition-transform duration-700">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white stroke-current" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10v4" className="opacity-50" />
                <path d="M8 7v10" className="opacity-75" />
                <path d="M12 3v18" className="opacity-100" />
                <path d="M16 7v10" className="opacity-75" />
                <path d="M20 10v4" className="opacity-50" />
              </svg>
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">NEBULA</h1>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Stream</p>
            </div>
        </div>

        {/* Search Trigger */}
        <button 
            onClick={openSearchModal}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-neutral-400 transition-colors group mb-6"
        >
            <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 group-hover:text-white transition-colors" />
                <span>Search...</span>
            </div>
            <div className="flex items-center space-x-1">
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 font-mono text-[10px] font-medium text-neutral-500">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </button>
        
        <div className="flex items-center bg-white/5 rounded px-3 py-1.5 border border-white/5">
          <div className={`w-2 h-2 rounded-full mr-2 ${isDemoMode ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className="text-xs text-neutral-400 font-mono uppercase">{isDemoMode ? 'DEMO MODE' : 'CONNECTED'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide">
        <div>
            <h3 className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Discover</h3>
            {s.showHome && <NavItem icon={Home} label="Home" view="HOME" />}
            {s.showBrowse && <NavItem icon={Compass} label="Browse" view="BROWSE" />}
        </div>

        {(s.showArtists || s.showAlbums || s.showSongs) && (
          <div>
              <h3 className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Library</h3>
              {s.showArtists && <NavItem icon={Mic2} label="Artists" view="ARTISTS" />}
              {s.showAlbums && <NavItem icon={Disc} label="Albums" view="ALBUMS" />}
              {s.showSongs && <NavItem icon={Music} label="Songs" view="SONGS" />}
          </div>
        )}

        {s.showPlaylists && (
          <div>
              <h3 className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Playlists</h3>
              <NavItem icon={ListMusic} label="My Playlists" view="PLAYLISTS" />
          </div>
        )}
      </div>

      {/* Fixed Settings at Bottom */}
      <div className="px-3 mt-auto pt-4 border-t border-white/5">
        <NavItem icon={Settings} label="Settings" view="SETTINGS" />
      </div>
    </div>
  );
};