import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Plus, X, ListMusic, Music } from 'lucide-react';

export const PlaylistModal: React.FC = () => {
  const { modalOpen, closePlaylistModal, playlists, createPlaylist, addSongToPlaylist, songToAddToPlaylist, service } = useStore();
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={closePlaylistModal}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-neutral-900/98 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">Add to Playlist</h2>
                <p className="text-xs text-white/50 truncate">{songToAddToPlaylist.title}</p>
              </div>
            </div>
            <button
              onClick={closePlaylistModal}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
              aria-label="Close playlist modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Create New */}
          <div className="p-4 border-b border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="New playlist name..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white 
                        placeholder:text-white/30 focus:border-white/20 focus:outline-none transition"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2.5 bg-primary text-black font-semibold rounded-lg text-sm
                        hover:bg-primary/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Create playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Playlist List */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {playlists.length === 0 ? (
              <div className="text-center text-white/60 py-12">
                <ListMusic className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p className="text-sm">No playlists yet</p>
                <p className="text-xs mt-1">Create one above</p>
              </div>
            ) : (
              <div className="p-2">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleSelect(pl.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <ListMusic className="w-5 h-5 text-white/50 group-hover:text-white transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-sm">{pl.name}</p>
                      <p className="text-xs text-white/40">{pl.songCount} {pl.songCount === 1 ? 'song' : 'songs'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:bg-primary group-hover:text-black transition">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={closePlaylistModal}
              className="w-full py-2.5 text-sm text-white/50 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
