
import React, { useEffect, useCallback, useRef } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Player } from './components/Player';
import { HomeView } from './views/Home';
import { LibraryView } from './views/Library';
import { BrowseView } from './views/Browse';
import { SettingsView } from './views/Settings';
import { ArtistDetailView } from './views/ArtistDetailView';
import { AlbumDetailView } from './views/AlbumDetail';
import { PlaylistDetailView } from './views/PlaylistDetail';
import { SearchView } from './views/Search';
import { PlaylistModal } from './components/PlaylistModal';
import { SearchModal } from './components/SearchModal';
import { SetupScreen } from './components/SetupScreen';
import { WhatsNewModal } from './components/WhatsNewModal';
import { VisualizerMode } from './types';

const AppContent: React.FC = () => {
  const { 
    currentView, setView, credentials, isDemoMode, queue, currentSongIndex, 
    togglePlay, nextSong, prevSong, toggleRepeat, isPlaying,
    visualizerMode, setVisualizerMode, isZenMode, setZenMode,
    settings
  } = useStore();

  const mainRef = useRef<HTMLElement>(null);

  const handleGlobalShortcuts = useCallback((e: KeyboardEvent) => {
      // Ignore shortcuts if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // Ignore system combos

      const { shortcuts } = settings;
      const key = e.key;

      if (key === 'Escape' && isZenMode) {
          setZenMode(false);
          return;
      }

      // Add Media Key support explicitly for focused window
      if (key === shortcuts.playPause || key === 'MediaPlayPause') {
          e.preventDefault();
          togglePlay();
      } else if (key === shortcuts.next || key === 'MediaTrackNext') {
          e.preventDefault();
          nextSong();
      } else if (key === shortcuts.prev || key === 'MediaTrackPrevious') {
          e.preventDefault();
          prevSong();
      } else if (key === 'MediaStop') {
          e.preventDefault();
          if (isPlaying) togglePlay();
      } else if (key === shortcuts.loop) {
          toggleRepeat();
      } else if (key === shortcuts.zen) {
          setZenMode(!isZenMode);
      } else if (key === shortcuts.visualizer) {
          const modes: VisualizerMode[] = ['BARS', 'WAVE', 'CIRCLE', 'MIRROR', 'SPECTRUM', 'PARTICLES', 'HEXAGON'];
          const nextIndex = (modes.indexOf(visualizerMode) + 1) % modes.length;
          setVisualizerMode(modes[nextIndex]);
      }
  }, [settings, togglePlay, nextSong, prevSong, toggleRepeat, visualizerMode, setVisualizerMode, isZenMode, setZenMode, isPlaying]);

  useEffect(() => {
      window.addEventListener('keydown', handleGlobalShortcuts);
      return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleGlobalShortcuts]);

  // Scroll to top when view changes
  useEffect(() => {
    if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  if (!credentials && !isDemoMode) {
      return <SetupScreen />;
  }

  let ViewComponent;
  switch (currentView) {
    case 'HOME':
      ViewComponent = HomeView;
      break;
    case 'BROWSE':
      ViewComponent = BrowseView;
      break;
    case 'SETTINGS':
      ViewComponent = SettingsView;
      break;
    case 'ARTISTS':
    case 'ALBUMS':
    case 'SONGS':
    case 'PLAYLISTS':
    case 'LIKED_SONGS':
    case 'LIKED_ALBUMS':
      ViewComponent = LibraryView;
      break;
    case 'ARTIST_DETAIL':
      ViewComponent = ArtistDetailView;
      break;
    case 'ALBUM_DETAIL':
      ViewComponent = AlbumDetailView;
      break;
    case 'PLAYLIST_DETAIL':
      ViewComponent = PlaylistDetailView;
      break;
    case 'SEARCH':
      ViewComponent = SearchView;
      break;
    default:
      ViewComponent = HomeView;
  }

  // Check if player is visible
  const isPlayerVisible = queue.length > 0 && currentSongIndex >= 0;

  return (
    <div className="flex h-[100dvh] w-screen bg-dark text-white overflow-hidden selection:bg-primary selection:text-black font-sans">
      {/* Background Ambient Light */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[100px] opacity-30 animate-blob transition-colors duration-1000"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full filter blur-[120px] opacity-30 animate-blob animation-delay-2000 transition-colors duration-1000"></div>
      </div>

      <Sidebar />
      
      <main ref={mainRef} className="flex-1 h-full overflow-y-auto relative z-10 scroll-smooth">
        {/* Top Bar Fade */}
        <div className="sticky top-0 z-30 px-10 py-4 bg-gradient-to-b from-dark to-transparent pointer-events-none h-20"></div>
        
        {/* Content Wrapper with dynamic padding for Player and Mobile Nav */}
        <div className={`min-h-full transition-all duration-300 ${isPlayerVisible ? 'pb-40 md:pb-32' : 'pb-24 md:pb-0'}`}>
            <ViewComponent />
        </div>
      </main>

      <MobileNav />
      <Player />
      <PlaylistModal />
      <SearchModal />
      <WhatsNewModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
