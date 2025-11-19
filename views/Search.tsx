import React from 'react';
import { useStore } from '../context/Store';
import { Mic2, Disc, Music, Play, MoreVertical, ListPlus } from 'lucide-react';

export const SearchView: React.FC = () => {
  const { searchResults, isSearching, lastSearchQuery, playSong, setView, service, openPlaylistModal } = useStore();

  if (isSearching) {
      return (
          <div className="p-10 flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg text-neutral-400">Searching...</span>
          </div>
      );
  }

  const hasResults = searchResults.artists.length > 0 || searchResults.albums.length > 0 || searchResults.songs.length > 0;

  if (!hasResults && lastSearchQuery) {
      return (
          <div className="p-10 text-center text-neutral-400 mt-20">
              <h2 className="text-2xl font-bold text-white mb-2">No results found</h2>
              <p>We couldn't find anything matching "{lastSearchQuery}"</p>
          </div>
      );
  }

  if (!lastSearchQuery) {
      return (
        <div className="p-10 text-center text-neutral-400 mt-20">
            <h2 className="text-2xl font-bold text-white mb-2">Search your library</h2>
            <p>Find artists, albums, and songs.</p>
        </div>
      );
  }

  return (
    <div className="p-8 md:p-10 pb-32 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 border-b border-white/10 pb-4">
            Search Results for <span className="text-primary">"{lastSearchQuery}"</span>
        </h2>

        {/* Artists */}
        {searchResults.artists.length > 0 && (
            <section className="mb-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Mic2 className="w-5 h-5 mr-2 text-neutral-400" /> Artists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {searchResults.artists.map(artist => (
                        <div 
                            key={artist.id} 
                            className="group cursor-pointer bg-neutral-900/50 rounded-xl p-4 border border-white/5 hover:bg-white/5 transition"
                            onClick={() => setView('ARTIST_DETAIL', artist.id)}
                        >
                            <div className="aspect-square rounded-full overflow-hidden mb-4 relative shadow-lg bg-neutral-800">
                                {artist.coverArt ? (
                                    <img src={service.getCoverArtUrl(artist.coverArt, 200)} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-600"><Mic2 className="w-12 h-12" /></div>
                                )}
                            </div>
                            <h4 className="font-bold text-white text-center truncate">{artist.name}</h4>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Albums */}
        {searchResults.albums.length > 0 && (
            <section className="mb-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Disc className="w-5 h-5 mr-2 text-neutral-400" /> Albums</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {searchResults.albums.map(album => (
                        <div 
                            key={album.id} 
                            className="group cursor-pointer bg-neutral-900/50 rounded-xl p-4 border border-white/5 hover:bg-white/5 transition"
                            onClick={() => setView('ALBUM_DETAIL', album.id)}
                        >
                            <div className="aspect-square rounded-lg overflow-hidden mb-4 relative shadow-lg bg-neutral-800">
                                <img src={service.getCoverArtUrl(album.coverArt || album.id, 200)} alt={album.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                            </div>
                            <h4 className="font-bold text-white truncate text-sm">{album.name}</h4>
                            <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Songs */}
        {searchResults.songs.length > 0 && (
            <section>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Music className="w-5 h-5 mr-2 text-neutral-400" /> Songs</h3>
                <div className="bg-neutral-900/50 rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <tbody className="divide-y divide-white/5">
                            {searchResults.songs.map((song, idx) => (
                                <tr key={song.id} className="hover:bg-white/5 group transition-colors">
                                    <td className="p-4 w-12 text-center cursor-pointer" onClick={() => playSong(song, searchResults.songs)}>
                                        <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="p-4 font-medium text-white cursor-pointer" onClick={() => playSong(song, searchResults.songs)}>
                                        <div className="flex items-center">
                                            <img src={service.getCoverArtUrl(song.id, 40)} className="w-8 h-8 rounded mr-3 object-cover bg-neutral-800" alt="" />
                                            {song.title}
                                        </div>
                                    </td>
                                    <td className="p-4 cursor-pointer hover:text-white hover:underline" onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}>
                                        {song.artist}
                                    </td>
                                    <td className="p-4 cursor-pointer hover:text-white hover:underline hidden md:table-cell" onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}>
                                        {song.album}
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        {Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}
                                    </td>
                                    <td className="p-4 text-right w-24 flex items-center justify-end">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }}
                                            className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-primary opacity-0 group-hover:opacity-100 transition mr-1"
                                        >
                                            <ListPlus className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        )}
    </div>
  );
};