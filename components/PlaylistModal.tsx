import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Plus, X, ListMusic, Check } from 'lucide-react';

export const PlaylistModal: React.FC = () => {
  const { modalOpen, closePlaylistModal, playlists, createPlaylist, addSongToPlaylist, songToAddToPlaylist } = useStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!modalOpen || !songToAddToPlaylist) return null;

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
    }
  };

  const handleSelect = (id: string) => {
    addSongToPlaylist(id, songToAddToPlaylist);
    closePlaylistModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-800/50">
          <h3 className="text-xl font-bold text-white flex items-center">
             <ListMusic className="w-5 h-5 mr-2 text-primary" />
             Add to Playlist
          </h3>
          <button onClick={closePlaylistModal} className="text-neutral-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
            <p className="text-sm text-neutral-400 mb-4">Select a playlist to add <span className="text-white font-semibold">{songToAddToPlaylist.title}</span>:</p>
            
            {/* List Existing */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 custom-scrollbar pr-2">
                {playlists.map(pl => (
                    <button 
                        key={pl.id}
                        onClick={() => handleSelect(pl.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-primary/20 border border-transparent hover:border-primary/30 transition group text-left"
                    >
                        <div>
                            <div className="font-medium text-white">{pl.name}</div>
                            <div className="text-xs text-neutral-500">{pl.songCount} songs</div>
                        </div>
                        <Plus className="w-5 h-5 text-neutral-500 group-hover:text-primary" />
                    </button>
                ))}
                {playlists.length === 0 && <div className="text-center text-neutral-500 text-sm py-4">No playlists yet.</div>}
            </div>

            {/* Create New */}
            <div className="relative">
                <input 
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="New Playlist Name"
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:border-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button 
                    onClick={handleCreate}
                    disabled={!newPlaylistName.trim()}
                    className="absolute right-2 top-2 p-1.5 bg-primary text-black rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};