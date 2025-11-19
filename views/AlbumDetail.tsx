import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { IAlbum } from '../types';
import { Play, Shuffle, Clock, Heart, ListMusic, ArrowLeft, MoreVertical, ListPlus } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';

export const AlbumDetailView: React.FC = () => {
  const { viewData, setView, service, playSong, isPlaying, queue, currentSongIndex, openPlaylistModal } = useStore();
  const [album, setAlbum] = useState<IAlbum | null>(null);

  useEffect(() => {
    const load = async () => {
      if (viewData) {
        const data = await service.getAlbum(viewData);
        setAlbum(data);
      }
    };
    load();
  }, [viewData, service]);

  if (!album) return <div className="p-10 text-white flex items-center"><div className="animate-spin mr-2"></div> Loading Album...</div>;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
  };

  const formatTotalTime = (s: number) => {
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      return hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
  };

  const currentSong = queue[currentSongIndex];
  const isAlbumPlaying = currentSong?.albumId === album.id || currentSong?.album === album.name;
  const shouldSpin = isPlaying && isAlbumPlaying;

  return (
    <div className="flex flex-col h-full pb-24">
      {/* Header / Top Section */}
      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-10 overflow-hidden">
        
        {/* Dynamic Background Blur */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <img src={service.getCoverArtUrl(album.coverArt || album.id, 600)} className="absolute w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
             <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/90 to-dark"></div>
        </div>

        {/* Vinyl & Visualizer Container */}
        <div className="relative z-10 group">
            {/* Visualizer Background */}
            <div className="absolute -inset-4 rounded-full opacity-60 blur-xl bg-primary/20 transition-opacity duration-1000">
                {isPlaying && <Visualizer className="w-full h-full opacity-50 scale-110" />}
            </div>
            
            {/* The Record */}
            <div 
                className={`relative w-64 h-64 md:w-72 md:h-72 rounded-full shadow-2xl flex items-center justify-center transition-all duration-1000 ${shouldSpin ? 'animate-spin-slow' : 'animate-wobble'}`}
                style={{
                    background: 'repeating-radial-gradient(#111 0, #111 2px, #222 3px, #111 4px)',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.8)'
                }}
            >
                {/* Vinyl Grooves Shine */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.1)_45deg,transparent_90deg)] opacity-40 pointer-events-none z-10"></div>
                
                {/* Album Art Label */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-900 relative z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <img src={service.getCoverArtUrl(album.coverArt || album.id, 300)} alt={album.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Center Hole */}
                <div className="absolute w-4 h-4 bg-black rounded-full z-30 border border-neutral-800 shadow-inner"></div>
            </div>
        </div>

        {/* Info */}
        <div className="relative z-10 flex-1 text-center md:text-left">
            <button onClick={() => setView('ALBUMS')} className="mb-4 flex items-center justify-center md:justify-start text-neutral-400 hover:text-white transition text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Albums
            </button>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">{album.name}</h1>
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 text-neutral-300 mb-6">
                <span 
                    className="text-xl text-primary cursor-pointer hover:underline font-bold"
                    onClick={() => album.artistId && setView('ARTIST_DETAIL', album.artistId)}
                >
                    {album.artist}
                </span>
                <span className="hidden md:block w-1 h-1 bg-neutral-500 rounded-full"></span>
                <span>{album.year}</span>
                <span className="hidden md:block w-1 h-1 bg-neutral-500 rounded-full"></span>
                <span className="uppercase text-xs border border-neutral-600 px-2 py-0.5 rounded text-neutral-400">{album.genre || 'Music'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button 
                    onClick={() => album.songs && playSong(album.songs[0], album.songs)}
                    className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-white transition shadow-lg shadow-primary/20 flex items-center"
                >
                    <Play className="w-5 h-5 mr-2 fill-current" /> Play Album
                </button>
                <button className="px-4 py-3 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition flex items-center">
                    <Shuffle className="w-5 h-5 mr-2" /> Shuffle
                </button>
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-red-500 transition">
                    <Heart className="w-5 h-5" />
                </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center md:justify-start gap-6 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                <span className="flex items-center"><ListMusic className="w-4 h-4 mr-2" /> {album.songCount} Tracks</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTotalTime(album.duration)}</span>
            </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-4 md:px-12">
          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-black/20 text-neutral-500 uppercase tracking-wider text-xs border-b border-white/5">
                    <tr>
                        <th className="p-4 font-medium w-12 text-center">#</th>
                        <th className="p-4 font-medium">Title</th>
                        <th className="p-4 font-medium">Artist</th>
                        <th className="p-4 font-medium text-right">Duration</th>
                        <th className="p-4 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {album.songs?.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id;
                        return (
                            <tr 
                                key={song.id} 
                                className={`group transition-colors hover:bg-white/5 ${isCurrent ? 'bg-white/10' : ''}`}
                            >
                                <td className="p-4 text-center cursor-pointer" onClick={() => album.songs && playSong(song, album.songs)}>
                                    {isCurrent && isPlaying ? (
                                        <div className="w-3 h-3 mx-auto bg-primary rounded-full animate-pulse"></div>
                                    ) : (
                                        <>
                                            <span className="group-hover:hidden font-mono">{idx + 1}</span>
                                            <Play className="w-4 h-4 hidden group-hover:block text-white mx-auto" />
                                        </>
                                    )}
                                </td>
                                <td className="p-4 cursor-pointer" onClick={() => album.songs && playSong(song, album.songs)}>
                                    <div className={`font-medium text-base ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</div>
                                </td>
                                <td className="p-4 text-neutral-500">
                                    <span 
                                        className="cursor-pointer hover:text-white hover:underline"
                                        onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}
                                    >
                                        {song.artist}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono cursor-pointer" onClick={() => album.songs && playSong(song, album.songs)}>
                                    {formatTime(song.duration)}
                                </td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                        className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-primary transition opacity-0 group-hover:opacity-100 mr-1"
                                        title="Add to Playlist"
                                    >
                                        <ListPlus className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                        className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
