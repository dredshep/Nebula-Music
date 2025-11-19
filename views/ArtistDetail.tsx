

import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { IArtist, IAlbum, ISong } from '../types';
import { Play, Disc, ArrowLeft, Clock, Music, MoreVertical, ListPlus } from 'lucide-react';

export const ArtistDetailView: React.FC = () => {
  const { viewData, setView, service, playSong, openPlaylistModal } = useStore();
  const [artist, setArtist] = useState<IArtist | null>(null);
  const [albums, setAlbums] = useState<IAlbum[]>([]);
  const [topSongs, setTopSongs] = useState<ISong[]>([]);
  const [info, setInfo] = useState<{ bio?: string, image?: string }>({});

  useEffect(() => {
    const load = async () => {
      if (!viewData) return;
      
      const { artist: artistData, albums: albumsData } = await service.getArtist(viewData);
      setArtist(artistData);
      setAlbums(albumsData);

      if (artistData.name) {
        const songs = await service.getTopSongs(artistData.name, 10);
        setTopSongs(songs);
      }

      // Pass artist name to help with broader bio search if ID lookup fails
      const extraInfo = await service.getArtistInfo(viewData, artistData.name);
      setInfo(extraInfo);
    };
    load();
  }, [viewData, service]);

  if (!artist) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="pb-32 relative">
       {/* Hero Header */}
       <div className="relative w-full h-[40vh] min-h-[300px]">
           {/* Background Image with Gradient */}
           <div className="absolute inset-0 bg-neutral-900">
               {info.image ? (
                   <img src={info.image} className="w-full h-full object-cover opacity-60" alt={artist.name} />
               ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/40" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
           </div>

           <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col items-start">
               <button onClick={() => setView('ARTISTS')} className="mb-6 flex items-center text-neutral-400 hover:text-white transition">
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
               </button>
               <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">{artist.name}</h1>
               <div className="flex items-center space-x-4">
                   <button 
                        onClick={() => topSongs.length > 0 && playSong(topSongs[0], topSongs)}
                        className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-white transition shadow-lg shadow-primary/30 flex items-center"
                    >
                       <Play className="w-5 h-5 mr-2 fill-current" /> Play Top Songs
                   </button>
                   <span className="text-neutral-300 font-medium">{artist.albumCount} Albums</span>
               </div>
           </div>
       </div>

       <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
           
           {/* Left Column: Top Songs */}
           <div className="lg:col-span-2 space-y-8">
               
               {topSongs.length > 0 && (
                   <section>
                       <h2 className="text-2xl font-bold mb-6 flex items-center"><Music className="w-6 h-6 mr-2 text-primary" /> Top Tracks</h2>
                       <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                           {topSongs.map((song, i) => (
                               <div 
                                   key={song.id} 
                                   className="flex items-center p-4 hover:bg-white/5 transition group border-b border-white/5 last:border-0"
                                >
                                   <div className="flex items-center flex-1 cursor-pointer" onClick={() => playSong(song, topSongs)}>
                                       <span className="w-8 text-center text-neutral-500 font-mono text-sm group-hover:hidden">{i + 1}</span>
                                       <Play className="w-8 text-center hidden group-hover:block text-primary w-4 h-4 pointer-events-none" />
                                       
                                       <img src={service.getCoverArtUrl(song.id, 100)} className="w-12 h-12 rounded object-cover mx-4 bg-neutral-800" loading="lazy" alt="" />
                                       
                                       <div className="flex-1 min-w-0">
                                           <h4 className="text-white font-medium truncate">{song.title}</h4>
                                           <div 
                                            className="text-sm text-neutral-500 truncate hover:text-white hover:underline cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}
                                           >
                                                {song.album}
                                           </div>
                                       </div>

                                       <span className="text-sm text-neutral-500 font-mono flex items-center ml-4">
                                           <Clock className="w-3 h-3 mr-1" />
                                           {Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}
                                       </span>
                                   </div>
                                   
                                   <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                        className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-primary ml-2 opacity-0 group-hover:opacity-100 transition"
                                        title="Add to Playlist"
                                   >
                                        <ListPlus className="w-4 h-4" />
                                   </button>

                                   <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                        className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white ml-2"
                                   >
                                        <MoreVertical className="w-4 h-4" />
                                   </button>
                               </div>
                           ))}
                       </div>
                   </section>
               )}

               {/* Albums Grid */}
               <section>
                   <h2 className="text-2xl font-bold mb-6 flex items-center"><Disc className="w-6 h-6 mr-2 text-secondary" /> Albums</h2>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                       {albums.map(album => (
                           <div key={album.id} className="group cursor-pointer bg-neutral-900 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition" onClick={() => setView('ALBUM_DETAIL', album.id)}>
                               <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg">
                                   <img src={service.getCoverArtUrl(album.coverArt || album.id)} className="w-full h-full object-cover transition-opacity" loading="lazy" alt={album.name} />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                       <Play className="w-8 h-8 text-white fill-white" />
                                   </div>
                               </div>
                               <h4 className="font-bold text-white text-sm truncate">{album.name}</h4>
                               <p className="text-xs text-neutral-500">{album.year || 'Unknown Year'}</p>
                           </div>
                       ))}
                   </div>
               </section>
           </div>

           {/* Right Column: Bio */}
           <div className="space-y-8">
               {info.bio && (
                   <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6">
                       <h3 className="text-xl font-bold mb-4 text-white">About</h3>
                       <div className="text-sm text-neutral-400 leading-relaxed max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                           {info.bio.split('\n').filter(line => line.trim() !== '').map((line, i) => (
                               <p key={i}>{line.trim()}</p>
                           ))}
                       </div>
                   </div>
               )}
           </div>

       </div>
    </div>
  );
};
