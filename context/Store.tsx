
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, ISong, View, SubsonicCredentials, AppSettings, IPlaylist, VisualizerMode, RepeatMode, IArtist, IAlbum } from '../types';
import { SubsonicService } from '../services/subsonicService';
import { MOCK_PLAYLISTS } from '../constants';
import { db } from '../services/db';

interface StoreContextType extends AppState {
  setView: (view: View, data?: any) => void;
  playSong: (song: ISong, contextQueue?: ISong[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (val: number) => void;
  setPlaybackRate: (val: number) => void;
  setPitchCorrection: (enabled: boolean) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  toggleRepeat: () => void;
  toggleLike: (song: ISong) => void;
  connectToSubsonic: (url: string, user: string, pass: string) => Promise<boolean>;
  disconnect: () => void;
  enableDemoMode: () => void;
  addToQueue: (song: ISong) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Playlist Actions
  openPlaylistModal: (song: ISong) => void;
  closePlaylistModal: () => void;
  createPlaylist: (name: string) => void;
  savePlaylist: (playlist: IPlaylist) => void;
  addSongToPlaylist: (playlistId: string, song: ISong) => void;
  deletePlaylist: (id: string) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;

  // Search
  performSearch: (query: string) => void;
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;

  // Stats & History
  getMostPlayedSongs: () => ISong[];
  history: ISong[];

  service: SubsonicService;
  audioRef: React.RefObject<HTMLAudioElement>;
  analyser: AnalyserNode | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  theme: {
    primaryColor: '#06b6d4',
    secondaryColor: '#8b5cf6',
  },
  sidebar: {
    showHome: true,
    showBrowse: true,
    showArtists: true,
    showAlbums: true,
    showSongs: true,
    showPlaylists: true,
  },
  shortcuts: {
    playPause: ' ',
    prev: 'ArrowLeft',
    next: 'ArrowRight',
    loop: 'l',
    visualizer: 'v',
    zen: 'z'
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Service
  const [service] = useState(() => new SubsonicService(null));

  // App State
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [viewData, setViewData] = useState<any>(undefined);
  const [credentials, setCredentialsState] = useState<SubsonicCredentials | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false); // Default to false to show Setup
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Player State
  const [queue, setQueue] = useState<ISong[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitchCorrection, setPitchCorrection] = useState(true); 
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('BARS');
  const [isZenMode, setZenMode] = useState(false);

  // Playlist State
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<ISong | null>(null);
  
  // Search State
  const [searchResults, setSearchResults] = useState<{ artists: IArtist[], albums: IAlbum[], songs: ISong[] }>({ artists: [], albums: [], songs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Play History & Stats
  const [playHistory, setPlayHistory] = useState<Record<string, { count: number, song: ISong }>>({});
  const [history, setHistory] = useState<ISong[]>([]); // Chronological history
  const lastPlayedSongIdRef = useRef<string | null>(null);
  const hasScrobbledRef = useRef(false);

  // Audio Element State
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Audio Analysis State
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize DB and check for credentials
  useEffect(() => {
      const init = async () => {
          await db.init();
          const savedCreds = await db.getCredentials();
          if (savedCreds) {
             service.setCredentials(savedCreds);
             setCredentialsState(savedCreds);
             setIsDemoMode(false);
             service.getPing(); // Async check, don't await
             // Fetch server playlists on load if credentials exist
             service.getPlaylists().then(setPlaylists);
          }

          const savedSettings = await db.get('settings', 'user_settings');
          if (savedSettings) {
              setSettings(prev => ({ ...prev, ...savedSettings, theme: { ...prev.theme, ...savedSettings.theme }, shortcuts: { ...prev.shortcuts, ...savedSettings.shortcuts } }));
          }
          
          // Load play history
          try {
            const storedStats = localStorage.getItem('nebula_play_history');
            if (storedStats) {
                setPlayHistory(JSON.parse(storedStats));
            }
            const storedList = localStorage.getItem('nebula_history');
            if (storedList) {
                setHistory(JSON.parse(storedList));
            }
        } catch (e) {}
      };
      init();
  }, [service]);

  // Record Play Logic (Counts & History List)
  useEffect(() => {
      if (isPlaying && currentSongIndex >= 0 && queue[currentSongIndex]) {
          const song = queue[currentSongIndex];
          if (song.id !== lastPlayedSongIdRef.current) {
              hasScrobbledRef.current = false;

              // Update Counts
              setPlayHistory(prev => {
                  const currentCount = prev[song.id]?.count || 0;
                  const updated = {
                      ...prev,
                      [song.id]: { count: currentCount + 1, song }
                  };
                  localStorage.setItem('nebula_play_history', JSON.stringify(updated));
                  return updated;
              });

              // Update Recent History (Chronological, unique bubble to top)
              setHistory(prev => {
                  const withoutCurrent = prev.filter(s => s.id !== song.id);
                  const newHistory = [song, ...withoutCurrent].slice(0, 50);
                  localStorage.setItem('nebula_history', JSON.stringify(newHistory));
                  return newHistory;
              });

              lastPlayedSongIdRef.current = song.id;
          }
      }
  }, [currentSongIndex, isPlaying, queue]);

  // Audio Setup & Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const ana = ctx.createAnalyser();
      ana.fftSize = 2048; 
      ana.smoothingTimeConstant = 0.85;
      
      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(ana);
        ana.connect(ctx.destination);
        audioContextRef.current = ctx;
        setAnalyser(ana);
      } catch (e) {
        console.warn("Audio source connection error:", e);
      }
    }

    // Use event listener for Scrobbling to avoid re-rendering the whole app via state
    const handleTimeUpdate = () => {
        const cTime = audio.currentTime;
        const dur = audio.duration || 0;
        
        // Sync Media Session Position
        if ('mediaSession' in navigator && !isNaN(dur) && dur > 0) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: dur,
                    playbackRate: audio.playbackRate,
                    position: cTime
                });
            } catch (e) {
                // Ignore if position > duration occasionally
            }
        }
        
        if (isPlaying && dur > 0 && cTime > 0 && !hasScrobbledRef.current && queue[currentSongIndex]) {
           if (cTime > 30 || cTime > dur / 2) {
               service.scrobble(queue[currentSongIndex].id);
               hasScrobbledRef.current = true;
           }
        }
    };
    
    // Re-apply playback rate when metadata loads (prevents reset on song change)
    const handleMetadata = () => {
         if(audio) {
             audio.playbackRate = playbackRate;
             const a = audio as any;
             if (a.preservesPitch !== undefined) a.preservesPitch = pitchCorrection;
             else if (a.mozPreservesPitch !== undefined) a.mozPreservesPitch = pitchCorrection;
             else if (a.webkitPreservesPitch !== undefined) a.webkitPreservesPitch = pitchCorrection;
         }
    };

    const onEnded = () => handleSongEnd();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata); // Ensure settings persist
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }); // Effect runs on mount and when deps change, but ref is stable

  const handleSongEnd = () => {
      if (repeatMode === 'ONE') {
          if(audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
          }
      } else {
          nextSong(false);
      }
  };

  // Apply Theme
  useEffect(() => {
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r} ${g} ${b}`;
    };

    document.documentElement.style.setProperty('--color-primary', hexToRgb(settings.theme.primaryColor));
    document.documentElement.style.setProperty('--color-secondary', hexToRgb(settings.theme.secondaryColor));
  }, [settings.theme]);

  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  // Sync Audio Settings State with Element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      const audio = audioRef.current as any;
      if (audio.preservesPitch !== undefined) audio.preservesPitch = pitchCorrection;
      else if (audio.mozPreservesPitch !== undefined) audio.mozPreservesPitch = pitchCorrection;
      else if (audio.webkitPreservesPitch !== undefined) audio.webkitPreservesPitch = pitchCorrection;
    }
  }, [volume, playbackRate, pitchCorrection, currentSongIndex]); // Depend on SongIndex to re-apply after src change

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(e => console.warn("Play failed", e));
      else audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex]);

  const playSong = (song: ISong, contextQueue?: ISong[]) => {
    if (contextQueue) {
      setQueue(contextQueue);
      const idx = contextQueue.findIndex(s => s.id === song.id);
      setCurrentSongIndex(idx);
    } else {
      setQueue([song]);
      setCurrentSongIndex(0);
    }
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = (isManual = true) => {
    if (queue.length === 0) return;
    if (currentSongIndex < queue.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setIsPlaying(true);
    } else {
      if (repeatMode === 'ALL') {
          setCurrentSongIndex(0);
          setIsPlaying(true);
      } else {
          setIsPlaying(false);
          setCurrentSongIndex(0); 
      }
    }
  };

  const prevSong = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        return;
    }
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setIsPlaying(true);
    }
  };

  // Media Session API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSongIndex >= 0 && queue[currentSongIndex]) {
      const song = queue[currentSongIndex];
      const cover = service.getCoverArtUrl(song.id, 512);

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [
          { src: cover, sizes: '512x512', type: 'image/jpeg' },
          { src: cover, sizes: '512x512', type: 'image/png' }
        ]
      });
    }

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', prevSong);
    navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
    
    // Seeking support
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
        }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
         const skip = details.seekOffset || 10;
         if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skip, 0);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
         const skip = details.seekOffset || 10;
         if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skip, audioRef.current.duration);
    });
    
  }, [currentSongIndex, queue, service, isPlaying]);

  // Update Media Session Playback State
  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
  }, [isPlaying]);

  const toggleRepeat = () => {
      const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
      const idx = modes.indexOf(repeatMode);
      setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  const toggleLike = (song: ISong) => {
      const newStatus = !song.starred;
      const updateList = (list: ISong[]) => list.map(s => s.id === song.id ? { ...s, starred: newStatus } : s);
      setQueue(prev => updateList(prev));
      service.toggleStar(song.id, newStatus);
  };

  const addToQueue = (song: ISong) => {
    setQueue(prev => [...prev, song]);
  };

  const setView = (v: View, data?: any) => {
    setCurrentView(v);
    setViewData(data);
  };

  const performSearch = async (query: string) => {
    setLastSearchQuery(query);
    setIsSearching(true);
    const results = await service.search(query);
    setSearchResults(results);
    setIsSearching(false);
    setView('SEARCH');
  };
  
  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        theme: { ...prev.theme, ...(newSettings.theme || {}) },
        sidebar: { ...prev.sidebar, ...(newSettings.sidebar || {}) },
        shortcuts: { ...prev.shortcuts, ...(newSettings.shortcuts || {}) }
      };
      db.set('settings', 'user_settings', updated);
      return updated;
    });
  };

  const connectToSubsonic = async (url: string, user: string, pass: string) => {
    const { token, salt } = SubsonicService.hashPassword(pass);
    const creds: SubsonicCredentials = {
      serverUrl: url,
      username: user,
      token,
      salt
    };

    service.setCredentials(creds);
    const success = await service.getPing();
    
    if (success) {
      setCredentialsState(creds);
      setIsDemoMode(false);
      db.saveCredentials(creds); // Save to DB
      // Fetch playlists from server
      service.getPlaylists().then(setPlaylists);
      return true;
    } else {
      service.setCredentials(null as any);
      return false;
    }
  };
  
  const disconnect = async () => {
      service.setCredentials(null as any);
      setCredentialsState(null);
      await db.clear('settings');
      await db.clear('api_cache');
      setQueue([]);
      setPlaylists([]); // Clear playlists
      setCurrentSongIndex(-1);
      setIsPlaying(false);
      setIsDemoMode(false); 
  };

  const enableDemoMode = () => {
      setIsDemoMode(true);
      setPlaylists(MOCK_PLAYLISTS); // Load mocks for demo
  };

  const openPlaylistModal = (song: ISong) => {
    setSongToAddToPlaylist(song);
    setModalOpen(true);
  };

  const closePlaylistModal = () => {
    setModalOpen(false);
    setSongToAddToPlaylist(null);
  };

  const createPlaylist = (name: string) => {
    const newPl: IPlaylist = {
      id: `local-${Date.now()}`,
      name,
      songCount: 0,
      duration: 0,
      created: new Date().toISOString(),
      songs: []
    };
    setPlaylists(prev => [...prev, newPl]);
  };

  const savePlaylist = (playlist: IPlaylist) => {
    const newPl: IPlaylist = {
      ...playlist,
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate new ID to allow duplicate saves or re-saves
      created: new Date().toISOString()
    };
    setPlaylists(prev => [...prev, newPl]);
  };

  const deletePlaylist = (id: string) => {
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (currentView === 'PLAYLIST_DETAIL' && viewData === id) {
          setView('PLAYLISTS');
      }
  };

  const addSongToPlaylist = (playlistId: string, song: ISong) => {
    setPlaylists(playlists.map(pl => {
      if (pl.id === playlistId) {
        const currentSongs = pl.songs || [];
        return {
          ...pl,
          songCount: currentSongs.length + 1,
          duration: pl.duration + song.duration,
          songs: [...currentSongs, song],
          coverArt: currentSongs.length === 0 ? song.coverArt : pl.coverArt
        };
      }
      return pl;
    }));
  };

  const reorderPlaylist = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => prev.map(pl => {
        if (pl.id === playlistId && pl.songs) {
            const newSongs = [...pl.songs];
            const [movedSong] = newSongs.splice(fromIndex, 1);
            newSongs.splice(toIndex, 0, movedSong);
            return { ...pl, songs: newSongs };
        }
        return pl;
    }));
  };

  // Stabilize reference to avoid unnecessary re-fetches in Home
  const getMostPlayedSongs = useCallback(() => {
      const historyItems = Object.values(playHistory) as { count: number, song: ISong }[];
      const sorted = historyItems.sort((a, b) => b.count - a.count);
      return sorted.map(item => item.song);
  }, [playHistory]);

  return (
    <StoreContext.Provider value={{
      currentView, setView, viewData,
      queue, currentSongIndex, isPlaying, volume, playbackRate, pitchCorrection, visualizerMode, repeatMode,
      credentials, isDemoMode, settings,
      playlists, modalOpen, songToAddToPlaylist,
      playSong, togglePlay, nextSong, prevSong, setVolume, setPlaybackRate, setPitchCorrection, setVisualizerMode, toggleRepeat, toggleLike,
      connectToSubsonic, disconnect, enableDemoMode, addToQueue, updateSettings,
      openPlaylistModal, closePlaylistModal, createPlaylist, savePlaylist, addSongToPlaylist, deletePlaylist, reorderPlaylist,
      performSearch, searchResults, isSearching, lastSearchQuery, isSearchModalOpen, openSearchModal, closeSearchModal,
      getMostPlayedSongs, history,
      service, audioRef, analyser,
      isZenMode, setZenMode
    }}>
      {children}
      <audio 
        ref={audioRef} 
        src={currentSongIndex >= 0 ? service.getStreamUrl(queue[currentSongIndex].id) : undefined} 
        crossOrigin="anonymous"
      />
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
