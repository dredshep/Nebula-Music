import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../context/Store';
import { Search, X, Disc, Mic2, Music, Play, ArrowRight } from 'lucide-react';
import { ISong, IAlbum, IArtist } from '../types';

export const SearchModal: React.FC = () => {
    const { isSearchModalOpen, closeSearchModal, service, setView, playSong, openSearchModal, performSearch } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{artists: IArtist[], albums: IAlbum[], songs: ISong[]}>({ artists: [], albums: [], songs: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle Cmd/Ctrl + K to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isSearchModalOpen) {
                    closeSearchModal();
                } else {
                    openSearchModal();
                }
            }
            if (e.key === 'Escape' && isSearchModalOpen) {
                closeSearchModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchModalOpen, closeSearchModal, openSearchModal]);

    // Auto focus input when opened
    useEffect(() => {
        if (isSearchModalOpen) {
            // Small delay to ensure render
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isSearchModalOpen]);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const res = await service.search(query);
                    setResults(res);
                } catch(e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults({ artists: [], albums: [], songs: [] });
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, service]);

    const handleClose = () => {
        setQuery('');
        setResults({ artists: [], albums: [], songs: [] });
        closeSearchModal();
    };

    if (!isSearchModalOpen) return null;

    const hasResults = results.artists.length > 0 || results.albums.length > 0 || results.songs.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
                {/* Input Area */}
                <div className="flex items-center p-4 border-b border-white/10 bg-neutral-900/50 backdrop-blur">
                    <Search className="w-6 h-6 text-neutral-400 ml-2" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search artists, albums, songs..." 
                        className="flex-1 bg-transparent border-none outline-none text-xl text-white px-4 py-2 placeholder-neutral-600"
                    />
                    {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-4"></div>}
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results Area */}
                <div className="overflow-y-auto p-2 custom-scrollbar">
                    {!hasResults && query.length > 1 && !loading && (
                        <div className="p-8 text-center text-neutral-500">
                            No results found for "{query}"
                        </div>
                    )}
                    
                    {!hasResults && query.length <= 1 && (
                        <div className="p-12 text-center text-neutral-600">
                            <p className="text-sm">Start typing to search your library...</p>
                        </div>
                    )}

                    {/* Artists */}
                    {results.artists.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-4 py-2 mb-2">Artists</h4>
                            {results.artists.slice(0, 4).map(artist => (
                                <div 
                                    key={artist.id}
                                    onClick={() => { setView('ARTIST_DETAIL', artist.id); handleClose(); }}
                                    className="flex items-center px-4 py-3 hover:bg-primary/10 hover:border-l-4 hover:border-primary border-l-4 border-transparent transition cursor-pointer group rounded-r-lg"
                                >
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden mr-4">
                                         {artist.coverArt ? <img src={service.getCoverArtUrl(artist.coverArt, 100)} className="w-full h-full object-cover" alt="" /> : <Mic2 className="w-5 h-5 text-neutral-500" />}
                                    </div>
                                    <span className="font-medium text-white flex-1">{artist.name}</span>
                                    <ArrowRight className="w-4 h-4 text-neutral-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Albums */}
                    {results.albums.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-4 py-2 mb-2">Albums</h4>
                            {results.albums.slice(0, 4).map(album => (
                                <div 
                                    key={album.id}
                                    onClick={() => { setView('ALBUM_DETAIL', album.id); handleClose(); }}
                                    className="flex items-center px-4 py-3 hover:bg-primary/10 hover:border-l-4 hover:border-primary border-l-4 border-transparent transition cursor-pointer group rounded-r-lg"
                                >
                                    <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden mr-4">
                                         <img src={service.getCoverArtUrl(album.coverArt || album.id, 100)} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{album.name}</div>
                                        <div className="text-xs text-neutral-400">{album.artist}</div>
                                    </div>
                                    <Disc className="w-4 h-4 text-neutral-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Songs */}
                    {results.songs.length > 0 && (
                        <div className="mb-2">
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-4 py-2 mb-2">Songs</h4>
                            {results.songs.slice(0, 8).map(song => (
                                <div 
                                    key={song.id}
                                    onClick={() => { playSong(song, results.songs); handleClose(); }}
                                    className="flex items-center px-4 py-2 hover:bg-primary/10 hover:border-l-4 hover:border-primary border-l-4 border-transparent transition cursor-pointer group rounded-r-lg"
                                >
                                    <div className="w-8 h-8 rounded bg-neutral-800 overflow-hidden mr-4 relative">
                                         <img src={service.getCoverArtUrl(song.id, 100)} className="w-full h-full object-cover" alt="" />
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100">
                                             <Play className="w-3 h-3 text-white fill-current" />
                                         </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate text-sm">{song.title}</div>
                                        <div className="text-xs text-neutral-400 truncate">{song.artist} • {song.album}</div>
                                    </div>
                                    <span className="text-xs text-neutral-500 font-mono ml-4">
                                        {Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer actions */}
                {hasResults && (
                    <div className="p-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
                         <button 
                            onClick={() => {
                                performSearch(query);
                                handleClose();
                            }}
                            className="text-xs font-bold text-primary hover:text-white transition flex items-center px-2 py-1"
                        >
                           View all results <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                        
                        <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                           ESC to close
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};