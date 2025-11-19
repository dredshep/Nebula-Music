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

  async scrobble(id: string, submission: boolean = true): Promise<void> {
    if (this.isDemo) return;
    try {
        await fetch(this.buildUrl('scrobble.view', { id, submission: submission.toString() }));
    } catch (e) {
        console.warn("Scrobble failed", e);
    }
  }

  async getGenres(): Promise<string[]> {
    if (this.isDemo) return ['Electronic', 'Rock', 'Jazz', 'Synthwave', 'Pop', 'Classical'];
    
    const cacheKey = 'genres_list';
    const cached = await db.getCachedResponse(cacheKey, 1440); // 24h
    if (cached) return cached;

    try {
        const res = await fetch(this.buildUrl('getGenres.view'));
        const data = await res.json();
        const genres = data['subsonic-response'].genres?.genre || [];
        // Extract names and sort
        const genreNames = genres.map((g: any) => g.value || g.name).sort();
        await db.cacheResponse(cacheKey, genreNames);
        return genreNames;
    } catch (e) {
        return [];
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

  async getAlbumList(type: string, size: number = 20, offset: number = 0, params: Record<string, string> = {}): Promise<IAlbum[]> {
     if (this.isDemo) {
        let sorted = [...MOCK_ALBUMS];
        // Generate more mock albums if needed to test pagination
        if (sorted.length < 20) {
            for(let i=0; i<50; i++) sorted.push({...MOCK_ALBUMS[i % MOCK_ALBUMS.length], id: `mock-al-${i}`, name: `Mock Album ${i}`, year: 2020 + (i % 5)});
        }

        if (params.genre) {
             // Mock genre filter - assumes Mocks have generic genre or matches everything for demo
        }
        if (params.fromYear && params.toYear) {
            const from = parseInt(params.fromYear);
            const to = parseInt(params.toYear);
            sorted = sorted.filter(a => (a.year || 0) >= from && (a.year || 0) <= to);
        }

        if (type === 'newest') sorted.sort((a, b) => b.created.localeCompare(a.created));
        if (type === 'recent') sorted.sort((a, b) => b.created.localeCompare(a.created));
        if (type === 'random') sorted.sort(() => 0.5 - Math.random());
        if (type === 'alphabeticalByName') sorted.sort((a, b) => a.name.localeCompare(b.name));
        // frequent matches default mock behavior roughly
        
        return sorted.slice(offset, offset + size);
     }
     
     // Build cache key including all params
     const paramString = Object.entries(params).map(([k,v]) => `${k}-${v}`).join('_');
     const cacheKey = `albumList_${type}_${size}_${offset}_${paramString}`;
     
     if (type !== 'random') {
         const cached = await db.getCachedResponse(cacheKey, 30); // 30 mins cache
         if (cached) return cached;
     }

     try {
       // Subsonic getAlbumList supports 'type', 'size', 'offset', and dynamic params for byGenre/byYear
       const res = await fetch(this.buildUrl('getAlbumList.view', { type, size: size.toString(), offset: offset.toString(), ...params }));
       const data = await res.json();
       const result = data['subsonic-response'].albumList?.album || [];
       
       if (type !== 'random' && result.length > 0) {
           await db.cacheResponse(cacheKey, result);
       }
       return result;
     } catch (e) {
       return [];
     }
  }

  async getAlbum(id: string): Promise<IAlbum | null> {
    if (this.isDemo) {
      const album = MOCK_ALBUMS.find(a => a.id === id) || MOCK_ALBUMS[0];
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
        
        if (allArtists.length > 0) {
            await db.cacheResponse(cacheKey, allArtists);
        }
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
  
  async getAllSongs(size: number = 100, offset: number = 0): Promise<ISong[]> {
     return this.searchSongs('', size, offset);
  }

  async searchSongs(query: string, size: number = 50, offset: number = 0): Promise<ISong[]> {
    if (this.isDemo) {
        let allMockSongs = [...MOCK_SONGS];
        // duplicate for volume testing
        for(let i=0; i<5; i++) allMockSongs = [...allMockSongs, ...MOCK_SONGS];
        
        if (query) {
            const q = query.toLowerCase();
            allMockSongs = allMockSongs.filter(s => 
                s.title.toLowerCase().includes(q) || 
                s.artist.toLowerCase().includes(q) || 
                s.album.toLowerCase().includes(q) ||
                (s.genre && s.genre.toLowerCase().includes(q)) ||
                (s.year && s.year.toString().includes(q))
            );
        }
        return allMockSongs.slice(offset, offset + size);
    }

    const cacheKey = `searchSongs_${query}_${size}_${offset}`;
    const cached = await db.getCachedResponse(cacheKey, 60);
    if (cached) return cached;

    try {
        // search3 uses 'songOffset'
        const res = await fetch(this.buildUrl('search3.view', { query, songCount: size.toString(), songOffset: offset.toString() }));
        const data = await res.json();
        const songs = data['subsonic-response'].searchResult3?.song || [];
        const mapped = songs.map((s: any) => this.mapSong(s));
        
        // Cache results
        await db.cacheResponse(cacheKey, mapped);
        return mapped;
    } catch (e) {
        return [];
    }
  }

  async searchAlbums(query: string, size: number = 50, offset: number = 0): Promise<IAlbum[]> {
     if (this.isDemo) {
         const q = query.toLowerCase();
         const filtered = MOCK_ALBUMS.filter(a => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
         return filtered.slice(offset, offset + size);
     }
     
     try {
         const res = await fetch(this.buildUrl('search3.view', { query, albumCount: size.toString(), albumOffset: offset.toString() }));
         const data = await res.json();
         return data['subsonic-response'].searchResult3?.album || [];
     } catch (e) {
         return [];
     }
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
        const res = await fetch(this.buildUrl('search3.view', { query, artistCount: '20', albumCount: '20', songCount: '40' }));
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

  async getLyrics(artist: string, title: string, album?: string, duration?: number): Promise<string> {
    if (this.isDemo) {
      return `(Verse 1)\nStanding on the edge of the neon light\nWatching code flow through the night...`;
    }
    
    // Try LRCLIB first
    try {
      const url = new URL('https://lrclib.net/api/get');
      url.searchParams.append('artist_name', artist);
      url.searchParams.append('track_name', title);
      if (album) url.searchParams.append('album_name', album);
      if (duration) url.searchParams.append('duration', duration.toString());

      const res = await fetch(url.toString());
      if (res.ok) {
          const data = await res.json();
          if (data.plainLyrics || data.syncedLyrics) {
              return data.plainLyrics || data.syncedLyrics;
          }
      }
    } catch (e) {
      console.warn("LRCLIB fetch failed, falling back to Subsonic", e);
    }

    // Fallback to Subsonic
    try {
      const res = await fetch(this.buildUrl('getLyrics.view', { artist, title }));
      const data = await res.json();
      return data['subsonic-response'].lyrics?.content || "No lyrics found.";
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
    if (id.startsWith('http') || id.startsWith('/')) return id;

    if (this.isDemo) {
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
