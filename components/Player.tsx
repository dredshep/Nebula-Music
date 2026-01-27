
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, ChevronDown, Shuffle, Maximize2, Heart, ListPlus, Eye, EyeOff, Disc, Repeat, Repeat1, Activity, Mic2 } from 'lucide-react';
import { useStore } from '../context/Store';
import { Visualizer } from './Visualizer';
import { ISong, VisualizerMode } from '../types';

interface SyncedLine {
    time: number;
    text: string;
}

export const Player: React.FC = () => {
  const { 
    queue, currentSongIndex, isPlaying, togglePlay, nextSong, prevSong, 
    volume, setVolume, playbackRate, setPlaybackRate, 
    pitchCorrection, setPitchCorrection, playSong,
    service, setView, audioRef,
    visualizerMode, setVisualizerMode,
    repeatMode, toggleRepeat, toggleLike, openPlaylistModal,
    isZenMode, setZenMode
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'playing' | 'queue' | 'lyrics'>('playing');
  const [lyrics, setLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLine[]>([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const currentSong = queue[currentSongIndex];

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const updateTime = () => {
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
      };
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateTime);
      return () => {
          audio.removeEventListener('timeupdate', updateTime);
          audio.removeEventListener('loadedmetadata', updateTime);
      };
  }, [audioRef]);

  const parseLyrics = useCallback((lrc: string) => {
      if (!lrc) return [];
      const lines = lrc.split('\n');
      const result: SyncedLine[] = [];
      const timeRegex = /\[(\d+):(\d{2})(?:\.(\d{2,3}))?\]/g;
      for (const line of lines) {
          timeRegex.lastIndex = 0;
          const matches = [...line.matchAll(timeRegex)];
          if (matches.length > 0) {
              const text = line.replace(timeRegex, '').trim();
              if (!text) continue;
              matches.forEach(match => {
                  const minutes = parseInt(match[1]);
                  const seconds = parseInt(match[2]);
                  const msStr = match[3];
                  let ms = 0;
                  if (msStr) ms = parseInt(msStr.padEnd(3, '0'));
                  const time = minutes * 60 + seconds + ms / 1000;
                  result.push({ time, text });
              });
          }
      }
      return result.sort((a, b) => a.time - b.time);
  }, []);

  useEffect(() => {
    setSyncedLyrics([]); setLyrics('');
    const fetchLyrics = async () => {
        if (activeTab === 'lyrics' && currentSong) {
            setLoadingLyrics(true);
            const text = await service.getLyrics(currentSong.artist, currentSong.title, currentSong.album, currentSong.duration);
            const parsed = parseLyrics(text);
            if (parsed.length > 0) { setSyncedLyrics(parsed); setLyrics(''); } 
            else { setSyncedLyrics([]); setLyrics(text || "No lyrics found."); }
            setLoadingLyrics(false);
        }
    };
    fetchLyrics();
  }, [activeTab, currentSong, service, parseLyrics]);

  const activeLineIndex = syncedLyrics.findIndex((line, index) => {
      const nextLine = syncedLyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  useEffect(() => {
      if (activeLineRef.current && activeTab === 'lyrics') {
          activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [activeLineIndex, activeTab]);

  const cycleVisualizerMode = useCallback(() => {
    const modes: VisualizerMode[] = ['BARS', 'WAVE', 'CIRCLE', 'MIRROR', 'SPECTRUM', 'PARTICLES', 'HEXAGON'];
    const nextIndex = (modes.indexOf(visualizerMode) + 1) % modes.length;
    setVisualizerMode(modes[nextIndex]);
  }, [visualizerMode, setVisualizerMode]);

  const renderQualityBadge = (suffix?: string, bitrate?: number, small = false) => {
      if (!suffix) return null;
      const s = suffix.toUpperCase();
      // Expanded support for lossless and high-quality browser supported formats
      const isLossless = s === 'FLAC' || s === 'ALAC' || s === 'WAV' || s === 'AIFF' || s === 'AIF';
      const isHighQuality = isLossless || s === 'AAC' || s === 'M4A' || s === 'MP4' || (bitrate && bitrate >= 256);
      
      return (
          <div className={`flex items-center gap-1.5 ${small ? 'opacity-70' : ''}`}>
              <span className={`px-1 py-0.5 rounded text-[9px] font-bold border ${isLossless ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : (isHighQuality ? 'border-primary/50 text-primary bg-primary/10' : 'border-neutral-600 text-neutral-400 bg-neutral-800')}`}>
                  {s}
              </span>
              {bitrate && (
                  <span className={`text-[9px] font-mono ${small ? 'text-neutral-500' : 'text-neutral-400'}`}>{bitrate}k</span>
              )}
          </div>
      );
  };

  if (!currentSong) return null;
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const formatTime = (s: number) => {
    const min = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };
  const coverArt = service.getCoverArtUrl(currentSong.id, 600);
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
     const newTime = (parseFloat(e.target.value) / 100) * duration;
     const audio = document.querySelector('audio');
     if(audio) audio.currentTime = newTime;
     setCurrentTime(newTime);
  };
  const toggleVinylMode = () => setPitchCorrection(!pitchCorrection); 
  const isVinyl = !pitchCorrection;

  return (
    <>
      <div className={`fixed inset-0 z-[60] flex flex-col bg-neutral-950 transition-transform duration-500 ease-in-out ${isExpanded || isZenMode ? 'translate-y-0' : 'translate-y-full'}`}>
        {!isZenMode && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                 <img src={coverArt} className="absolute w-full h-full object-cover blur-3xl opacity-40 scale-110" alt="bg" />
                 <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob"></div>
                 <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-secondary rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
            </div>
        )}
        {isZenMode && ( <div className="absolute inset-0 z-0"> <Visualizer className="w-full h-full opacity-60" /> </div> )}
        {!isZenMode && (
            <div className="relative z-10 flex-none flex items-center justify-between p-4 md:p-8">
                <button onClick={() => setIsExpanded(false)} className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white"> <ChevronDown className="w-8 h-8" /> </button>
                <div className="flex items-center bg-white/5 rounded-full p-1 backdrop-blur-md border border-white/5">
                    <button onClick={() => setActiveTab('playing')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'playing' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>Playing</button>
                    <button onClick={() => setActiveTab('lyrics')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'lyrics' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>Lyrics</button>
                    <button onClick={() => setActiveTab('queue')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'queue' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>Queue</button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={cycleVisualizerMode} className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white group relative"> <Activity className="w-6 h-6" /> <span className="absolute right-0 top-full mt-2 w-32 text-center text-[10px] bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-50"> {visualizerMode} (V) </span> </button>
                    <button onClick={() => setZenMode(true)} className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white group relative"> <Eye className="w-6 h-6" /> <span className="absolute right-0 top-full mt-2 w-24 text-center text-[10px] bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">Zen Mode (Z)</span> </button>
                </div>
            </div>
        )}
        {isZenMode && (
            <>
                <div className="absolute top-6 right-6 z-50 flex items-center gap-4 transition-opacity duration-500 hover:opacity-100 opacity-40">
                    <button onClick={cycleVisualizerMode} className="p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition group relative" title="Change Visualizer (V)"> <Activity className="w-6 h-6" /> </button>
                    <button onClick={() => setZenMode(false)} className="p-3 rounded-full bg-black/40 hover:bg-red-500/20 hover:text-red-500 text-white backdrop-blur-md border border-white/10 transition" title="Exit Zen Mode (Z or ESC)"> <EyeOff className="w-6 h-6" /> </button>
                </div>
                <div className="absolute inset-0 z-40 flex flex-col justify-end pb-12 items-center group">
                     <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                     <div className="relative z-50 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-8 group-hover:translate-y-0 w-full">
                          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl text-center px-8">{currentSong.title}</h2>
                          <p className="text-xl md:text-2xl text-neutral-300 mb-8 drop-shadow-lg">{currentSong.artist}</p>
                          <div className="flex items-center gap-8 md:gap-12 p-4">
                              <button onClick={toggleRepeat} className={`transition hover:scale-110 drop-shadow-md ${repeatMode === 'OFF' ? 'text-neutral-400 hover:text-white' : 'text-primary'}`}> {repeatMode === 'ONE' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />} </button>
                              <button onClick={prevSong} className="text-white hover:text-primary transition hover:scale-110 drop-shadow-md"> <SkipBack className="w-10 h-10 fill-current" /> </button>
                              <button onClick={togglePlay} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary hover:text-white transition shadow-2xl shadow-white/20"> {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />} </button>
                              <button onClick={nextSong} className="text-white hover:text-primary transition hover:scale-110 drop-shadow-md"> <SkipForward className="w-10 h-10 fill-current" /> </button>
                              <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className={`transition hover:scale-110 drop-shadow-md ${currentSong.starred ? 'text-red-500' : 'text-neutral-400 hover:text-white'}`}> <Heart className={`w-6 h-6 ${currentSong.starred ? 'fill-current' : ''}`} /> </button>
                          </div>
                          <div className="w-full max-w-4xl mt-12 px-8 flex items-center gap-6 group/scrub">
                                <span className="text-xs font-mono font-medium text-white/50 w-12 text-right">{formatTime(currentTime)}</span>
                                <div className="relative flex-1 h-6 flex items-center cursor-pointer">
                                     <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-white/20 w-full rounded-full transition-all duration-300 group-hover/scrub:bg-white/30 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative" style={{ width: `${progress}%` }} />
                                     </div>
                                     <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] transform scale-0 group-hover/scrub:scale-100 transition-transform duration-200 pointer-events-none" style={{ left: `calc(${progress}% - 8px)` }}></div>
                                     <input type="range" min="0" max="100" step="0.01" value={progress} onChange={handleScrub} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                                <span className="text-xs font-mono font-medium text-white/50 w-12">{formatTime(duration)}</span>
                          </div>
                     </div>
                </div>
            </>
        )}
        <div className={`relative z-10 flex-1 flex flex-col items-center px-4 md:px-8 w-full max-w-7xl mx-auto min-h-0 ${isZenMode ? 'hidden' : ''}`}>
            {activeTab === 'queue' && (
                <div className="w-full max-w-3xl flex-1 min-h-0 mb-8 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <h3 className="text-xl font-bold text-white mb-4 sticky top-0 bg-neutral-900/90 backdrop-blur p-3 -mx-2 rounded-lg z-20 shadow-lg border-b border-white/5">Up Next</h3>
                        <div className="space-y-2 pb-4">
                            {queue.map((song, idx) => (
                                <div key={`${song.id}-${idx}`} onClick={() => playSong(song, queue)} className={`flex items-center p-3 rounded-xl transition cursor-pointer group ${idx === currentSongIndex ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}>
                                    <div className="w-8 text-center text-sm font-mono mr-4"> {idx === currentSongIndex && isPlaying ? ( <div className="w-2 h-2 bg-primary rounded-full animate-ping mx-auto"></div> ) : ( <span className="text-neutral-500 group-hover:text-white">{idx + 1}</span> )} </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold truncate ${idx === currentSongIndex ? 'text-primary' : 'text-white'}`}>{song.title}</div>
                                        <div className="text-xs text-neutral-400 truncate">{song.artist}</div>
                                    </div>
                                    <div className="text-xs font-mono text-neutral-500 ml-4">{Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'lyrics' && (
                 <div className="w-full max-w-6xl flex-1 min-h-0 mb-8 relative">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar scroll-smooth" ref={lyricsContainerRef}>
                        <div className="min-h-full flex flex-col items-center justify-center py-32 px-6 md:px-16 text-center">
                            {loadingLyrics ? ( <div className="flex flex-col items-center"> <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div> <span className="text-neutral-400">Fetching lyrics...</span> </div> ) : syncedLyrics.length > 0 ? (
                                <div className="space-y-6 w-full">
                                    {syncedLyrics.map((line, i) => {
                                        const isActive = i === activeLineIndex;
                                        return ( <p key={i} ref={isActive ? activeLineRef : null} className={`transition-all duration-500 ease-in-out cursor-pointer origin-center leading-relaxed ${isActive ? 'text-2xl md:text-4xl font-bold text-white scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] py-2' : 'text-lg md:text-2xl font-medium text-neutral-600 hover:text-neutral-300 blur-[0.5px] hover:blur-0 scale-100'}`} onClick={() => { const audio = document.querySelector('audio'); if(audio) audio.currentTime = line.time; setCurrentTime(line.time); }}> {line.text} </p> );
                                    })}
                                </div>
                            ) : ( <div className="whitespace-pre-wrap leading-loose text-lg md:text-xl text-neutral-300"> {lyrics || "No lyrics found for this song."} </div> )}
                        </div>
                    </div>
                 </div>
            )}
            {activeTab === 'playing' && (
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl min-h-0">
                     <div className="relative aspect-square w-full max-w-[300px] md:max-w-[450px] max-h-[40vh] mb-6 md:mb-10 group shrink-0">
                          <div className={`relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-neutral-900 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}>
                              <img src={coverArt} className="w-full h-full object-cover" alt={currentSong.title} />
                              {isVinyl && ( <div className="absolute inset-0 bg-black/10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay pointer-events-none"></div> )}
                          </div>
                          <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-secondary rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000 -z-10 animate-pulse"></div>
                     </div>
                     <div className="text-center mb-4 md:mb-10 shrink-0 w-full px-12 md:px-32 max-w-4xl mx-auto">
                          <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg leading-tight line-clamp-2">{currentSong.title}</h1>
                          <div className="text-lg md:text-3xl text-neutral-300 font-bold cursor-pointer hover:text-primary transition mb-1 md:mb-2 block truncate max-w-2xl mx-auto" onClick={() => { if (currentSong.artistId) { setView('ARTIST_DETAIL', currentSong.artistId); setIsExpanded(false); } }}> {currentSong.artist} </div>
                          <div className="flex flex-col items-center gap-1 md:gap-2">
                              <div className="text-base md:text-xl text-neutral-500 font-medium cursor-pointer hover:text-white transition block truncate max-w-xl mx-auto" onClick={() => { if (currentSong.albumId) { setView('ALBUM_DETAIL', currentSong.albumId); setIsExpanded(false); } }}> {currentSong.album} </div>
                              <div className="mt-1"> {renderQualityBadge(currentSong.suffix, currentSong.bitRate)} </div>
                          </div>
                     </div>
                </div>
            )}
            <div className="w-full max-w-4xl bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl mb-8 shrink-0">
                 <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 mb-6">
                     <span>{formatTime(currentTime)}</span>
                     <div className="relative flex-1 h-1.5 bg-white/10 rounded-full group">
                         <div className="absolute inset-0 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative" style={{ width: `${progress}%` }}>
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             </div>
                         </div>
                         <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleScrub} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     </div>
                     <span>{formatTime(duration)}</span>
                 </div>

                 <div className="flex items-center justify-between gap-4 md:gap-8">
                     <button onClick={toggleVinylMode} className={`p-2 rounded-full transition ${isVinyl ? 'bg-primary/20 text-primary border border-primary/30' : 'text-neutral-500 hover:text-white'}`} title="Vinyl Mode (Pitch varies with speed)">
                         <Disc className={`w-5 h-5 ${isVinyl ? 'animate-spin-slow' : ''}`} />
                     </button>
                     
                     <div className="flex items-center gap-4 md:gap-8 flex-1 justify-center">
                         <button onClick={prevSong} className="text-neutral-300 hover:text-white transition hover:scale-110">
                             <SkipBack className="w-8 h-8 fill-current" />
                         </button>
                         <button 
                             onClick={togglePlay} 
                             className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary hover:text-white transition shadow-xl shadow-white/10"
                         >
                             {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                         </button>
                         <button onClick={nextSong} className="text-neutral-300 hover:text-white transition hover:scale-110">
                             <SkipForward className="w-8 h-8 fill-current" />
                         </button>
                     </div>

                     <div className="flex items-center gap-4">
                         <div className="hidden md:flex items-center group/vol">
                             <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-neutral-500 hover:text-white mr-2">
                                 {volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                             </button>
                             <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                                 <input 
                                     type="range" 
                                     min="0" 
                                     max="1" 
                                     step="0.01" 
                                     value={volume} 
                                     onChange={(e) => setVolume(parseFloat(e.target.value))} 
                                     className="w-24 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                 />
                             </div>
                         </div>
                         <button onClick={toggleRepeat} className={`transition ${repeatMode === 'OFF' ? 'text-neutral-500 hover:text-white' : 'text-primary'}`}>
                             {repeatMode === 'ONE' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                         </button>
                     </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Mini Player Bar */}
      {!isExpanded && !isZenMode && (
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 p-3 z-50 flex items-center gap-4 pb-safe transition-transform duration-300 animate-fade-in-up" onClick={() => setIsExpanded(true)}>
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 group cursor-pointer shadow-lg">
                  <img src={coverArt} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-5 h-5 text-white" />
                  </div>
              </div>
              
              <div className="flex-1 min-w-0 cursor-pointer overflow-hidden">
                  <div className="font-bold text-white truncate text-sm">{currentSong.title}</div>
                  <div className="text-xs text-neutral-400 truncate">{currentSong.artist}</div>
              </div>

              <div className="flex items-center gap-3 md:gap-6 mr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevSong(); }} 
                    className="hidden md:block text-neutral-400 hover:text-white transition"
                  >
                      <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                    className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition shadow-lg"
                  >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextSong(); }} 
                    className="text-neutral-400 hover:text-white transition"
                  >
                      <SkipForward className="w-5 h-5 fill-current" />
                  </button>
              </div>
          </div>
      )}
    </>
  );
};
