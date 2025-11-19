import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { IPlaylist, ISong } from '../types';
import { Play, Clock, ArrowLeft, MoreVertical, Trash2, ListMusic, Shuffle, GripVertical, Save, ListPlus } from 'lucide-react';
import { Visualizer } from '../components/Visualizer';

export const PlaylistDetailView: React.FC = () => {
  const { viewData, setView, playSong, isPlaying, queue, currentSongIndex, playlists, deletePlaylist, savePlaylist, reorderPlaylist, service, openPlaylistModal } = useStore();
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isSavedPlaylist, setIsSavedPlaylist] = useState(true);

  useEffect(() => {
    if (typeof viewData === 'string') {
        // Existing playlist ID lookup
        const pl = playlists.find(p => p.id === viewData);
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
    
    // Reset scroll position
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });

  }, [viewData, playlists]);

  if (!playlist) return <div className="p-10 text-white">Playlist not found.</div>;

  const handleSave = () => {
      if (playlist) {
          savePlaylist(playlist);
          setView('PLAYLISTS');
      }
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

  const currentSong = queue[currentSongIndex];
  
  // Determine if any song in this playlist is currently playing
  const isPlaylistActive = playlist.songs?.some(s => s.id === currentSong?.id);

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
    <div className="flex flex-col min-h-full pb-24">
      {/* Header / Top Section */}
      <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-10 overflow-hidden">
        
        {/* Dynamic Background Blur */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             {playlist.coverArt && (
                <img src={service.getCoverArtUrl(playlist.coverArt, 600)} className="absolute w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/90 to-dark"></div>
        </div>

        {/* Cover Art */}
        <div className="relative z-10 group">
            <div className="w-64 h-64 bg-neutral-900 shadow-2xl rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                {playlist.coverArt ? (
                    <img src={service.getCoverArtUrl(playlist.coverArt, 600)} alt={playlist.name} className="w-full h-full object-cover" />
                ) : (
                    <ListMusic className="w-24 h-24 text-neutral-700" />
                )}
            </div>
        </div>

        {/* Info */}
        <div className="relative z-10 flex-1 text-center md:text-left">
            <button onClick={() => setView(isSavedPlaylist ? 'PLAYLISTS' : 'BROWSE')} className="mb-4 flex items-center justify-center md:justify-start text-neutral-400 hover:text-white transition text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to {isSavedPlaylist ? 'Playlists' : 'Browse'}
            </button>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">{playlist.name}</h1>
            {!isSavedPlaylist && <p className="text-neutral-400 mb-4 italic">{playlist.comment || "Generated Mix"}</p>}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                {playlist.songs && playlist.songs.length > 0 && (
                    <>
                        <button 
                            onClick={() => playlist.songs && playSong(playlist.songs[0], playlist.songs)}
                            className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-white transition shadow-lg shadow-primary/20 flex items-center"
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" /> Play
                        </button>
                        <button className="px-4 py-3 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition flex items-center">
                            <Shuffle className="w-5 h-5 mr-2" /> Shuffle
                        </button>
                    </>
                )}
                
                {isSavedPlaylist ? (
                    <button 
                        onClick={() => { if(confirm('Are you sure you want to delete this playlist?')) deletePlaylist(playlist.id); }}
                        className="px-4 py-3 bg-red-500/10 text-red-500 font-medium rounded-full hover:bg-red-500/20 transition flex items-center border border-red-500/20"
                    >
                        <Trash2 className="w-5 h-5 mr-2" /> Delete
                    </button>
                ) : (
                    <button 
                        onClick={handleSave}
                        className="px-6 py-3 bg-secondary/20 text-secondary font-bold rounded-full hover:bg-secondary hover:text-white transition flex items-center border border-secondary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    >
                        <Save className="w-5 h-5 mr-2" /> Save as Playlist
                    </button>
                )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                <span className="flex items-center"><ListMusic className="w-4 h-4 mr-2" /> {playlist.songCount} Tracks</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTotalTime(playlist.duration)}</span>
                <span>Created {new Date(playlist.created).toLocaleDateString()}</span>
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
                        <th className="p-4 font-medium">Album</th>
                        <th className="p-4 font-medium text-right">Duration</th>
                        <th className="p-4 w-24"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {playlist.songs?.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isDragging = draggedItemIndex === idx;
                        return (
                            <tr 
                                key={`${song.id}-${idx}`} 
                                draggable={isSavedPlaylist}
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={(e) => onDrop(e, idx)}
                                className={`group transition-colors hover:bg-white/5 ${isSavedPlaylist ? 'cursor-move' : ''} ${isCurrent ? 'bg-white/10' : ''} ${isDragging ? 'opacity-30 bg-primary/20' : ''}`}
                            >
                                <td className="p-4 text-center" onClick={() => playlist.songs && playSong(song, playlist.songs)}>
                                    <div className="flex items-center justify-center">
                                        {isCurrent && isPlaying ? (
                                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                        ) : (
                                            <div className="flex items-center justify-center w-6">
                                                <span className="group-hover:hidden font-mono">{idx + 1}</span>
                                                {isSavedPlaylist && <GripVertical className="w-4 h-4 hidden group-hover:block text-neutral-500 hover:text-white cursor-grab" />}
                                                {!isSavedPlaylist && <Play className="w-4 h-4 hidden group-hover:block text-neutral-500 hover:text-white" />}
                                            </div>
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
                                            {(song.genre || song.year) && (
                                                <div className="text-xs text-neutral-500 mt-0.5 flex items-center">
                                                    {song.genre}
                                                    {song.genre && song.year && <span className="mx-1">•</span>}
                                                    {song.year}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-neutral-500">
                                    <span 
                                        className="hover:text-white hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}
                                     >
                                        {song.album}
                                     </span>
                                </td>
                                <td className="p-4 text-right font-mono cursor-pointer" onClick={() => playlist.songs && playSong(song, playlist.songs)}>
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
                                    <button className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition opacity-0 group-hover:opacity-100">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {(!playlist.songs || playlist.songs.length === 0) && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-neutral-500">
                                This playlist is empty. Add songs from your library.
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