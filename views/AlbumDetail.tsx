
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { IAlbum } from '../types';
import { Play, Shuffle, Clock, Heart, ListMusic, ArrowLeft, MoreVertical, ListPlus, Info, Disc, BarChart2 } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';

export const AlbumDetailView: React.FC = () => {
  const { viewData, setView, service, playSong, isPlaying, queue, currentSongIndex, openPlaylistModal } = useStore();
  const [album, setAlbum] = useState<IAlbum | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (viewData) {
        const data = await service.getAlbum(viewData);
        setAlbum(data);
      }
    };
    load();
  }, [viewData, service]);

  const hasMultiDisc = useMemo(() => {
    return (album?.songs || []).some(s => (s.discNumber || 1) > 1);
  }, [album]);

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

  const getQualityBadge = (suffix?: string, bitrate?: number) => {
      if (!suffix) return null;
      const s = suffix.toUpperCase();
      const isLossless = s === 'FLAC' || s === 'ALAC' || s === 'WAV';
      
      return (
          <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isLossless ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-neutral-600 text-neutral-400 bg-neutral-800'}`}>
                  {s}
              </span>
              {bitrate && (
                  <span className="text-[10px] text-neutral-500 font-mono">{bitrate}kbps</span>
              )}
          </div>
      );
  };

  const currentSong = queue[currentSongIndex];
  const isAlbumPlaying = currentSong?.albumId === album.id || currentSong?.album === album.name;

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header / Top Section */}
      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-10 overflow-hidden">
        
        {/* Dynamic Background Blur */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <img src={service.getCoverArtUrl(album.coverArt || album.id, 600)} className="absolute w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
             <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/90 to-dark"></div>
        </div>

        {/* Cover Art Container */}
        <div className="relative z-10 group shrink-0">
            {/* Visualizer Background */}
            <div className="absolute -inset-4 rounded-3xl opacity-40 blur-xl bg-primary/20 transition-opacity duration-1000">
                {isPlaying && isAlbumPlaying && <Visualizer className="w-full h-full opacity-50 scale-110" />}
            </div>
            
            {/* The Cover Art */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-neutral-900">
                <img 
                    src={service.getCoverArtUrl(album.coverArt || album.id, 600)} 
                    alt={album.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 transform-gpu" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
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
            </div>
            
            <div className="mt-6 flex items-center justify-center md:justify-start gap-6 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                <span className="flex items-center"><ListMusic className="w-4 h-4 mr-2" /> {album.songCount} Tracks</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTotalTime(album.duration)}</span>
            </div>
        </div>
      </div>

      {/* Album Information Box (Notes) */}
      {album.info?.notes && (
          <div className="px-4 md:px-12 mb-8 animate-fade-in">
              <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md relative">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                      About
                      {album.info.musicBrainzId && <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-400">MB</span>}
                  </h3>
                  <div className={`text-neutral-300 leading-relaxed text-sm whitespace-pre-line transition-all duration-300 ${!showInfo ? 'line-clamp-3 max-h-24 overflow-hidden' : ''}`}>
                      {album.info.notes}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                      <button 
                        onClick={() => setShowInfo(!showInfo)}
                        className="text-xs font-bold text-primary hover:text-white transition"
                      >
                        {showInfo ? 'Read Less' : 'Read More'}
                      </button>
                      {album.info.lastFmUrl && (
                        <a href={album.info.lastFmUrl} target="_blank" rel="noreferrer" className="text-xs text-neutral-500 hover:text-white transition flex items-center">
                            Last.fm &rarr;
                        </a>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Tracklist */}
      <div className="px-4 md:px-12 flex-1">
          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-black/20 text-neutral-500 uppercase tracking-wider text-xs border-b border-white/5">
                    <tr>
                        <th className="p-4 font-medium w-12 text-center">#</th>
                        <th className="p-4 font-medium">Title</th>
                        <th className="p-4 font-medium">Artist</th>
                        <th className="p-4 font-medium hidden lg:table-cell">Quality</th>
                        <th className="p-4 font-medium hidden lg:table-cell text-right">Plays</th>
                        <th className="p-4 font-medium text-right">Duration</th>
                        <th className="p-4 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {album.songs?.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id;
                        const discNumber = song.discNumber || 1;
                        const prevDisc = idx > 0 ? (album.songs![idx-1].discNumber || 1) : 0;
                        const showDiscHeader = hasMultiDisc && discNumber !== prevDisc;

                        return (
                            <React.Fragment key={song.id}>
                                {showDiscHeader && (
                                     <tr className="bg-white/5 border-b border-white/5">
                                        <td colSpan={7} className="px-4 py-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Disc className="w-3 h-3 mr-2" /> Disc {discNumber}
                                            </div>
                                        </td>
                                     </tr>
                                )}
                                <tr 
                                    className={`group transition-colors hover:bg-white/5 ${isCurrent ? 'bg-white/10' : ''}`}
                                >
                                    <td className="p-4 text-center cursor-pointer relative" onClick={() => album.songs && playSong(song, album.songs)}>
                                        <div className="flex items-center justify-center w-8 h-8 mx-auto relative">
                                            {isCurrent && isPlaying ? (
                                                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                            ) : (
                                                <>
                                                    <span className="font-mono text-neutral-600 text-sm absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                                                        {idx + 1}
                                                    </span>
                                                    <Play className="w-4 h-4 text-white absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 cursor-pointer" onClick={() => album.songs && playSong(song, album.songs)}>
                                        <div className="flex items-center">
                                            <span className={`font-medium text-base ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-neutral-500">
                                        <span 
                                            className="cursor-pointer hover:text-white hover:underline"
                                            onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}
                                        >
                                            {song.artist}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        {getQualityBadge(song.suffix, song.bitRate)}
                                    </td>
                                    <td className="p-4 hidden lg:table-cell text-right text-neutral-500 text-xs">
                                        <div className="flex items-center justify-end gap-1" title="Play Count">
                                            <BarChart2 className="w-3 h-3" />
                                            {song.playCount || 0}
                                        </div>
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
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
