
import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../context/Store';
import { ISong, IAlbum } from '../types';
import { Play, Plus, Clock, Flame, Compass, Music, ListPlus, ArrowRight, RefreshCw, Disc, ListMusic, BarChart2, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const HeroSection: React.FC<{ songs: ISong[] }> = ({ songs }) => {
    const { service, playSong, setView } = useStore();
    const heroSongs = songs.slice(0, 5);
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
        className="relative w-full min-h-[550px] lg:min-h-[450px] lg:h-[450px] rounded-3xl overflow-hidden mb-12 group shadow-2xl shadow-black/50 border border-white/5 transition-all flex flex-col justify-center bg-neutral-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
         {/* Background Slideshow */}
         <AnimatePresence mode="popLayout">
             <motion.div 
                key={featured.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-0"
             >
                <img 
                    src={bgUrl} 
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60" 
                    alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent/30" />
             </motion.div>
         </AnimatePresence>

         <div className="relative z-10 w-full flex flex-col lg:flex-row items-center p-6 md:p-12 lg:p-16 gap-8 lg:gap-16">
             {/* Album Art Container */}
             <div className="shrink-0 mt-8 lg:mt-0 relative w-48 h-48 md:w-64 md:h-64 lg:w-64 lg:h-64">
                 <AnimatePresence mode="wait">
                     <motion.div
                        key={featured.id + '-img'}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0"
                     >
                         <div className="w-full h-full rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-neutral-900 relative group/art cursor-pointer h-full" onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}>
                             <img 
                                src={artUrl} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-105 transform-gpu" 
                                alt={featured.album} 
                             />
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                         </div>
                     </motion.div>
                 </AnimatePresence>
             </div>

             {/* Text Content */}
             <div className="flex-1 w-full min-w-0 mb-12 lg:mb-0 relative min-h-[250px] lg:min-h-auto flex items-center">
                 <AnimatePresence mode="wait">
                     <motion.div
                        key={featured.id + '-text'}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        className="w-full text-center lg:text-left flex flex-col justify-center items-center lg:items-start absolute lg:static"
                     >
                         <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-white mb-6">
                             <Flame className="w-3 h-3 mr-2 text-orange-500" /> Featured Track
                         </div>
                         
                         <h1 
                            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 leading-tight drop-shadow-lg cursor-pointer hover:text-primary transition line-clamp-2 py-2 pr-4"
                            onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                         >
                             {featured.title}
                         </h1>
                         
                         <div className="flex flex-col lg:flex-row items-center gap-2 md:gap-4 text-lg md:text-xl text-neutral-200 mb-8 font-medium drop-shadow-md">
                             <span 
                                className="hover:text-white cursor-pointer hover:underline"
                                onClick={() => { if(featured.artistId) setView('ARTIST_DETAIL', featured.artistId); }}
                             >
                                 {featured.artist}
                             </span>
                             <span className="hidden lg:inline text-neutral-500">•</span>
                             <span className="text-neutral-400">{featured.album}</span>
                         </div>

                         <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                             <button 
                                 onClick={() => playSong(featured, heroSongs)}
                                 className="flex items-center px-8 py-3.5 bg-white text-black rounded-full font-bold hover:bg-primary hover:text-white transition shadow-lg hover:scale-105 active:scale-95 duration-200"
                             >
                                 <Play className="w-5 h-5 mr-2 fill-current" /> Listen Now
                             </button>
                             <button 
                                 onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                                 className="flex items-center px-8 py-3.5 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition backdrop-blur-md border border-white/10"
                             >
                                 <Disc className="w-5 h-5 mr-2" /> View Album
                             </button>
                         </div>
                     </motion.div>
                 </AnimatePresence>
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

const AlbumRow = ({ albums }: { albums: IAlbum[] }) => {
    const { service, setView } = useStore();
    
    // We map breakpoints to ensure exactly one row of content is shown.
    // Extra items are hidden via CSS classes to prevent wrapping.
    // 2 (mobile) -> 3 (sm) -> 4 (md) -> 5 (lg) -> 6 (xl) -> 8 (2xl)
    
    return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
      {albums.map((album, i) => (
        <div 
            key={album.id} 
            className={`group cursor-pointer space-y-3 ${
                i >= 8 ? 'hidden' : 
                i >= 6 ? 'hidden 2xl:block' : 
                i >= 5 ? 'hidden xl:block' : 
                i >= 4 ? 'hidden lg:block' : 
                i >= 3 ? 'hidden md:block' : 
                i >= 2 ? 'hidden sm:block' : 
                'block'
            }`}
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
};

export const HomeView: React.FC = () => {
  const { service, playSong, setView, openPlaylistModal, getMostPlayedSongs, homeData, refreshHomeData, refreshQuickPicks, refreshDiscovery } = useStore();
  
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [loadingQuickPicks, setLoadingQuickPicks] = useState(false);
  
  // Tabbed Box State
  const [activeTab, setActiveTab] = useState<'played' | 'recommended'>('played');
  const mostPlayedTracks = getMostPlayedSongs().slice(0, 50);

  useEffect(() => {
    const init = async () => {
        setLoadingExplore(true);
        await refreshHomeData();
        setLoadingExplore(false);
    };
    init();

    // Poll for updates every hour (3600000 ms) handled by store logic mostly but trigger doesn't hurt
    const interval = setInterval(() => {
        refreshHomeData();
    }, 3600000);

    return () => clearInterval(interval);
  }, [refreshHomeData]);

  const displaySongs = activeTab === 'played' ? mostPlayedTracks : homeData.recommendedTracks;
  const { randomSongs, exploreAlbums, recentAlbums, newestAlbums } = homeData;

  return (
    <div className="p-6 md:p-10 pb-32 w-full mx-auto">
      <HeroSection songs={randomSongs} />
      
      {/* Responsive Grid Container: 55vh min 480 max 650 for adaptability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:h-[55vh] lg:min-h-[480px] lg:max-h-[650px]">
          {/* Quick Picks (Top Left) */}
          <div className="lg:col-span-2 bg-neutral-900/50 rounded-2xl p-5 border border-white/5 backdrop-blur-sm h-full flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-lg font-bold flex items-center text-white"><Flame className="w-5 h-5 mr-2 text-orange-500" /> Quick Picks</h3>
                  <button 
                    className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full transition-colors"
                    onClick={async () => {
                        setLoadingQuickPicks(true);
                        await refreshQuickPicks();
                        setLoadingQuickPicks(false);
                    }}
                   >
                    <RefreshCw className={`text-[10px] w-3 h-3 ${loadingQuickPicks ? 'animate-spin' : ''}`} /> Refresh
                  </button>
              </div>
              
              {/* Strict Grid Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-2 md:gap-4 h-full w-full min-h-0 pb-1">
                  {randomSongs.slice(0, 8).map((song, i) => (
                      <div 
                        key={`${song.id}-${i}`} /* Key fix: Ensures uniqueness even if song object is reused */
                        className="group relative flex flex-col items-center justify-center w-full h-full cursor-pointer min-h-0"
                        onClick={() => playSong(song, randomSongs)}
                      >
                           {/* Album Art: Adjusted percentage heights (60-70%) to ensure text fits comfortably below */}
                           <div className="relative h-[60%] md:h-[65%] xl:h-[70%] w-auto aspect-square max-w-full rounded-lg overflow-hidden bg-neutral-800 shadow-md border border-white/5 shrink-0">
                                <img 
                                    src={service.getCoverArtUrl(song.coverArt || song.id, 300)} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    alt={song.album} 
                                />
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl">
                                        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                                    </div>
                                </div>

                                {/* Playlist Button - Positioned Strict */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-primary z-20 backdrop-blur-md hover:scale-110"
                                    title="Add to Playlist"
                                >
                                    <ListPlus className="w-3.5 h-3.5" />
                                </button>
                           </div>
                           
                           {/* Text Info - Flex 1 allows it to take remaining space, line-clamp ensures fit */}
                           <div className="flex-1 flex flex-col items-center justify-center text-center w-full px-1 min-h-0 mt-2">
                                <h4 className="font-bold text-white w-full text-xs md:text-sm group-hover:text-primary transition leading-tight line-clamp-1">{song.title}</h4>
                                <p className="text-[10px] md:text-xs text-neutral-400 w-full leading-tight mt-1 line-clamp-1">{song.artist}</p>
                           </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Tabbed Box: Most Played / Recommended (Top Right) */}
          <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden flex flex-col h-full">
               <div className="p-4 border-b border-white/5 bg-black/10 flex items-center justify-around shrink-0">
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
            onRefresh={async () => {
                setLoadingExplore(true);
                await refreshDiscovery();
                setLoadingExplore(false);
            }} 
            loading={loadingExplore}
      />
      
      {/* Daily Discovery: Updated to single-row adaptive grid with named group to isolate hover */}
      <div className="relative group/discovery">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl blur-xl opacity-50 group-hover/discovery:opacity-75 transition duration-1000"></div>
          <div className="relative bg-neutral-900/80 border border-white/5 rounded-2xl p-6 overflow-hidden">
             {loadingExplore && exploreAlbums.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12">
                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                 </div>
             ) : (
                 <AlbumRow albums={exploreAlbums} />
             )}
             {exploreAlbums.length === 0 && !loadingExplore && (
                 <div className="text-neutral-500 text-sm p-4 text-center">No recommendations available today. Try playing some music first!</div>
             )}
          </div>
      </div>
      
      <SectionHeader title="Recently Played" icon={Clock} onShowMore={() => setView('ALBUMS', { sort: 'recent' })} />
      <AlbumRow albums={recentAlbums} />

      <SectionHeader title="Recently Added" icon={Plus} onShowMore={() => setView('ALBUMS', { sort: 'newest' })} />
      <AlbumRow albums={newestAlbums} />
    </div>
  );
};
