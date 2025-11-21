import React from 'react';
import { Home, Compass, Search, Library, Settings } from 'lucide-react';
import { useStore } from '../context/Store';
import { View } from '../types';

export const MobileNav: React.FC = () => {
  const { currentView, setView, openSearchModal } = useStore();

  const isActive = (view: View | View[]) => {
    if (Array.isArray(view)) return view.includes(currentView);
    return currentView === view;
  };

  const isLibraryActive = isActive(['ARTISTS', 'ALBUMS', 'SONGS', 'LIKED_SONGS', 'LIKED_ALBUMS', 'PLAYLISTS', 'PLAYLIST_DETAIL', 'ALBUM_DETAIL', 'ARTIST_DETAIL']);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-between px-6 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <button
        onClick={() => setView('HOME')}
        className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full ${isActive('HOME') ? 'text-primary' : 'text-neutral-500 active:text-neutral-300'}`}
      >
        <Home className={`w-6 h-6 ${isActive('HOME') ? 'fill-current/20' : ''}`} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button
        onClick={() => setView('BROWSE')}
        className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full ${isActive('BROWSE') ? 'text-primary' : 'text-neutral-500 active:text-neutral-300'}`}
      >
        <Compass className={`w-6 h-6 ${isActive('BROWSE') ? 'fill-current/20' : ''}`} />
        <span className="text-[10px] font-medium">Browse</span>
      </button>

      <button
        onClick={openSearchModal}
        className="flex flex-col items-center justify-center space-y-1 flex-1 h-full group"
      >
        <div className="w-12 h-8 bg-white/10 rounded-2xl flex items-center justify-center group-active:bg-white/20 transition-colors">
             <Search className="w-5 h-5 text-white" />
        </div>
      </button>

      <button
        onClick={() => setView('ALBUMS')}
        className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full ${isLibraryActive ? 'text-primary' : 'text-neutral-500 active:text-neutral-300'}`}
      >
        <Library className={`w-6 h-6 ${isLibraryActive ? 'fill-current/20' : ''}`} />
        <span className="text-[10px] font-medium">Library</span>
      </button>

      <button
        onClick={() => setView('SETTINGS')}
        className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full ${isActive('SETTINGS') ? 'text-primary' : 'text-neutral-500 active:text-neutral-300'}`}
      >
        <Settings className={`w-6 h-6 ${isActive('SETTINGS') ? 'fill-current/20' : ''}`} />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </div>
  );
};