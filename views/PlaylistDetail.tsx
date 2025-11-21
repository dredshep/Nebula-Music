


import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { IPlaylist, ISong } from '../types';
import { Play, Clock, ArrowLeft, Trash2, ListMusic, Shuffle, GripVertical, Save, ListPlus, Info, BarChart2, Heart } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';

export const PlaylistDetailView: React.FC = () => {
  const { viewData, setView, playSong, isPlaying, queue, currentSongIndex, playlists, deletePlaylist, savePlaylist, reorderPlaylist, service, openPlaylistModal, isDemoMode, toggleLike } = useStore();
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isSavedPlaylist, setIsSavedPlaylist] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const load = async () => {
        if (typeof viewData === 'string') {
            // Existing playlist ID lookup
            let pl = playlists.find(p => p.id === viewData);
            
            // If playlist found in store but has no songs, or not found, fetch full details from service.
            if (!pl || (pl && (!pl.songs || pl.songs.length === 0) && !isDemoMode)) {
                const fullPl = await service.getPlaylist(viewData);
                if (fullPl) {
                    setPlaylist(fullPl);
                    setIsSavedPlaylist(true);
                    return;
                }
            }

            if (pl) {
                setPlaylist(pl);
                setIsSavedPlaylist(true);
            }
        } else if (typeof viewData === 'object' && viewData !== null) {
            // Direct playlist object (e.g. generated mix)
            setPlaylist(viewData);
            // Check if it already exists in store to determine if it's "Saved"
            const exists = playlists.some(p => p.id === viewData.id);
            setIsSavedPlaylist(exists);
        }
    };
    
    load();
    
    // Reset scroll position
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });

  }, [viewData, playlists, service, isDemoMode]);

  if (!playlist) return <div className="p-10 text-white">Loading Playlist...</div>;

  const handleSave = () => {
      if (playlist) {
          savePlaylist(playlist);
          setView('PLAYLISTS');
      }
  };

  const handleSongLike = (song: ISong) => {
      toggleLike(song);
      setPlaylist(prev => prev ? {
          ...prev,
          songs: prev.songs?.map(s => s.id === song.id ? { ...s, starred: !s.starred } : s)
      } : null);
  };

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
  const comment = playlist.comment || (!isSavedPlaylist ? (playlist as any).desc : null);
  
  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
      // Only allow drag if it's a saved playlist (since reorder only works on stored playlists)
      if (!isSavedPlaylist) return;
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
      if (!isSavedPlaylist) return;
      e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, index: number) => {
      if (!isSavedPlaylist) return;
      e.preventDefault();
      if (draggedItemIndex === null) return;
      if (draggedItemIndex !== index) {
          reorderPlaylist(playlist.id, draggedItemIndex, index);
      }
      setDraggedItemIndex(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-10 relative">
      {/* Header / Top Section */}
      <div className="relative px-8 pb-8 pt-4 md:px-12 md:pb-12 md:pt-8 flex flex-col md:flex-row items-center md:items-end gap-10 overflow-hidden shrink-0">
        
        {/* Dynamic Background Blur */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             {playlist.coverArt && (
                <img src={service.getCoverArtUrl(playlist.coverArt, 600)} className="absolute w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/90 to-dark"></div>
        </div>

        {/* Cover Art - INCREASED SIZE */}
        <div className="relative z-10 group">
            <div className="w-72 h-72 md:w-[400px] md:h-[400px] bg-neutral-900 shadow-2xl rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                {playlist.coverArt ? (
                    <img src={service.getCoverArtUrl(playlist.coverArt, 600)} alt={playlist.name} className="w-full h-full object-cover" />
                ) : (
                    <ListMusic className="w-32 h-32 text-neutral-700" />
                )}
            </div>
        </div>

        {/* Info */}
        <div className="relative z-10 flex-1 text-center md:text-left">
            <button onClick={() => setView(isSavedPlaylist ? 'PLAYLISTS' : 'BROWSE')} className="mb-4 flex items-center justify-center md:justify-start text-neutral-400 hover:text-white transition text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to {isSavedPlaylist ? 'Playlists' : 'Browse'}
            </button>
            {/* Increased Font Size */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-none">{playlist.name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 mb-8">
                {playlist.songs && playlist.songs.length > 0 && (
                    <>
                        <button 
                            onClick={() => playlist.songs && playSong(playlist.songs[0], playlist.songs)}
                            className="px-10 py-4 bg-primary text-black text-lg font-bold rounded-full hover:bg-white transition shadow-xl shadow-primary/20 flex items-center transform hover:scale-105"
                        >
                            <Play className="w-6 h-6 mr-2 fill-current" /> Play
                        </button>
                        <button className="px-6 py-4 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition flex items-center border border-white/10">
                            <Shuffle className="w-6 h-6 mr-2" /> Shuffle
                        </button>
                    </>
                )}
                
                {isSavedPlaylist ? (
                    <button 
                        onClick={() => { if(confirm('Are you sure you want to delete this playlist?')) deletePlaylist(playlist.id); }}
                        className="px-6 py-4 bg-red-500/10 text-red-500 font-medium rounded-full hover:bg-red-500/20 transition flex items-center border border-red-500/20"
                    >
                        <Trash2 className="w-6 h-6 mr-2" /> Delete
                    </button>
                ) : (
                    <button 
                        onClick={handleSave}
                        className="px-8 py-4 bg-secondary/20 text-secondary font-bold rounded-full hover:bg-secondary hover:text-white transition flex items-center border border-secondary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    >
                        <Save className="w-6 h-6 mr-2" /> Save as Playlist
                    </button>
                )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-8 text-sm font-mono text-neutral-500 uppercase tracking-widest">
                <span className="flex items-center"><ListMusic className="w-4 h-4 mr-2" /> {playlist.songCount} Tracks</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTotalTime(playlist.duration)}</span>
                <span>Created {new Date(playlist.created).toLocaleDateString()}</span>
            </div>
        </div>
      </div>

      {/* Playlist Info Box / Description */}
      {comment && (
          <div className="px-4 md:px-12 mb-8 animate-fade-in shrink-0">
              <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md relative">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-primary" /> About this Playlist
                  </h3>
                  <div className={`text-neutral-300 leading-relaxed text-sm whitespace-pre-line transition-all duration-300 ${!showInfo ? 'line-clamp-2' : ''}`}>
                      {comment}
                  </div>
                  {comment.length > 150 && (
                      <button 
                        onClick={() => setShowInfo(!showInfo)}
                        className="text-xs font-bold text-primary hover:text-white transition mt-2"
                      >
                        {showInfo ? 'Read Less' : 'Read More'}
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* Tracklist */}
      <div className="px-4 md:px-12">
          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-black/20 text-neutral-500 uppercase tracking-wider text-xs border-b border-white/5">
                    <tr>
                        <th className="p-4 font-medium w-12 text-center">#</th>
                        <th className="p-4 font-medium">Title</th>
                        <th className="p-4 font-medium hidden md:table-cell">Album</th>
                        <th className="p-4 font-medium hidden lg:table-cell">Quality</th>
                        <th className="p-4 font-medium hidden lg:table-cell text-right">Plays</th>
                        <th className="p-4 font-medium text-right">Time</th>
                        <th className="p-4 w-24"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {playlist.songs?.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isDragging = draggedItemIndex === idx;

                        return (
                            <React.Fragment key={`${song.id}-${idx}`}>
                                <tr 
                                    draggable={isSavedPlaylist}
                                    onDragStart={(e) => onDragStart(e, idx)}
                                    onDragOver={(e) => onDragOver(e, idx)}
                                    onDrop={(e) => onDrop(e, idx)}
                                    className={`group transition-colors hover:bg-white/5 ${isSavedPlaylist ? 'cursor-move' : ''} ${isCurrent ? 'bg-white/10' : ''} ${isDragging ? 'opacity-30 bg-primary/20' : ''}`}
                                >
                                    <td className="p-4 text-center relative" onClick={() => playlist.songs && playSong(song, playlist.songs)}>
                                        <div className="flex items-center justify-center w-8 h-8 mx-auto relative">
                                            {isCurrent && isPlaying ? (
                                                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                                                        {isSavedPlaylist && <GripVertical className="w-4 h-4 text-neutral-600" />}
                                                        {!isSavedPlaylist && <span className="font-mono text-neutral-600 text-sm">{idx + 1}</span>}
                                                    </div>
                                                    <Play className="w-4 h-4 text-primary absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 cursor-pointer" onClick={() => playlist.songs && playSong(song, playlist.songs)}>
                                        <div className="flex items-center">
                                            <img src={service.getCoverArtUrl(song.id, 50)} className="w-8 h-8 rounded mr-3 object-cover bg-neutral-800" loading="lazy" alt="" />
                                            <div>
                                                <div className={`font-medium text-base ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</div>
                                                <div 
                                                    className="text-sm text-neutral-400 hover:text-white hover:underline cursor-pointer mt-0.5"
                                                    onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}
                                                >
                                                    {song.artist}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-neutral-500 hidden md:table-cell">
                                        <span 
                                            className="hover:text-white hover:underline cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}
                                        >
                                            {song.album}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        {getQualityBadge(song.suffix, song.bitRate)}
                                    </td>
                                    <td className="p-4 text-right hidden lg:table-cell text-neutral-500 text-xs">
                                        <div className="flex items-center justify-end gap-1" title="Play Count">
                                            <BarChart2 className="w-3 h-3" />
                                            {song.playCount || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono cursor-pointer" onClick={() => playlist.songs && playSong(song, playlist.songs)}>
                                        {formatTime(song.duration)}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleSongLike(song); }}
                                            className={`p-2 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100 ${song.starred ? 'text-red-500 opacity-100' : 'text-neutral-500 hover:text-white'}`}
                                            title={song.starred ? "Unlike" : "Like"}
                                        >
                                            <Heart className={`w-4 h-4 ${song.starred ? 'fill-current' : ''}`} />
                                        </button>
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
                    {(!playlist.songs || playlist.songs.length === 0) && (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-neutral-500">
                                {isDemoMode ? 'This playlist is empty.' : 'Loading songs or this playlist is empty.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};