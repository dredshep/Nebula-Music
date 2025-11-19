
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

  const generateDaily = useCallback(async (force = false) => {
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('nebula_browse_daily_date');
      const storedData = localStorage.getItem('nebula_browse_daily_data');

      if (!force && storedDate === today && storedData) {
          try {
              setDailyAlbums(JSON.parse(storedData));
              return;
          } catch(e) {}
      }

      // Analyze habits
      const mostPlayed = getMostPlayedSongs();
      let params = {};
      let strategy = 'random';

      if (mostPlayed.length > 0) {
          // Find top genre
          const genreCounts: Record<string, number> = {};
          mostPlayed.forEach(s => {
              if(s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
          });
          const topGenre = Object.keys(genreCounts).sort((a,b) => genreCounts[b] - genreCounts[a])[0];
          
          if (topGenre && Math.random() > 0.3) {
              strategy = 'byGenre';
              params = { genre: topGenre };
          } else {
              strategy = 'frequent'; 
          }
      }

      let results = await service.getAlbumList(strategy, 5, Math.floor(Math.random() * 20), params);
      
      // Fallback if empty
      if (results.length < 5) {
          const fill = await service.getAlbumList('random', 5 - results.length);
          results = [...results, ...fill];
      }
      
      // Shuffle results for variety
      results = results.sort(() => 0.5 - Math.random());

      setDailyAlbums(results);
      localStorage.setItem('nebula_browse_daily_date', today);
      localStorage.setItem('nebula_browse_daily_data', JSON.stringify(results));

  }, [service, getMostPlayedSongs]);

  const loadData = async () => {
    setIsLoading(true);
    
    // 1. Analyze listening habits
    const mostPlayed = getMostPlayedSongs();
    let topGenre = '';
    if (mostPlayed.length > 0) {
        const genreCounts: Record<string, number> = {};
        mostPlayed.forEach(s => { if(s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1; });
        topGenre = Object.keys(genreCounts).sort((a,b) => genreCounts[b] - genreCounts[a])[0];
    }

    // 2. Generate Mixes based on logic
    // Mix 1: Nostalgia Trip - Songs older than 10 years
    const oldiesSongs = await service.getRandomSongs(20, { toYear: new Date().getFullYear() - 10 });
    
    // Mix 2: Flow State - Genre specific or random if no genre
    const flowSongs = await service.getRandomSongs(20, topGenre ? { genre: topGenre } : {});
    
    // Mix 3: Daily Mix - Blend of most played artists/genre + random
    // Just grab random for now but heavily weighted
    const dailySongs = await service.getRandomSongs(20);
    
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

    setGeneratedMixes([
        createMix('flow', 'Flow State', topGenre ? `Focus generated based on ${topGenre}` : 'Focus generated just for you', Zap, flowSongs),
        createMix('oldies', 'Nostalgia Trip', 'Rediscover favorites from the past', Radio, oldiesSongs),
        createMix('daily', 'Daily Mix', 'Fresh tracks to start your day', Music, dailySongs),
    ]);

    await generateDaily();

    // 3. New Albums (Recently Added)
    setNewAlbums(await service.getAlbumList('newest', 10));

    // 4. Recommended (Based on Genre)
    if (topGenre) {
        setRecommendedAlbums(await service.getAlbumList('byGenre', 10, 0, { genre: topGenre }));
    } else {
        setRecommendedAlbums(await service.getAlbumList('frequent', 10));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [service]);

  return (
    <div className="p-10 pb-32">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">Browse & Discover</h2>
         <button onClick={loadData} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
             <RefreshCw className={`w-5 h-5 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
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
                onClick={() => generateDaily(true)}
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
