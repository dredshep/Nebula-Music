import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { ISong, IAlbum } from '../types';
import { Play, Plus, Clock, Flame, Compass, Music, ListPlus } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { service, playSong, setView, openPlaylistModal, getMostPlayedSongs } = useStore();
  const [randomSongs, setRandomSongs] = useState<ISong[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<IAlbum[]>([]);
  const [newestAlbums, setNewestAlbums] = useState<IAlbum[]>([]);
  const [randomAlbums, setRandomAlbums] = useState<IAlbum[]>([]);
  
  // Get most played directly from store (real tracking)
  const mostPlayedReal = getMostPlayedSongs().slice(0, 10);
  // If empty, we'll fetch random ones to act as "Suggested"
  const [suggestedMostPlayed, setSuggestedMostPlayed] = useState<ISong[]>([]);

  useEffect(() => {
    const load = async () => {
      setRandomSongs(await service.getRandomSongs(20)); // Fetch more to rotate and show picks
      setRecentAlbums(await service.getAlbumList('recent', 5));
      setNewestAlbums(await service.getAlbumList('newest', 5));
      setRandomAlbums(await service.getAlbumList('random', 10));
      
      if (mostPlayedReal.length === 0) {
          setSuggestedMostPlayed(await service.getRandomSongs(5));
      }
    };
    load();
  }, [service, mostPlayedReal.length]); // Reload if real data changes length from 0 to something

  const displayMostPlayed = mostPlayedReal.length > 0 ? mostPlayedReal : suggestedMostPlayed;
  const mostPlayedTitle = mostPlayedReal.length > 0 ? "Most Played" : "Suggested For You";

  const HeroSection = () => {
    // Use first 5 songs for Hero rotation
    const heroSongs = randomSongs.slice(0, 5);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (heroSongs.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % heroSongs.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [heroSongs.length]);

    if (heroSongs.length === 0) return null;

    const featured = heroSongs[currentIndex];
    const artUrl = service.getCoverArtUrl(featured.coverArt || featured.id, 800);

    return (
      <div className="relative w-full h-[350px] rounded-2xl overflow-hidden mb-12 group shadow-2xl shadow-black/50">
        <div key={featured.id} className="absolute inset-0 transition-opacity duration-1000 animate-fade-in">
             <img src={artUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] scale-100 group-hover:scale-105" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent">
               <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full">
                  <div className="flex items-start justify-between">
                     <div>
                         <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded mb-4 inline-block backdrop-blur-md border border-primary/20 animate-pulse">Featured Pick</span>
                         <h2 
                             className="text-4xl md:text-6xl font-bold text-white mb-3 cursor-pointer hover:text-primary transition"
                             onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                         >
                             {featured.title}
                         </h2>
                         <p 
                             className="text-xl text-neutral-300 mb-6 cursor-pointer hover:text-white"
                             onClick={() => { if(featured.artistId) setView('ARTIST_DETAIL', featured.artistId); }}
                         >
                             {featured.artist}
                         </p>
                         <div className="flex gap-4">
                             <button 
                                 onClick={() => playSong(featured, heroSongs)}
                                 className="flex items-center px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-primary hover:text-white transition shadow-lg shadow-black/50 hover:scale-105 transform duration-200"
                             >
                                 <Play className="w-5 h-5 mr-2 fill-current" />
                                 Listen Now
                             </button>
                             <button 
                                 onClick={() => { if(featured.albumId) setView('ALBUM_DETAIL', featured.albumId); }}
                                 className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition backdrop-blur-md"
                             >
                                 View Album
                             </button>
                         </div>
                     </div>
                  </div>
               </div>
             </div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 right-8 flex space-x-2 z-10">
            {heroSongs.map((_, idx) => (
                <button 
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                />
            ))}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center mb-6 mt-12">
        <div className="p-2 bg-white/5 rounded-lg mr-3 shadow-inner border border-white/5"><Icon className="w-5 h-5 text-primary" /></div>
        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
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
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:opacity-80" 
                loading="lazy"
             />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                 <button className="p-3 bg-white rounded-full text-black shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
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
          {/* Quick Picks */}
          <div className="lg:col-span-2 bg-neutral-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center text-white"><Flame className="w-5 h-5 mr-2 text-orange-500" /> Quick Picks</h3>
                  <button 
                    className="text-xs font-medium text-neutral-400 hover:text-white"
                    onClick={async () => setRandomSongs(await service.getRandomSongs(20))}
                   >
                    Refresh
                  </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Use songs 5-9 for Quick Picks so they don't overlap with Hero */}
                  {randomSongs.slice(5, 9).map((song, i) => (
                      <div key={song.id} className="flex items-center p-3 hover:bg-white/5 rounded-xl group transition cursor-pointer border border-transparent hover:border-white/5" onClick={() => playSong(song, randomSongs)}>
                          <img src={service.getCoverArtUrl(song.coverArt || song.id, 100)} className="w-12 h-12 rounded-lg bg-neutral-800 object-cover mr-4 shadow-md" alt="" />
                          <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition">{song.title}</h4>
                              <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                className="p-2 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white mr-1"
                                title="Add to Playlist"
                            >
                                <ListPlus className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-full bg-white text-black transform scale-90 hover:scale-100 transition">
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                            </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Most Played */}
          <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
               <h3 className="text-lg font-bold flex items-center text-white mb-4"><Music className="w-5 h-5 mr-2 text-primary" /> {mostPlayedTitle}</h3>
               <div className="space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
                   {displayMostPlayed.map((song, i) => (
                       <div key={song.id} className="flex items-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition" onClick={() => playSong(song, displayMostPlayed)}>
                           <span className="w-6 text-xs font-bold text-neutral-500 mr-2 text-center">{i+1}</span>
                           <div className="flex-1 min-w-0">
                               <div className="text-sm font-medium text-white truncate group-hover:text-primary transition">{song.title}</div>
                               <div className="text-xs text-neutral-500 truncate">{song.artist}</div>
                           </div>
                           <button 
                                onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                title="Add to Playlist"
                           >
                                <ListPlus className="w-4 h-4" />
                           </button>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      {/* Explore Bar (Random Albums) */}
      <SectionHeader title="Explore" icon={Compass} />
      <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-neutral-900/80 border border-white/5 rounded-2xl p-6 overflow-hidden">
             <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                 {randomAlbums.map((album) => (
                     <div 
                        key={album.id} 
                        className="flex-shrink-0 w-40 snap-start cursor-pointer group/card"
                        onClick={() => setView('ALBUM_DETAIL', album.id)}
                     >
                         <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg">
                             <img src={service.getCoverArtUrl(album.coverArt || album.id, 200)} className="w-full h-full object-cover transition duration-500 group-hover/card:scale-110" alt="" />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                         </div>
                         <h4 className="font-bold text-white text-xs truncate">{album.name}</h4>
                         <p className="text--[10px] text-neutral-400 truncate">{album.artist}</p>
                     </div>
                 ))}
             </div>
          </div>
      </div>

      <SectionHeader title="Recently Played" icon={Clock} />
      <AlbumRow albums={recentAlbums} />

      <SectionHeader title="Fresh Arrivals" icon={Plus} />
      <AlbumRow albums={newestAlbums} />
    </div>
  );
};