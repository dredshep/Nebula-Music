

export interface ISong {
  id: string;
  parent?: string;
  title: string;
  album: string;
  artist: string;
  coverArt?: string;
  duration: number; // seconds
  track?: number;
  discNumber?: number;
  year?: number;
  genre?: string;
  size?: number;
  suffix?: string;
  contentType?: string;
  isVideo?: boolean;
  path?: string;
  albumId?: string;
  artistId?: string;
  created?: string; // ISO date
  starred?: boolean;
  bitRate?: number;
  playCount?: number;
}

export interface IAlbum {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  created: string;
  year?: number;
  genre?: string;
  songs?: ISong[]; // Extended for detail view
  starred?: boolean;
  info?: {
      notes?: string;
      musicBrainzId?: string;
      lastFmUrl?: string;
  }
}

export interface IArtist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  bio?: string;
  largeImageUrl?: string;
}

export interface IPlaylist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number;
  created: string;
  coverArt?: string;
  songs?: ISong[];
}

export interface HomeData {
    randomSongs: ISong[];
    recentAlbums: IAlbum[];
    newestAlbums: IAlbum[];
    exploreAlbums: IAlbum[];
    recommendedTracks: ISong[];
    lastFetched: number;
}

export interface SubsonicCredentials {
  serverUrl: string;
  username: string;
  token: string; // md5(password + salt)
  salt: string;
}

export interface ShortcutBindings {
  playPause: string;
  prev: string;
  next: string;
  loop: string;
  visualizer: string;
  zen: string;
}

export interface AppSettings {
  theme: {
    primaryColor: string; // hex
    secondaryColor: string; // hex
  };
  sidebar: {
    showHome: boolean;
    showBrowse: boolean;
    showArtists: boolean;
    showAlbums: boolean;
    showSongs: boolean;
    showPlaylists: boolean;
  };
  shortcuts: ShortcutBindings;
}

export type PlaybackMode = 'normal' | 'shuffle';
export type RepeatMode = 'OFF' | 'ALL' | 'ONE';
export type VisualizerMode = 'BARS' | 'WAVE' | 'CIRCLE' | 'MIRROR' | 'SPECTRUM' | 'PARTICLES' | 'HEXAGON';
export type View = 'HOME' | 'BROWSE' | 'ARTISTS' | 'ALBUMS' | 'SONGS' | 'PLAYLISTS' | 'SETTINGS' | 'PLAYLIST_DETAIL' | 'ARTIST_DETAIL' | 'ALBUM_DETAIL' | 'SEARCH' | 'LIKED_SONGS' | 'LIKED_ALBUMS';

export interface AppState {
  currentView: View;
  viewData?: any; // ID for playlist or album drill-down
  queue: ISong[];
  currentSongIndex: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  pitchCorrection: boolean; // If false, speed affects pitch (vinyl mode)
  repeatMode: RepeatMode;
  visualizerMode: VisualizerMode;
  credentials: SubsonicCredentials | null;
  isDemoMode: boolean;
  settings: AppSettings;
  
  // Playlist Logic
  playlists: IPlaylist[];
  modalOpen: boolean;
  songToAddToPlaylist: ISong | null;

  // Search
  searchResults: { artists: IArtist[], albums: IAlbum[], songs: ISong[] };
  isSearching: boolean;
  lastSearchQuery: string;
  
  // Zen Mode State (Global to allow shortcuts)
  isZenMode: boolean;
  setZenMode: (enabled: boolean) => void;

  // Caching
  homeData: HomeData;
  cachedArtists: IArtist[];
}
