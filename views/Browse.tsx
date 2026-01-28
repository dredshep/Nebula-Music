
import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../context/Store';
import { ISong, IAlbum, IPlaylist } from '../types';
import { Play, Music, RefreshCw, Heart, Radio, Zap, Calendar, Sparkles } from 'lucide-react';

interface PlaylistCardProps {
  mix: IPlaylist & { icon: any, desc: string };
  onOpen: () => void;
  onPlay: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ mix, onOpen, onPlay }) => {
  const Icon = mix.icon;
  
  // Handler to open the mix as a playlist
  const handleOpen = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent parent click if any
      onOpen();
  };

  // Handler to play immediately
  const handlePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay();
  };

  return (
      <div className="relative group bg-neutral-900 border border-white/5 hover:border-primary/50 rounded-2xl p-6 transition-all hover:bg-white/5 cursor-pointer overflow-hidden" onClick={handleOpen}>
          <div className="absolute right-0 top-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition group-hover:bg-primary/10"></div>
          <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{mix.name}</h3>
              <p className="text-sm text-neutral-400 mb-6">{mix.desc}</p>
              
              <div className="space-y-2 mb-4">
                  {mix.songs?.slice(0, 3).map((s: ISong) => (
                      <div key={s.id} className="flex items-center text-xs text-neutral-500">
                          <Music className="w-3 h-3 mr-2" />
                          <span className="truncate">{s.title}</span>
                      </div>
                  ))}
              </div>

              <button 
                  onClick={handlePlay}
                  className="w-full py-2 bg-white/10 hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Play Mix
              </button>
          </div>
      </div>
  );
};

export const BrowseView: React.FC = () => {
  const { service, playSong, setView, getMostPlayedSongs } = useStore();
  // Extended type to include the Icon for display
  const [generatedMixes, setGeneratedMixes] = useState<(IPlaylist & { icon: any, desc: string })[]>([]);
  const [dailyAlbums, setDailyAlbums] = useState<IAlbum[]>([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState<IAlbum[]>([]);
  const [newAlbums, setNewAlbums] = useState<IAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (force = false) => {
      setIsLoading(true);
      
      const CACHE_KEY = 'nebula_browse_cache_v2';
      const TS_KEY = 'nebula_browse_ts_v2';
      const ONE_DAY = 24 * 60 * 60 * 1000;
      
      const cached = localStorage.getItem(CACHE_KEY);
      const ts = localStorage.getItem(TS_KEY);

      if (!force && cached && ts) {
          const age = Date.now() - parseInt(ts);
          if (age < ONE_DAY) {
              try {
                  const data = JSON.parse(cached);
                  
                  // Rehydrate icons based on ID patterns
                  const mixes = data.mixes.map((m: any) => {
                      let Icon = Music;
                      if (m.id.includes('flow')) Icon = Zap;
                      else if (m.id.includes('oldies')) Icon = Radio;
                      return { ...m, icon: Icon };
                  });
                  
                  setGeneratedMixes(mixes);
                  setDailyAlbums(data.daily);
                  setNewAlbums(data.new);
                  setRecommendedAlbums(data.recommended);
                  setIsLoading(false);
                  return;
              } catch(e) {
                  console.error("Cache parse error", e);
              }
          }
      }

      // --- Fetch Data ---
      
      // 1. Analyze Habits
      const mostPlayed = getMostPlayedSongs();
      let topGenre = '';
      if (mostPlayed.length > 0) {
          const genreCounts: Record<string, number> = {};
          mostPlayed.forEach(s => { if(s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1; });
          topGenre = Object.keys(genreCounts).sort((a,b) => genreCounts[b] - genreCounts[a])[0];
      }

      // 2. Mixes
      const [oldiesSongs, flowSongs, dailySongs] = await Promise.all([
          service.getRandomSongs(20, { toYear: new Date().getFullYear() - 10 }),
          service.getRandomSongs(20, topGenre ? { genre: topGenre } : {}),
          service.getRandomSongs(20)
      ]);

      const createMix = (idSuffix: string, title: string, desc: string, icon: any, songs: ISong[]) => ({
        id: `generated-${idSuffix}-${Date.now()}`,
        name: title,
        desc,
        icon,
        songCount: songs.length,
        duration: songs.reduce((acc, s) => acc + s.duration, 0),
        created: new Date().toISOString(),
        coverArt: songs[0]?.coverArt || songs[0]?.id, 
        songs
      });

      const mixes = [
        createMix('flow', 'Flow State', topGenre ? `Focus generated based on ${topGenre}` : 'Focus generated just for you', Zap, flowSongs),
        createMix('oldies', 'Nostalgia Trip', 'Rediscover favorites from the past', Radio, oldiesSongs),
        createMix('daily', 'Daily Mix', 'Fresh tracks to start your day', Music, dailySongs),
      ];

      // 3. Daily Albums
      let dailyStrategy = 'random';
      let dailyParams = {};
      if (topGenre && Math.random() > 0.3) {
          dailyStrategy = 'byGenre';
          dailyParams = { genre: topGenre };
      } else if (mostPlayed.length > 0) {
          dailyStrategy = 'frequent';
      }
      
      let daily = await service.getAlbumList(dailyStrategy, 5, Math.floor(Math.random() * 20), dailyParams);
      if (daily.length < 5) {
          const fill = await service.getAlbumList('random', 5 - daily.length);
          daily = [...daily, ...fill];
      }
      daily = daily.sort(() => 0.5 - Math.random());

      // 4. New & Recommended
      const [newRes, recRes] = await Promise.all([
          service.getAlbumList('newest', 10),
          topGenre ? service.getAlbumList('byGenre', 10, 0, { genre: topGenre }) : service.getAlbumList('frequent', 10)
      ]);

      // Set State
      setGeneratedMixes(mixes);
      setDailyAlbums(daily);
      setNewAlbums(newRes);
      setRecommendedAlbums(recRes);
      
      // Cache (Strip icons before saving as they are functions)
      const cacheMixes = mixes.map(({ icon, ...rest }) => rest);
      
      const cacheData = {
          mixes: cacheMixes,
          daily,
          new: newRes,
          recommended: recRes
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(TS_KEY, Date.now().toString());
      
      setIsLoading(false);
  }, [service, getMostPlayedSongs]);

  useEffect(() => {
      loadData();
  }, [loadData]);

  if (isLoading) {
      return (
          <div className="p-10 flex flex-col items-center justify-center h-[50vh] animate-fade-in">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-400 font-medium">Curating your experience...</p>
          </div>
      );
  }

  return (
    <div className="p-10 pb-32 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">Browse & Discover</h2>
         <button onClick={() => loadData(true)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
             <RefreshCw className="w-5 h-5 text-neutral-400" />
         </button>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center"><Sparkles className="w-5 h-5 text-yellow-500 mr-2" /> Generated For You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedMixes.map((mix) => (
              <PlaylistCard 
                key={mix.id} 
                mix={mix} 
                onOpen={() => setView('PLAYLIST_DETAIL', mix)}
                onPlay={() => {
                  if (mix.songs && mix.songs.length > 0) {
                      playSong(mix.songs[0], mix.songs);
                  }
                }}
              />
            ))}
        </div>
      </div>

      {/* Daily Recommendations */}
      <div className="mb-12">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 text-primary mr-2" /> Daily Recommendations
            </h3>
            <button 
                onClick={() => loadData(true)}
                className="text-xs font-bold text-neutral-400 hover:text-white flex items-center bg-white/5 px-3 py-1.5 rounded-full transition"
            >
                <RefreshCw className="w-3 h-3 mr-1.5" /> Refresh Picks
            </button>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {dailyAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group cursor-pointer bg-neutral-900/50 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition duration-300"
                  onClick={() => setView('ALBUM_DETAIL', album.id)}
                >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg bg-neutral-800">
                        <img src={service.getCoverArtUrl(album.coverArt || album.id, 300)} alt={album.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                        </div>
                        <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">PICK</div>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{album.name}</h4>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                </div>
            ))}
         </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center"><Heart className="w-5 h-5 text-red-500 mr-2" /> Recommended for You</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recommendedAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group cursor-pointer bg-neutral-800/30 rounded-xl p-3 hover:bg-white/10 transition"
                  onClick={() => setView('ALBUM_DETAIL', album.id)}
                >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                        <img src={service.getCoverArtUrl(album.coverArt || album.id, 300)} alt={album.name} className="w-full h-full object-cover transition group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{album.name}</h4>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center"><Sparkles className="w-5 h-5 text-blue-400 mr-2" /> New Arrivals</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {newAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group cursor-pointer bg-neutral-800/30 rounded-xl p-3 hover:bg-white/10 transition"
                  onClick={() => setView('ALBUM_DETAIL', album.id)}
                >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                        <img src={service.getCoverArtUrl(album.coverArt || album.id, 300)} alt={album.name} className="w-full h-full object-cover transition group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{album.name}</h4>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
