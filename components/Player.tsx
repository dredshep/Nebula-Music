
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, ChevronDown, Shuffle, Maximize2, Heart, ListPlus, Eye, EyeOff, Disc, Repeat, Repeat1, Activity, Mic2, Zap, RotateCcw, SlidersHorizontal, Plus, Minus, X } from 'lucide-react';
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
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  
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

  const renderQualityBadge = (suffix?: string, bitrate?: number, large = false) => {
      if (!suffix) return null;
      const s = suffix.toUpperCase();
      const isLossless = s === 'FLAC' || s === 'ALAC' || s === 'WAV' || s === 'AIFF' || s === 'AIF';
      const isHighQuality = isLossless || s === 'AAC' || s === 'M4A' || s === 'MP4' || (bitrate && bitrate >= 256);
      
      const badgePadding = large ? 'px-3 py-1.5' : 'px-1 py-0.5';
      const badgeTextSize = large ? 'text-sm font-bold' : 'text-[9px] font-bold';
      const bitrateTextSize = large ? 'text-sm font-mono' : 'text-[9px] font-mono';

      return (
          <div className={`flex items-center gap-2.5 ${!large ? 'opacity-70' : ''}`}>
              <span className={`${badgePadding} rounded-md ${badgeTextSize} border ${isLossless ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : (isHighQuality ? 'border-primary/50 text-primary bg-primary/10' : 'border-neutral-600 text-neutral-400 bg-neutral-800')}`}>
                  {s}
              </span>
              {bitrate && (
                  <span className={`${bitrateTextSize} ${large ? 'text-neutral-300' : 'text-neutral-500'}`}>{bitrate}k</span>
              )}
          </div>
      );
  };

  const changeSpeed = (delta: number, vinylMode: boolean) => {
    const newRate = Math.max(0.5, Math.min(2, Math.round((playbackRate + delta) * 10) / 10));
    setPlaybackRate(newRate);
    setPitchCorrection(!vinylMode);
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
     const audio = audioRef.current;
     if(audio) audio.currentTime = newTime;
     setCurrentTime(newTime);
  };
  
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
                          <p className="text-xl md:text-2xl text-neutral-300 mb-8 drop-shadow-lg text-center px-8">{currentSong.artist}</p>
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
                                     <div 
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] transform scale-0 group-hover/scrub:scale-100 transition-[transform] duration-200 pointer-events-none" 
                                        style={{ left: `calc(${progress}% - 8px)` }}
                                     ></div>
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
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl gap-6 md:gap-10 min-h-0 px-6 md:px-12 py-4">
                     {/* Top: Album Art */}
                     <div className="relative shrink-0 flex justify-center items-center h-[35vh] md:h-[45vh] lg:h-[50vh] aspect-square max-w-full">
                          <div className="relative w-full h-full flex items-center justify-center">
                              <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                              <div className={`relative w-full h-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-neutral-900 border border-white/10 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}`}>
                                  <img src={coverArt} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 rounded-2xl" alt="" />
                                  <img 
                                    src={coverArt} 
                                    className="relative z-10 w-full h-full rounded-2xl object-cover shadow-2xl"
                                    alt={currentSong.title} 
                                  />
                                  {isVinyl && ( <div className="absolute inset-0 z-20 rounded-2xl bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none"></div> )}
                              </div>
                          </div>
                     </div>

                     {/* Bottom: Metadata - Now centered below art */}
                     <div className="flex flex-col items-center text-center w-full max-w-4xl overflow-hidden px-4">
                          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-6 leading-tight drop-shadow-lg line-clamp-2 break-words text-center py-2">
                            {currentSong.title}
                          </h1>
                          
                          <div className="space-y-2 md:space-y-4 w-full flex flex-col items-center">
                              <div 
                                className="text-xl md:text-3xl text-neutral-200 font-bold cursor-pointer hover:text-primary transition block truncate text-center w-full px-4" 
                                onClick={() => { if (currentSong.artistId) { setView('ARTIST_DETAIL', currentSong.artistId); setIsExpanded(false); } }}
                              > 
                                {currentSong.artist} 
                              </div>
                              
                              <div 
                                className="text-lg md:text-2xl text-neutral-400 font-medium cursor-pointer hover:text-white transition block truncate text-center w-full px-4" 
                                onClick={() => { if (currentSong.albumId) { setView('ALBUM_DETAIL', currentSong.albumId); setIsExpanded(false); } }}
                              > 
                                {currentSong.album} 
                              </div>

                              <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base text-neutral-500 font-medium mt-2 md:mt-4">
                                  {currentSong.genre && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                      {currentSong.genre}
                                    </span>
                                  )}
                                  {currentSong.year && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                      {currentSong.year}
                                    </span>
                                  )}
                              </div>

                              <div className="flex items-center justify-center mt-2"> 
                                {renderQualityBadge(currentSong.suffix, currentSong.bitRate, true)} 
                              </div>
                          </div>
                     </div>
                </div>
            )}
            <div className="w-full max-w-4xl bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl mb-8 shrink-0">
                 <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 mb-6">
                     <span>{formatTime(currentTime)}</span>
                     <div className="relative flex-1 h-1.5 bg-white/10 rounded-full group">
                         <div className="absolute inset-0 rounded-full flex items-center">
                             <div className="h-full bg-gradient-to-r from-primary to-secondary relative flex items-center justify-end" style={{ width: `${progress}%` }}>
                                 <div className="absolute right-[-6px] w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             </div>
                         </div>
                         <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleScrub} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     </div>
                     <span>{formatTime(duration)}</span>
                 </div>

                 <div className="flex items-center justify-between gap-4 md:gap-8">
                     {/* Speed & Pitch Control Modal Trigger */}
                     <div className="flex items-center gap-4 w-1/3 min-w-0 relative">
                        <button 
                            onClick={() => setShowSpeedModal(!showSpeedModal)}
                            className={`p-3 rounded-full transition ${showSpeedModal ? 'bg-primary text-black' : 'bg-white/10 text-neutral-400 hover:text-white'}`}
                            title="Playback Controls"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                        
                        <div className="flex flex-col hidden sm:flex">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {playbackRate.toFixed(1)}x
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                                {isVinyl ? 'Pitch' : 'Tempo'}
                            </span>
                        </div>

                        {showSpeedModal && (
                            <div className="absolute bottom-full left-0 mb-6 w-72 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl z-50 animate-fade-in-up">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white">Playback Control</h3>
                                    <button onClick={() => setShowSpeedModal(false)} className="text-neutral-500 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Tempo Control */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                                            <Zap className="w-3 h-3 mr-2" /> Tempo
                                        </span>
                                        {!isVinyl && playbackRate !== 1 && (
                                            <span className="text-[10px] text-primary">Active</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/20 rounded-2xl p-1.5 border border-white/5">
                                        <button 
                                            onClick={() => changeSpeed(-0.1, false)}
                                            className="p-3 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-center font-mono font-bold text-lg">
                                            {(!isVinyl ? playbackRate : 1.0).toFixed(1)}x
                                        </div>
                                        <button 
                                            onClick={() => changeSpeed(0.1, false)}
                                            className="p-3 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-2 text-center">Changes speed, preserves pitch.</p>
                                </div>

                                {/* Pitch Control */}
                                <div>
                                     <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center">
                                            <Disc className="w-3 h-3 mr-2" /> Pitch
                                        </span>
                                        {isVinyl && playbackRate !== 1 && (
                                            <span className="text-[10px] text-primary">Active</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/20 rounded-2xl p-1.5 border border-white/5">
                                        <button 
                                            onClick={() => changeSpeed(-0.1, true)}
                                            className="p-3 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-center font-mono font-bold text-lg">
                                             {(isVinyl ? playbackRate : 1.0).toFixed(1)}x
                                        </div>
                                        <button 
                                            onClick={() => changeSpeed(0.1, true)}
                                            className="p-3 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                     <p className="text-[10px] text-neutral-600 mt-2 text-center">Changes speed and pitch (Vinyl).</p>
                                </div>
                                
                                <button 
                                    onClick={() => { setPlaybackRate(1); setPitchCorrection(true); }}
                                    className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition flex items-center justify-center"
                                >
                                    <RotateCcw className="w-3 h-3 mr-2" /> Reset
                                </button>
                            </div>
                        )}
                     </div>
                     
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

                     <div className="flex items-center gap-4 w-1/3 justify-end">
                         <div className="hidden md:flex items-center group/vol relative">
                             <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-neutral-500 hover:text-white mr-2 p-2 rounded-full hover:bg-white/10 transition">
                                 {volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                             </button>
                             
                             <div className="w-0 overflow-hidden group-hover/vol:w-32 transition-all duration-300 ease-out flex items-center">
                                 <input 
                                     type="range" 
                                     min="0" 
                                     max="1" 
                                     step="0.01" 
                                     value={volume} 
                                     onChange={(e) => setVolume(parseFloat(e.target.value))} 
                                     className={`
                                      w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer focus:outline-none
                                      [&::-webkit-slider-thumb]:appearance-none 
                                      [&::-webkit-slider-thumb]:w-3.5 
                                      [&::-webkit-slider-thumb]:h-3.5 
                                      [&::-webkit-slider-thumb]:bg-white 
                                      [&::-webkit-slider-thumb]:rounded-full 
                                      [&::-webkit-slider-thumb]:shadow-md
                                      [&::-webkit-slider-thumb]:transition-transform
                                      [&::-webkit-slider-thumb]:hover:scale-125
                                      [&::-moz-range-thumb]:w-3.5 
                                      [&::-moz-range-thumb]:h-3.5 
                                      [&::-moz-range-thumb]:bg-white 
                                      [&::-moz-range-thumb]:border-none
                                      [&::-moz-range-thumb]:rounded-full
                                      [&::-moz-range-thumb]:hover:scale-125
                                     `}
                                     style={{
                                         backgroundImage: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`
                                     }}
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
          <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-neutral-900/95 backdrop-blur-xl border-t border-white/5 z-50 flex flex-col pb-safe transition-transform duration-300 animate-fade-in-up shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              
              {/* Seekable Progress Bar - Enhanced Hover Experience */}
              <div 
                className="w-full h-1 bg-white/5 relative group cursor-pointer touch-none transition-[height] duration-300 hover:h-6" 
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Pinned Fill & Thumb Container */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-primary flex items-center justify-end" 
                    style={{ width: `${progress}%` }} 
                  >
                      {/* Visual Thumb for Seek Feedback - Grows significantly on hover and pinned to end of fill */}
                      <div 
                        className="w-3 h-3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] opacity-0 group-hover:opacity-100 group-hover:w-5 group-hover:h-5 transition-[width,height,opacity] duration-200 pointer-events-none translate-x-1/2"
                      ></div>
                  </div>

                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1" 
                    value={progress} 
                    onChange={handleScrub}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
              </div>

              <div className="flex items-center justify-between px-4 h-16 md:h-20" onClick={() => setIsExpanded(true)}>
                  
                  {/* LEFT: Info */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 max-w-[40%] md:max-w-[30%]">
                      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0 group cursor-pointer shadow-lg">
                          <img src={coverArt} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 cursor-pointer overflow-hidden">
                          <div className="font-bold text-white truncate text-xs md:text-sm">{currentSong.title}</div>
                          <div className="text-[10px] md:text-xs text-neutral-400 truncate">{currentSong.artist}</div>
                      </div>
                  </div>

                  {/* CENTER: Controls (Dead Centered on Desktop) */}
                  <div 
                    className="flex items-center gap-4 md:gap-8 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2" 
                    onClick={(e) => e.stopPropagation()}
                  >
                      <button 
                        onClick={(e) => { e.stopPropagation(); prevSong(); }} 
                        className="hidden md:block text-neutral-400 hover:text-white transition hover:scale-125"
                      >
                          <SkipBack className="w-6 h-6 fill-current" />
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                        className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition shadow-lg hover:scale-110 active:scale-95"
                      >
                          {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />}
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextSong(); }} 
                        className="text-neutral-400 hover:text-white transition hover:scale-125"
                      >
                          <SkipForward className="w-6 h-6 fill-current" />
                      </button>
                  </div>

                  {/* RIGHT: Volume & Time */}
                  <div className="hidden md:flex items-center gap-6 flex-1 justify-end max-w-[30%]">
                       <span className="text-xs font-mono text-neutral-500 font-bold">
                        {formatTime(currentTime)} / {formatTime(duration)}
                       </span>

                       {/* Enhanced Volume Slider */}
                       <div className="flex items-center gap-3 group/vol w-32 xl:w-40" onClick={(e) => e.stopPropagation()}>
                           <button 
                               onClick={() => setVolume(volume === 0 ? 1 : 0)} 
                               className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-neutral-400 hover:text-white transition"
                           >
                               {volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                           </button>
                           <div className="flex-1 h-4 relative flex items-center group/track">
                               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden transition-all group-hover/track:h-1.5">
                                    <div className="h-full bg-white group-hover/vol:bg-primary transition-colors duration-300" style={{ width: `${volume * 100}%` }}></div>
                               </div>
                               <div 
                                    className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)] opacity-0 group-hover/vol:opacity-100 transition-all duration-200 pointer-events-none scale-0 group-hover/vol:scale-100" 
                                    style={{ left: `calc(${volume * 100}%)` }}
                               ></div>
                               <input 
                                   type="range" 
                                   min="0" 
                                   max="1" 
                                   step="0.01" 
                                   value={volume} 
                                   onChange={(e) => setVolume(parseFloat(e.target.value))}
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                               />
                           </div>
                       </div>
                  </div>

              </div>
          </div>
      )}
    </>
  );
};
