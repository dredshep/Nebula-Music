import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { IAlbum, ISong, View } from '../types';
import { Play, Music, Mic2, MoreVertical, Plus, ListPlus } from 'lucide-react';

export const LibraryView: React.FC = () => {
  const { currentView, setView, service, playSong, openPlaylistModal, playlists, createPlaylist } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [newPlName, setNewPlName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (currentView === 'ALBUMS') setItems(await service.getAlbumList('recent', 20));
      if (currentView === 'SONGS') setItems(await service.getAllSongs());
      if (currentView === 'ARTISTS') setItems(await service.getArtists());
      if (currentView === 'PLAYLISTS') setItems(playlists); // Use Store playlists
    };
    load();
  }, [currentView, service, playlists]);

  if (currentView === 'SONGS') {
      return (
          <div className="p-10 pb-32">
              <h2 className="text-3xl font-bold mb-6">All Songs</h2>
              <div className="bg-neutral-900/50 rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left text-sm text-neutral-400">
                      <thead className="bg-white/5 text-neutral-300 uppercase tracking-wider text-xs">
                          <tr>
                              <th className="p-4">#</th>
                              <th className="p-4">Title</th>
                              <th className="p-4">Artist</th>
                              <th className="p-4">Album</th>
                              <th className="p-4 text-right">Time</th>
                              <th className="p-4"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {items.map((song: ISong, idx) => (
                              <tr key={song.id} className="hover:bg-white/5 group transition-colors">
                                  <td className="p-4 w-12 text-center cursor-pointer" onClick={() => playSong(song, items as ISong[])}>
                                      <span className="group-hover:hidden">{idx + 1}</span>
                                      <Play className="w-4 h-4 hidden group-hover:block text-white" />
                                  </td>
                                  <td className="p-4 font-medium text-white cursor-pointer" onClick={() => playSong(song, items as ISong[])}>
                                    <div className="flex items-center">
                                        <img src={service.getCoverArtUrl(song.id, 40)} className="w-8 h-8 rounded mr-3 object-cover bg-neutral-800" loading="lazy" alt="" />
                                        {song.title}
                                    </div>
                                  </td>
                                  <td className="p-4 cursor-pointer hover:text-white hover:underline" onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}>{song.artist}</td>
                                  <td className="p-4 cursor-pointer hover:text-white hover:underline" onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}>{song.album}</td>
                                  <td className="p-4 text-right font-mono cursor-pointer" onClick={() => playSong(song, items as ISong[])}>{Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}</td>
                                  <td className="p-4 text-right w-24 flex items-center justify-end">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }} 
                                        className="text-neutral-500 hover:text-primary p-2 opacity-0 group-hover:opacity-100 transition"
                                        title="Add to Playlist"
                                      >
                                          <ListPlus className="w-4 h-4" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }} className="text-neutral-500 hover:text-white p-2">
                                          <MoreVertical className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div className="p-10 pb-32">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold capitalize">{currentView.toLowerCase()}</h2>
        {currentView === 'PLAYLISTS' && (
            <div className="flex items-center space-x-2">
                {isCreating ? (
                    <div className="flex items-center bg-neutral-800 rounded-lg overflow-hidden border border-white/10">
                        <input 
                            autoFocus
                            className="bg-transparent px-3 py-2 text-sm focus:outline-none text-white w-40"
                            placeholder="Playlist Name"
                            value={newPlName}
                            onChange={(e) => setNewPlName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newPlName.trim()) {
                                    createPlaylist(newPlName);
                                    setNewPlName('');
                                    setIsCreating(false);
                                } else if (e.key === 'Escape') {
                                    setIsCreating(false);
                                }
                            }}
                        />
                        <button onClick={() => setIsCreating(false)} className="px-3 text-xs text-neutral-400 hover:text-white">Esc</button>
                    </div>
                ) : (
                    <button onClick={() => setIsCreating(true)} className="flex items-center px-4 py-2 bg-primary text-black rounded-full text-sm font-bold hover:bg-white transition">
                        <Plus className="w-4 h-4 mr-1" /> New Playlist
                    </button>
                )}
            </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {items.map((item: any) => (
          <div 
            key={item.id} 
            className="group cursor-pointer bg-neutral-900 rounded-xl p-4 border border-white/5 hover:bg-white/5 transition"
            onClick={() => {
                if (currentView === 'ARTISTS') {
                    setView('ARTIST_DETAIL', item.id);
                } else if (currentView === 'ALBUMS') {
                    setView('ALBUM_DETAIL', item.id);
                } else if (currentView === 'PLAYLISTS') {
                    setView('PLAYLIST_DETAIL', item.id);
                }
            }}
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-4 relative shadow-lg bg-neutral-800">
              {item.coverArt || (currentView === 'ARTISTS' && item.id) ? (
                <img 
                    src={currentView === 'ARTISTS' ? service.getCoverArtUrl(item.coverArt || item.id) : service.getCoverArtUrl(item.coverArt || item.id)} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                    {currentView === 'ARTISTS' ? <Mic2 className="w-10 h-10 text-neutral-600" /> : <Music className="w-10 h-10 text-neutral-600" />}
                </div>
              )}
              {/* Hover Play Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   {currentView === 'ARTISTS' ? (
                       <span className="px-3 py-1 bg-white text-black rounded-full text-xs font-bold">VIEW</span>
                   ) : (
                       <span className="px-3 py-1 bg-white text-black rounded-full text-xs font-bold">OPEN</span>
                   )}
              </div>
            </div>
            <h3 className="font-bold text-white truncate">{item.name}</h3>
            {currentView !== 'ARTISTS' && currentView !== 'PLAYLISTS' && <p className="text-sm text-neutral-400 truncate">{item.artist}</p>}
            {currentView === 'ARTISTS' && <p className="text-sm text-neutral-400 truncate">{item.albumCount} Albums</p>}
            {currentView === 'PLAYLISTS' && <p className="text-sm text-neutral-400 truncate">{item.songCount} Songs</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
