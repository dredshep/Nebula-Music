
import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../context/Store';
import { ISong, IAlbum } from '../types';
import { Play, Plus, Clock, Flame, Compass, Music, ListPlus, ArrowRight, RefreshCw, Disc, ListMusic, BarChart2, Star } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { service, playSong, setView, openPlaylistModal, getMostPlayedSongs } = useStore();
  const [randomSongs, setRandomSongs] = useState<ISong[]>([]);
  const [recentlyAddedAlbums, setRecentlyAddedAlbums] = useState<IAlbum[]>([]);
  const [recentlyPlayedAlbums, setRecentlyPlayedAlbums] = useState<IAlbum[]>([]);
  const [exploreAlbums, setExploreAlbums] = useState<IAlbum[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  
  // Tabbed Box State
  const [activeTab, setActiveTab] = useState<'played' | 'recommended'>('played');
  const [recommendedTracks, setRecommendedTracks] = useState<ISong[]>([]);
  const mostPlayedTracks = getMostPlayedSongs().slice(0, 50);

  const loadExplore = useCallback(async (force = false) => {
      setLoadingExplore(true);
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('nebula_explore_date');
      const storedData = localStorage.getItem('nebula_explore_data');

      if (!force && storedDate === today && storedData) {
          try {
              setExploreAlbums(JSON.parse(storedData));
              setLoadingExplore(false);
              return;
          } catch (e) {}
      }

      let strategy = 'random';
      let params = {};
      
      const topSongs = getMostPlayedSongs();
      if (topSongs.length > 0) {
          const genreCounts: Record<string, number> = {};
          topSongs.forEach(s => {
              if(s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
          });
          const topGenre = Object.keys(genreCounts).sort((a,b) => genreCounts[b] - genreCounts[a])[0];
          if(topGenre) {
              strategy = 'byGenre';
              params = { genre: topGenre };
          }
      }

      // If forcing refresh and using genre, vary offset to get new results
      const offset = (force && strategy !== 'random') ? Math.floor(Math.random() * 50) : 0;

      let results = await service.getAlbumList(strategy, 10, offset, params);
      
      // Fallback if empty
      if (results.length < 5) {
          const fill = await service.getAlbumList('random', 10 - results.length);
          results = [...results, ...fill];
      }
      
      setExploreAlbums(results);
      // Only store if not forced refresh to keep daily consistency unless requested
      if (!force) {
          localStorage.setItem('nebula_explore_date', today);
          localStorage.setItem('nebula_explore_data', JSON.stringify(results));
      }
      setLoadingExplore(false);
  }, [service, getMostPlayedSongs]);

  const loadRecommended = async () => {
      const topSongs = getMostPlayedSongs();
      let topGenre = '';
      if (topSongs.length > 0) {
          const genreCounts: Record<string, number> = {};
          topSongs.forEach(s => {
              if(s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
          });
          topGenre = Object.keys(genreCounts).sort((a,b) => genreCounts[b] - genreCounts[a])[0];
      }
      
      // Fetch recommended tracks based on genre or random
      const recs = await service.getRandomSongs(50, topGenre ? { genre: topGenre } : {});
      setRecommendedTracks(recs);
  };

  const loadData = async () => {
      setRandomSongs(await service.getRandomSongs(20));
      setRecentlyAddedAlbums(await service.getAlbumList('newest', 5)); // Recently Added
      setRecentlyPlayedAlbums(await service.getAlbumList('recent', 5)); // Recently Played
      await loadExplore();
      await loadRecommended();
  };

  useEffect(() => {
    loadData();
    
    // Poll for updates every hour (3600000 ms)
    const interval = setInterval(() => {
        loadData();
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const displaySongs = activeTab === 'played' ? mostPlayedTracks : recommendedTracks;

  const HeroSection = () => {
    const heroSongs = randomSongs.slice(0, 5);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (heroSongs.length === 0 || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % heroSongs.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroSongs.length, isPaused]);

    if (heroSongs.length === 0) return null;

    const featured = heroSongs[currentIndex];
    const artUrl = service.getCoverArtUrl(featured.coverArt || featured.id, 800);
    const bgUrl = service.getCoverArtUrl(featured.coverArt || featured.id, 1000);

    return (
      <div 
        className="relative w-full h-[450px] rounded-3xl overflow-hidden mb-12 group shadow-2xl shadow-black/50 border border-white/5 transition-all"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
         <div key={featured.id + '-bg'} className="absolute inset-0 animate-fade-in">
            <img 
                src={bgUrl} 
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110" 
                alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent/30" />
         </div>

         <div className="relative z-10 h-full flex flex-col md:flex-row items-center p-8 md:p-16 gap-10 md:gap-16">
             <div key={featured.id + '-img'} className="shrink-0 animate-fade-in-up">
                 <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-neutral-900 relative group/art cursor-pointer" onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}>
                     <img 
                        src={artUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-105 transform-gpu" 
                        alt={featured.album} 
                     />
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                 </div>
             </div>

             <div key={featured.id + '-text'} className="flex-1 text-center md:text-left animate-fade-in flex flex-col justify-center items-center md:items-start">
                 <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-white mb-6">
                     <Flame className="w-3 h-3 mr-2 text-orange-500" /> Featured Track
                 </div>
                 
                 <h1 
                    className="text-4xl md:text-6xl font-bold text-white mb-2 leading-tight drop-shadow-lg cursor-pointer hover:text-primary transition line-clamp-2"
                    onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                 >
                     {featured.title}
                 </h1>
                 
                 <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-lg md:text-xl text-neutral-200 mb-8 font-medium drop-shadow-md">
                     <span 
                        className="hover:text-white cursor-pointer hover:underline"
                        onClick={() => { if(featured.artistId) setView('ARTIST_DETAIL', featured.artistId); }}
                     >
                         {featured.artist}
                     </span>
                     <span className="hidden md:inline text-neutral-500">•</span>
                     <span className="text-neutral-400">{featured.album}</span>
                 </div>

                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     <button 
                         onClick={() => playSong(featured, heroSongs)}
                         className="flex items-center px-8 py-3.5 bg-white text-black rounded-full font-bold hover:bg-primary hover:text-white transition shadow-lg hover:scale-105 active:scale-95 duration-200"
                     >
                         <Play className="w-5 h-5 mr-2 fill-current" />
                         Listen Now
                     </button>
                     <button 
                         onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                         className="flex items-center px-8 py-3.5 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition backdrop-blur-md border border-white/10"
                     >
                         <Disc className="w-5 h-5 mr-2" />
                         View Album
                     </button>
                 </div>
             </div>
         </div>

         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
             {heroSongs.map((_, idx) => (
                 <button 
                     key={idx}
                     onClick={() => setCurrentIndex(idx)}
                     className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                 />
             ))}
         </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, onShowMore, onRefresh, loading }: { title: string, icon: any, onShowMore?: () => void, onRefresh?: () => void, loading?: boolean }) => (
    <div className="flex items-center justify-between mb-6 mt-12">
        <div className="flex items-center">
            <div className="p-2 bg-white/5 rounded-lg mr-3 shadow-inner border border-white/5"><Icon className="w-5 h-5 text-primary" /></div>
            <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
        </div>
        <div className="flex gap-2">
            {onRefresh && (
                <button 
                    onClick={onRefresh}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition border border-white/5"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            )}
            {onShowMore && (
                <button 
                    onClick={onShowMore} 
                    className="flex items-center text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition"
                >
                    Show More <ArrowRight className="w-3 h-3 ml-1" />
                </button>
            )}
        </div>
    </div>
  );

  const AlbumRow = ({ albums }: { albums: IAlbum[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {albums.map((album) => (
        <div 
            key={album.id} 
            className="group cursor-pointer space-y-3"
            onClick={() => setView('ALBUM_DETAIL', album.id)}
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-800 shadow-xl border border-white/5">
             <img 
                src={service.getCoverArtUrl(album.coverArt || album.id, 300)} 
                alt={album.name} 
                className="w-full h-full object-cover transition-opacity" 
                loading="lazy"
             />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                 <button className="p-3 bg-white rounded-full text-black shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 pointer-events-none">
                     <Play className="w-6 h-6 fill-current ml-1" />
                 </button>
             </div>
          </div>
          <div>
             <h4 className="font-semibold text-white truncate text-sm group-hover:text-primary transition">{album.name}</h4>
             <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 md:p-10 pb-32 max-w-[1600px] mx-auto">
      <HeroSection />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Picks (Top Left) */}
          <div className="lg:col-span-2 bg-neutral-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center text-white"><Flame className="w-5 h-5 mr-2 text-orange-500" /> Quick Picks</h3>
                  <button 
                    className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1"
                    onClick={async () => setRandomSongs(await service.getRandomSongs(20))}
                   >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {randomSongs.slice(5, 13).map((song, i) => (
                      <div key={song.id} className="flex flex-col p-3 hover:bg-white/5 rounded-xl group transition cursor-pointer border border-transparent hover:border-white/5 relative overflow-hidden" onClick={() => playSong(song, randomSongs)}>
                          <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden bg-neutral-800 shadow-md">
                              <img src={service.getCoverArtUrl(song.coverArt || song.id, 200)} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                                  <Play className="w-8 h-8 text-white fill-current" />
                              </div>
                          </div>
                          
                          <div className="min-w-0 w-full">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition">{song.title}</h4>
                              <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                          </div>

                          <button 
                                onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition hover:bg-primary"
                                title="Add to Playlist"
                            >
                                <ListPlus className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* Tabbed Box: Most Played / Recommended (Top Right) */}
          <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden flex flex-col h-[500px]">
               <div className="p-4 border-b border-white/5 bg-black/10 flex items-center justify-around">
                   <button 
                        onClick={() => setActiveTab('played')}
                        className={`flex-1 text-center py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'played' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-white'}`}
                   >
                       Most Played
                   </button>
                   <button 
                        onClick={() => setActiveTab('recommended')}
                        className={`flex-1 text-center py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'recommended' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-white'}`}
                   >
                       Recommended
                   </button>
               </div>
               <div className="overflow-y-auto custom-scrollbar flex-1">
                   <div className="p-2">
                       {displaySongs.length > 0 ? displaySongs.map((song, i) => (
                           <div key={`${song.id}-${i}`} className="flex items-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition" onClick={() => playSong(song, displaySongs)}>
                               <span className="w-8 text-xs font-bold text-neutral-500 mr-2 text-center">{i+1}</span>
                               <img src={service.getCoverArtUrl(song.coverArt || song.id, 40)} className="w-10 h-10 rounded mr-3 object-cover bg-neutral-800" alt="" />
                               <div className="flex-1 min-w-0">
                                   <div className="text-sm font-medium text-white truncate group-hover:text-primary transition">{song.title}</div>
                                   <div className="text-xs text-neutral-500 truncate">{song.artist}</div>
                               </div>
                               
                               {/* Play Count for Most Played Tab */}
                               {activeTab === 'played' && (
                                   <div className="hidden sm:flex items-center text-[10px] text-neutral-500 mr-3 font-mono">
                                       <BarChart2 className="w-3 h-3 mr-1" /> {song.playCount || 0}
                                   </div>
                               )}
                               
                               <button 
                                    onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                    className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                    title="Add to Playlist"
                               >
                                    <ListPlus className="w-4 h-4" />
                               </button>
                           </div>
                       )) : (
                           <div className="p-8 text-center text-neutral-500">
                               <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                               {activeTab === 'played' ? 'Start listening to build your history.' : 'No recommendations available right now.'}
                           </div>
                       )}
                   </div>
               </div>
          </div>
      </div>

      <SectionHeader 
            title="Daily Discovery" 
            icon={Compass} 
            onShowMore={() => setView('ALBUMS', { sort: 'random' })} 
            onRefresh={() => loadExplore(true)} 
            loading={loadingExplore}
      />
      <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-neutral-900/80 border border-white/5 rounded-2xl p-6 overflow-hidden">
             <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                 {exploreAlbums.map((album) => (
                     <div 
                        key={album.id} 
                        className="flex-shrink-0 w-40 snap-start cursor-pointer group/card"
                        onClick={() => setView('ALBUM_DETAIL', album.id)}
                     >
                         <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg bg-neutral-800">
                             <img src={service.getCoverArtUrl(album.coverArt || album.id, 200)} className="w-full h-full object-cover transition duration-500 group-hover/card:opacity-90" alt="" />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                             </div>
                         </div>
                         <h4 className="font-bold text-white text-xs truncate group-hover/card:text-primary transition">{album.name}</h4>
                         <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                     </div>
                 ))}
                 {exploreAlbums.length === 0 && !loadingExplore && (
                     <div className="text-neutral-500 text-sm p-4">No recommendations available today. Try playing some music first!</div>
                 )}
             </div>
          </div>
      </div>
      
      <SectionHeader title="Recently Played" icon={Clock} onShowMore={() => setView('ALBUMS', { sort: 'recent' })} />
      <AlbumRow albums={recentlyPlayedAlbums} />

      <SectionHeader title="Recently Added" icon={Plus} onShowMore={() => setView('ALBUMS', { sort: 'newest' })} />
      <AlbumRow albums={recentlyAddedAlbums} />
    </div>
  );
};
