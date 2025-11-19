import { SubsonicCredentials, ISong, IAlbum, IArtist } from '../types';
import { MOCK_ALBUMS, MOCK_ARTISTS, MOCK_SONGS } from '../constants';
import { db } from './db';
import md5 from 'blueimp-md5';

export class SubsonicService {
  private creds: SubsonicCredentials | null = null;
  private isDemo: boolean = true;

  constructor(creds: SubsonicCredentials | null) {
    this.creds = creds;
    this.isDemo = !creds;
  }

  public setCredentials(creds: SubsonicCredentials) {
    this.creds = creds;
    this.isDemo = false;
  }

  public static hashPassword(password: string): { token: string, salt: string } {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const salt = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const token = md5(password + salt);
    return { token, salt };
  }

  private buildUrl(method: string, params: Record<string, string> = {}): string {
    if (!this.creds) return '';
    const { serverUrl, username, token, salt } = this.creds;
    
    try {
        const url = new URL(serverUrl);
        // Safely append /rest/method without double slashes or missing slashes
        const basePath = url.pathname.replace(/\/$/, '');
        url.pathname = `${basePath}/rest/${method}`;
        
        url.searchParams.set('u', username);
        url.searchParams.set('t', token);
        url.searchParams.set('s', salt);
        url.searchParams.set('v', '1.16.1');
        url.searchParams.set('c', 'NebulaStream');
        url.searchParams.set('f', 'json');
        
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                url.searchParams.set(k, v);
            }
        });

        return url.toString();
    } catch (e) {
        console.error("Failed to build URL:", e);
        return '';
    }
  }

  async getPing(): Promise<boolean> {
    if (this.isDemo) return true;
    try {
      const res = await fetch(this.buildUrl('ping.view'));
      const data = await res.json();
      return data['subsonic-response'].status === 'ok';
    } catch (e) {
      console.error("Ping failed", e);
      return false;
    }
  }

  private mapSong(s: any): ISong {
    return {
        id: s.id,
        parent: s.parent,
        title: s.title,
        album: s.album,
        albumId: s.albumId || s.parent, // Fallback to parent for ID3 folders
        artist: s.artist,
        artistId: s.artistId,
        coverArt: s.coverArt || s.id, // Use ID if coverArt missing
        duration: s.duration,
        track: s.track,
        year: s.year,
        genre: s.genre,
        size: s.size,
        suffix: s.suffix,
        contentType: s.contentType,
        isVideo: s.isVideo,
        path: s.path,
        created: s.created,
        starred: s.starred !== undefined
    };
  }

  async toggleStar(id: string, star: boolean): Promise<boolean> {
    if (this.isDemo) return true;
    try {
        const method = star ? 'star.view' : 'unstar.view';
        const res = await fetch(this.buildUrl(method, { id }));
        const data = await res.json();
        return data['subsonic-response'].status === 'ok';
    } catch (e) {
        return false;
    }
  }

  async getRandomSongs(size: number = 10): Promise<ISong[]> {
    if (this.isDemo) {
      // Return a larger list if requested for demo
      const pool = [...MOCK_SONGS, ...MOCK_SONGS, ...MOCK_SONGS]; 
      return pool.sort(() => 0.5 - Math.random()).slice(0, size);
    }
    try {
      const res = await fetch(this.buildUrl('getRandomSongs.view', { size: size.toString() }));
      const data = await res.json();
      const songs = data['subsonic-response'].randomSongs?.song || [];
      return songs.map((s: any) => this.mapSong(s));
    } catch (e) {
      return [];
    }
  }

  async getAlbumList(type: 'newest' | 'frequent' | 'recent' | 'random', size: number = 10): Promise<IAlbum[]> {
     if (this.isDemo) {
        let sorted = [...MOCK_ALBUMS];
        if (type === 'newest') sorted.sort((a, b) => b.created.localeCompare(a.created));
        if (type === 'random') sorted.sort(() => 0.5 - Math.random());
        return sorted.slice(0, size);
     }
     
     // Try cache first for non-random lists
     const cacheKey = `albumList_${type}_${size}`;
     if (type !== 'random') {
         const cached = await db.getCachedResponse(cacheKey, 30); // 30 mins cache
         if (cached) return cached;
     }

     try {
       const res = await fetch(this.buildUrl('getAlbumList.view', { type, size: size.toString() }));
       const data = await res.json();
       const result = data['subsonic-response'].albumList?.album || [];
       
       if (type !== 'random') {
           await db.cacheResponse(cacheKey, result);
       }
       return result;
     } catch (e) {
       return [];
     }
  }

  async getAlbum(id: string): Promise<IAlbum | null> {
    if (this.isDemo) {
      const album = MOCK_ALBUMS.find(a => a.id === id);
      if (!album) return null;
      const songs = MOCK_SONGS.filter(s => s.album === album.name || s.albumId === id);
      return { ...album, songs };
    }
    try {
      const res = await fetch(this.buildUrl('getAlbum.view', { id }));
      const data = await res.json();
      const albumData = data['subsonic-response'].album;
      if (!albumData) return null;
      const songs = (albumData.song || []).map((s: any) => this.mapSong(s));
      return {
        ...albumData,
        songs
      };
    } catch (e) {
      console.error("Get Album failed", e);
      return null;
    }
  }

  async getArtists(): Promise<IArtist[]> {
    if (this.isDemo) return MOCK_ARTISTS;
    
    // Cache Artists for 24 hours as it's heavy
    const cacheKey = 'all_artists';
    const cached = await db.getCachedResponse(cacheKey, 1440);
    if (cached) return cached;

    try {
        const res = await fetch(this.buildUrl('getArtists.view'));
        const data = await res.json();
        const index = data['subsonic-response'].artists?.index || [];
        let allArtists: IArtist[] = [];
        index.forEach((idx: any) => {
            if (idx.artist) allArtists = [...allArtists, ...idx.artist];
        });
        
        await db.cacheResponse(cacheKey, allArtists);
        return allArtists;
    } catch (e) { return [] }
  }

  async getArtist(id: string): Promise<{ artist: IArtist, albums: IAlbum[] }> {
    if (this.isDemo) {
        const artist = MOCK_ARTISTS.find(a => a.id === id) || MOCK_ARTISTS[0];
        const albums = MOCK_ALBUMS.filter(a => a.artistId === id || a.artist === artist.name);
        return { artist, albums };
    }
    try {
        const res = await fetch(this.buildUrl('getArtist.view', { id }));
        const data = await res.json();
        const artistData = data['subsonic-response'].artist;
        return {
            artist: {
                id: artistData.id,
                name: artistData.name,
                albumCount: artistData.albumCount,
                coverArt: artistData.coverArt
            },
            albums: artistData.album || []
        };
    } catch(e) {
        return { artist: { id, name: 'Unknown' }, albums: [] };
    }
  }

  async getArtistInfo(id: string): Promise<{ bio?: string, image?: string }> {
      if (this.isDemo) {
          return {
              bio: "A legendary entity formed in the digital void.",
              image: "https://picsum.photos/1200/600?grayscale"
          };
      }
      try {
          const res = await fetch(this.buildUrl('getArtistInfo2.view', { id }));
          const data = await res.json();
          const info = data['subsonic-response'].artistInfo2;
          return {
              bio: info?.biography,
              image: info?.largeImageUrl || info?.mediumImageUrl || info?.smallImageUrl
          };
      } catch (e) {
          return {};
      }
  }

  async getTopSongs(artistName: string, count: number = 10): Promise<ISong[]> {
      if (this.isDemo) {
          return MOCK_SONGS.filter(s => s.artist === artistName).slice(0, count);
      }
      try {
          const res = await fetch(this.buildUrl('getTopSongs.view', { artist: artistName, count: count.toString() }));
          const data = await res.json();
          const songs = data['subsonic-response'].topSongs?.song || [];
          return songs.map((s: any) => this.mapSong(s));
      } catch (e) {
          return [];
      }
  }
  
  async getAllSongs(): Promise<ISong[]> {
    if (this.isDemo) return MOCK_SONGS;
    return this.getRandomSongs(50);
  }

  async search(query: string): Promise<{ artists: IArtist[], albums: IAlbum[], songs: ISong[] }> {
    if (!query) return { artists: [], albums: [], songs: [] };
    
    if (this.isDemo) {
       const q = query.toLowerCase();
       return {
           artists: MOCK_ARTISTS.filter(a => a.name.toLowerCase().includes(q)),
           albums: MOCK_ALBUMS.filter(a => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
           songs: MOCK_SONGS.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q))
       };
    }
    
    try {
        const res = await fetch(this.buildUrl('search3.view', { query, artistCount: '6', albumCount: '10', songCount: '20' }));
        const data = await res.json();
        const r = data['subsonic-response'].searchResult3;
        if (!r) return { artists: [], albums: [], songs: [] };
        
        return {
            artists: r.artist || [],
            albums: r.album || [],
            songs: (r.song || []).map((s: any) => this.mapSong(s))
        };
    } catch (e) {
        console.error(e);
        return { artists: [], albums: [], songs: [] };
    }
  }

  async getLyrics(artist: string, title: string): Promise<string> {
    if (this.isDemo) {
      return `(Verse 1)
Standing on the edge of the neon light
Watching code flow through the night
Digital dreams in a binary stream
Nothing is ever quite what it seems

(Chorus)
Oh, ${title}
Resonating through the void
By ${artist}
A melody that can't be destroyed

(Verse 2)
Pixels dancing on the screen
The crispest sound you've ever seen
Nebula Stream taking us high
Underneath the electric sky

(Outro)
Fade out...
Fade out...`;
    }
    try {
      const res = await fetch(this.buildUrl('getLyrics.view', { artist, title }));
      const data = await res.json();
      return data['subsonic-response'].lyrics?.content || "No lyrics found for this track.";
    } catch (e) {
      return "Could not fetch lyrics.";
    }
  }

  getStreamUrl(songId: string): string {
    if (this.isDemo) {
      const samples = [
        'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', 
        'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
      ];
      const index = songId.charCodeAt(songId.length - 1) % samples.length;
      return samples[index];
    }
    return this.buildUrl('stream.view', { id: songId });
  }

  getCoverArtUrl(id: string, size: number = 300): string {
    if (!id) return 'https://picsum.photos/300/300?grayscale';
    
    // If the ID is already a URL (mostly for demo/mock data), return it directly
    if (id.startsWith('http') || id.startsWith('/')) return id;

    if (this.isDemo) {
        // Try finding a match in mock data to keep consistency if ID is passed
        const song = MOCK_SONGS.find(s => s.id === id);
        const album = MOCK_ALBUMS.find(a => a.id === id);
        const artist = MOCK_ARTISTS.find(a => a.id === id);
        const url = song?.coverArt || album?.coverArt || artist?.coverArt;
        if (url && url.startsWith('http')) return url;
        return 'https://picsum.photos/300/300';
    }
    return this.buildUrl('getCoverArt.view', { id, size: size.toString() });
  }
}