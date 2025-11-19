
import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useStore } from '../context/Store';
import { IAlbum, ISong, IArtist, View } from '../types';
import { Play, Music, Mic2, MoreVertical, Plus, ListPlus, Search, Disc, ChevronLeft, ChevronRight, ArrowUp, Filter, X, Calendar, Tag, ArrowDownUp, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 60; 

const YearPicker: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({ top: '100%', left: 0, marginTop: '0.5rem' });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value && !isNaN(parseInt(value))) {
            setViewYear(parseInt(value));
        }
    }, [value]);

    useLayoutEffect(() => {
        if (isOpen && pickerRef.current) {
            const rect = pickerRef.current.getBoundingClientRect();
            const dropdownWidth = 224; // w-56 (14rem)
            const dropdownHeight = 220; // Approx height
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let style: React.CSSProperties = {};

            // Horizontal Positioning: Flip to right alignment if close to right edge
            if (rect.left + dropdownWidth > viewportWidth - 16) {
                style.right = 0;
                style.left = 'auto';
            } else {
                style.left = 0;
                style.right = 'auto';
            }

            // Vertical Positioning: Flip to top if close to bottom edge
            if (rect.bottom + dropdownHeight > viewportHeight - 16) {
                style.bottom = '100%';
                style.top = 'auto';
                style.marginBottom = '0.5rem';
                style.marginTop = 0;
            } else {
                style.top = '100%';
                style.bottom = 'auto';
                style.marginTop = '0.5rem';
                style.marginBottom = 0;
            }

            setDropdownStyle(style);
        }
    }, [isOpen]);

    const currentYear = new Date().getFullYear();
    // Display 12 years per grid (3x4)
    const startYear = Math.floor(viewYear / 12) * 12;
    const years = Array.from({length: 12}, (_, i) => startYear + i);

    const handlePrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setViewYear(y => y - 12); };
    const handleNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setViewYear(y => y + 12); };

    return (
        <div className="relative w-[120px]" ref={pickerRef}>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            <input 
                ref={inputRef}
                type="text" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                placeholder="Year"
                className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-9 pr-8 text-sm focus:border-primary focus:outline-none text-neutral-300"
            />
            <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white z-10"
                onClick={() => {
                    if (!isOpen) inputRef.current?.focus();
                    setIsOpen(!isOpen);
                }}
            >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div 
                    className="absolute w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                    style={dropdownStyle}
                >
                    <div className="flex items-center justify-between p-2 bg-white/5 border-b border-white/5">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-xs font-bold text-neutral-300">{startYear} - {startYear + 11}</span>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-2">
                        {years.map(y => (
                            <button
                                key={y}
                                onClick={() => { onChange(y.toString()); setIsOpen(false); }}
                                disabled={y > currentYear + 5}
                                className={`py-2.5 rounded-lg text-xs font-medium transition-colors ${y === parseInt(value) ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:bg-white/10 hover:text-white'} ${y > currentYear + 5 ? 'opacity-20 cursor-not-allowed' : ''}`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const LibraryView: React.FC = () => {
  const { currentView, setView, viewData, service, playSong, openPlaylistModal, playlists, createPlaylist } = useStore();
  
  const [items, setItems] = useState<any[]>([]);
  const [newPlName, setNewPlName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filter, setFilter] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [sortType, setSortType] = useState<string>('alphabeticalByName');

  // Pagination State
  const [page, setPage] = useState(0);
  const [allItemsCached, setAllItemsCached] = useState<any[] | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset state on view change, but check viewData for sort override
  useEffect(() => {
    setPage(0);
    setFilter('');
    setSelectedGenre('');
    setSelectedYear('');
    setItems([]);
    setAllItemsCached(null);
    
    // Handle Sort from viewData if navigating from "Show More"
    if (currentView === 'ALBUMS') {
         if (viewData && typeof viewData === 'object' && viewData.sort) {
             setSortType(viewData.sort);
         } else if (!viewData) {
             setSortType('alphabeticalByName');
         }
    } else {
         setSortType('alphabeticalByName');
    }
  }, [currentView, viewData]);

  // Fetch Genres on mount
  useEffect(() => {
      const fetchGenres = async () => {
          const g = await service.getGenres();
          setGenres(g);
      };
      fetchGenres();
  }, [service]);

  // Data Fetching
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      
      // 1. PLAYLISTS
      if (currentView === 'PLAYLISTS') {
        setItems(playlists);
      } 
      // 2. ARTISTS (Client-side filtering mostly)
      else if (currentView === 'ARTISTS') {
        let all = allItemsCached;
        if (!all) {
            all = await service.getArtists();
            setAllItemsCached(all);
        }
        // Pagination handled in render logic for Artists
      }
      // 3. ALBUMS (Server-side)
      else if (currentView === 'ALBUMS') {
        if (filter) {
            // Text Search
            const res = await service.searchAlbums(filter, ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
            setItems(res);
        } else if (selectedGenre) {
            // Genre Filter
            const res = await service.getAlbumList('byGenre', ITEMS_PER_PAGE, page * ITEMS_PER_PAGE, { genre: selectedGenre });
            setItems(res);
        } else if (selectedYear) {
            // Year Filter
            const res = await service.getAlbumList('byYear', ITEMS_PER_PAGE, page * ITEMS_PER_PAGE, { fromYear: selectedYear, toYear: selectedYear });
            setItems(res);
        } else {
            // Default (Sorted)
            const res = await service.getAlbumList(sortType, ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
            setItems(res);
            setAllItemsCached(null);
        }
      }
      // 4. SONGS (Server-side)
      else if (currentView === 'SONGS') {
          // Build a combined query for songs if filters are active
          let queryParts = [];
          if (filter) queryParts.push(filter);
          if (selectedGenre) queryParts.push(selectedGenre);
          if (selectedYear) queryParts.push(selectedYear);
          
          const query = queryParts.join(' ');
          
          // searchSongs handles pagination and fuzzy search
          const res = await service.searchSongs(query, ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
          setItems(res);
          setAllItemsCached(null);
      }
      
      setIsLoading(false);
      // Scroll to top on page change
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    };
    load();
  }, [currentView, service, playlists, page, filter, selectedGenre, selectedYear, sortType]); 

  // Derived Items for Display
  const displayItems = useMemo(() => {
      if (currentView === 'PLAYLISTS') {
          if (!filter) return items;
          return items.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
      }

      if (currentView === 'ARTISTS' && allItemsCached) {
          let filtered = allItemsCached;
          if (filter) {
              filtered = allItemsCached.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()));
              return filtered;
          }
          return filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
      }

      return items;
  }, [items, filter, currentView, allItemsCached, page, playlists]);

  // Handlers
  const handleNextPage = () => {
      setPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
      if (page > 0) {
          setPage(p => p - 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const resetFilters = () => {
      setFilter('');
      setSelectedGenre('');
      setSelectedYear('');
      setSortType('alphabeticalByName');
      setPage(0);
  };

  const PaginationControls = () => (
      <div className="flex justify-center items-center space-x-4 my-6">
          <button 
            onClick={handlePrevPage} 
            disabled={page === 0}
            className="flex items-center px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition border border-white/5"
          >
              <ChevronLeft className="w-4 h-4 mr-2" /> Prev
          </button>
          
          <div className="px-4 font-mono text-sm text-neutral-400">
              Page <span className="text-white font-bold">{page + 1}</span>
          </div>

          <button 
            onClick={handleNextPage} 
            disabled={displayItems.length < ITEMS_PER_PAGE}
            className="flex items-center px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition border border-white/5"
          >
              Next <ChevronRight className="w-4 h-4 ml-2" />
          </button>
      </div>
  );

  const FilterBar = () => (
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Text Search */}
            <div className="relative flex-1 min-w-[200px] group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                    placeholder={`Search ${currentView.toLowerCase()}...`}
                    className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-10 pr-8 text-sm focus:border-primary focus:outline-none transition-colors"
                />
                {filter && (
                    <button onClick={() => setFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Sorting for Albums */}
            {currentView === 'ALBUMS' && !filter && !selectedGenre && !selectedYear && (
                <div className="relative min-w-[140px]">
                    <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                    <select
                        value={sortType}
                        onChange={(e) => { setSortType(e.target.value); setPage(0); }}
                        className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-9 pr-8 text-sm appearance-none focus:border-primary focus:outline-none text-neutral-300 cursor-pointer hover:bg-white/5 transition"
                    >
                        <option value="alphabeticalByName">A-Z</option>
                        <option value="recent">Recently Added</option>
                        <option value="frequent">Most Played</option>
                        <option value="random">Random</option>
                        <option value="byYear">By Year</option>
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 rotate-90 pointer-events-none" />
                </div>
            )}
            
            {/* Advanced Filters for Albums/Songs */}
            {(currentView === 'ALBUMS' || currentView === 'SONGS') && (
                <>
                    {/* Genre Select */}
                    <div className="relative min-w-[140px]">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                        <select 
                            value={selectedGenre}
                            onChange={(e) => { setSelectedGenre(e.target.value); setPage(0); }}
                            className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-9 pr-8 text-sm appearance-none focus:border-primary focus:outline-none text-neutral-300 cursor-pointer hover:bg-white/5 transition"
                        >
                            <option value="">All Genres</option>
                            {genres.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 rotate-90 pointer-events-none" />
                    </div>

                    {/* Year Picker */}
                    <YearPicker 
                        value={selectedYear} 
                        onChange={(val) => { setSelectedYear(val); setPage(0); }} 
                    />

                    {(selectedGenre || selectedYear) && (
                        <button 
                            onClick={resetFilters}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                            title="Clear Filters"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}
      </div>
  );

  const ViewHeader = () => (
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold capitalize flex items-center">
            {currentView === 'ARTISTS' && <Mic2 className="w-8 h-8 mr-3 text-primary" />}
            {currentView === 'ALBUMS' && <Disc className="w-8 h-8 mr-3 text-primary" />}
            {currentView === 'SONGS' && <Music className="w-8 h-8 mr-3 text-primary" />}
            {currentView === 'PLAYLISTS' && <ListPlus className="w-8 h-8 mr-3 text-primary" />}
            {currentView.toLowerCase()}
        </h2>
        
        <div className="flex flex-wrap items-center w-full lg:w-auto gap-3">
            <FilterBar />

            {currentView === 'PLAYLISTS' && (
                <div className="flex items-center ml-auto lg:ml-0">
                    {isCreating ? (
                        <div className="flex items-center bg-neutral-800 rounded-full overflow-hidden border border-white/10 animate-fade-in">
                            <input 
                                autoFocus
                                className="bg-transparent px-4 py-2 text-sm focus:outline-none text-white w-32 md:w-40"
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
                            <button onClick={() => setIsCreating(false)} className="px-3 text-xs text-neutral-400 hover:text-white border-l border-white/10 h-full">✕</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsCreating(true)} className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-primary text-black rounded-full text-sm font-bold hover:bg-white transition shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">New</span>
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
  );

  if (isLoading && !displayItems.length) {
      return (
          <div className="p-10 pb-32">
              <ViewHeader />
              <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading library...</p>
              </div>
          </div>
      );
  }

  const showPagination = !filter && currentView !== 'PLAYLISTS' && (displayItems.length > 0 || page > 0);
  const showPaginationAlways = currentView !== 'PLAYLISTS' && currentView !== 'ARTISTS' && (displayItems.length > 0 || page > 0);
  const showPaginationArtists = currentView === 'ARTISTS' && !filter && (displayItems.length > 0 || page > 0);
  const shouldShowPagination = showPaginationAlways || showPaginationArtists;

  return (
    <div className="p-6 md:p-10 pb-32 min-h-screen flex flex-col" ref={scrollRef}>
      <ViewHeader />

      {/* Top Pagination */}
      {shouldShowPagination && <PaginationControls />}

      {/* CONTENT GRID/LIST */}
      {currentView === 'SONGS' ? (
          <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-white/5 text-neutral-300 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">Title</th>
                            <th className="p-4 hidden md:table-cell">Artist</th>
                            <th className="p-4 hidden lg:table-cell">Album</th>
                            <th className="p-4 text-right">Time</th>
                            <th className="p-4 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayItems.map((song: ISong, idx) => (
                            <tr key={song.id} className="hover:bg-white/5 group transition-colors">
                                <td className="p-4 text-center cursor-pointer relative" onClick={() => playSong(song, displayItems as ISong[])}>
                                    <div className="flex items-center justify-center w-8 h-8 mx-auto relative">
                                        <span className="font-mono text-neutral-600 text-sm absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
                                            {(page * ITEMS_PER_PAGE) + idx + 1}
                                        </span>
                                        <Play className="w-4 h-4 text-primary absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-white cursor-pointer" onClick={() => playSong(song, displayItems as ISong[])}>
                                    <div className="flex items-center">
                                        <img src={service.getCoverArtUrl(song.id, 40)} className="w-10 h-10 rounded-md mr-3 object-cover bg-neutral-800 shadow-sm" loading="lazy" alt="" />
                                        <div className="min-w-0">
                                            <div className="truncate">{song.title}</div>
                                            <div className="md:hidden text-xs text-neutral-500 truncate">{song.artist}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 hidden md:table-cell cursor-pointer hover:text-white hover:underline" onClick={(e) => { e.stopPropagation(); if(song.artistId) setView('ARTIST_DETAIL', song.artistId); }}>{song.artist}</td>
                                <td className="p-4 hidden lg:table-cell cursor-pointer hover:text-white hover:underline" onClick={(e) => { e.stopPropagation(); if(song.albumId) setView('ALBUM_DETAIL', song.albumId); }}>{song.album}</td>
                                <td className="p-4 text-right font-mono cursor-pointer" onClick={() => playSong(song, displayItems as ISong[])}>{Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }} 
                                        className="text-neutral-500 hover:text-primary p-2 opacity-0 group-hover:opacity-100 transition hover:bg-white/10 rounded-full"
                                        title="Add to Playlist"
                                    >
                                        <ListPlus className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(song); }} className="text-neutral-500 hover:text-white p-2 hover:bg-white/10 rounded-full ml-1">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {displayItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-neutral-500">
                                    No songs match current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 flex-1 content-start">
            {displayItems.map((item: any) => (
              <div 
                key={item.id} 
                className="group cursor-pointer bg-neutral-900/50 rounded-2xl p-4 border border-white/5 hover:bg-white/10 hover:border-white/10 transition duration-300"
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
                <div className={`aspect-square overflow-hidden mb-4 relative shadow-lg bg-neutral-800 ${currentView === 'ARTISTS' ? 'rounded-full' : 'rounded-xl'}`}>
                  {item.coverArt || (currentView === 'ARTISTS' && item.id) ? (
                    <img 
                        src={currentView === 'ARTISTS' ? service.getCoverArtUrl(item.coverArt || item.id, 300) : service.getCoverArtUrl(item.coverArt || item.id, 300)} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-opacity" 
                        loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        {currentView === 'ARTISTS' ? <Mic2 className="w-12 h-12 text-neutral-700" /> : <Music className="w-12 h-12 text-neutral-700" />}
                    </div>
                  )}
                  
                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                       {currentView === 'ARTISTS' ? (
                           <span className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-wider transform scale-90 group-hover:scale-100 transition-transform">View</span>
                       ) : (
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                               <Play className="w-5 h-5 text-black fill-current ml-1" />
                           </div>
                       )}
                  </div>
                </div>
                
                <div className={currentView === 'ARTISTS' ? 'text-center' : ''}>
                    <h3 className="font-bold text-white truncate leading-tight mb-1">{item.name}</h3>
                    {currentView !== 'ARTISTS' && currentView !== 'PLAYLISTS' && <p className="text-xs text-neutral-400 truncate hover:text-white transition">{item.artist}</p>}
                    {currentView === 'ARTISTS' && <p className="text-xs text-neutral-500 truncate">{item.albumCount} Albums</p>}
                    {currentView === 'PLAYLISTS' && <p className="text-xs text-neutral-500 truncate">{item.songCount} Songs</p>}
                </div>
              </div>
            ))}
          </div>
      )}
      
      {displayItems.length === 0 && !isLoading && (
          <div className="text-center py-20 text-neutral-500">
              <p className="text-lg">No items found.</p>
              <button onClick={resetFilters} className="mt-4 text-primary hover:underline text-sm">Clear filters</button>
          </div>
      )}

      {/* Bottom Pagination */}
      {shouldShowPagination && <PaginationControls />}
    </div>
  );
};
