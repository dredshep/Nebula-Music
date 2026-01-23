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
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
                     <div className="relative aspect-square w-full max-w-[300px] md:max-w-[450px] mb-10 group">
                          <div className={`relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-neutral-900 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}>
                              <img src={coverArt} className="w-full h-full object-cover" alt={currentSong.title} />
                              {isVinyl && ( <div className="absolute inset-0 bg-black/10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay pointer-events-none"></div> )}
                          </div>
                          <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-secondary rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000 -z-10 animate-pulse"></div>
                     </div>
                     <div className="text-center mb-4 md:mb-10">
                          <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg leading-tight">{currentSong.title}</h1>
                          <div className="text-lg md:text-3xl text-neutral-300 font-bold cursor-pointer hover:text-primary transition mb-1 md:mb-2 block" onClick={() => { if (currentSong.artistId) { setView('ARTIST_DETAIL', currentSong.artistId); setIsExpanded(false); } }}> {currentSong.artist} </div>
                          <div className="flex flex-col items-center gap-1 md:gap-2">
                              <div className="text-base md:text-xl text-neutral-500 font-medium cursor-pointer hover:text-white transition block" onClick={() => { if (currentSong.albumId) { setView('ALBUM_DETAIL', currentSong.albumId); setIsExpanded(false); } }}> {currentSong.album} </div>
                              <div className="mt-1"> {renderQualityBadge(currentSong.suffix, currentSong.bitRate)} </div>
                          </div>
                     </div>
                </div>
            )}
            <div className="w-full max-w-4xl bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl mb-8">
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
                 <div className="grid grid-cols-3 items-center w-full">
                     <div className="flex items-center justify-start gap-2 md:gap-4">
                          <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className={`p-2 rounded-full hover:bg-white/10 transition ${currentSong.starred ? 'text-red-500' : 'text-neutral-400'}`}> <Heart className={`w-5 h-5 ${currentSong.starred ? 'fill-current' : ''}`} /> </button>
                          <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(currentSong); }} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"> <ListPlus className="w-5 h-5" /> </button>
                     </div>
                     <div className="flex items-center justify-center gap-6 md:gap-8">
                          <button onClick={prevSong} className="p-2 text-neutral-300 hover:text-white hover:scale-110 transition"> <SkipBack className="w-8 h-8 fill-current" /> </button>
                          <button onClick={togglePlay} className="w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary hover:text-white transition shadow-lg shadow-white/10"> {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />} </button>
                          <button onClick={nextSong} className="p-2 text-neutral-300 hover:text-white hover:scale-110 transition"> <SkipForward className="w-8 h-8 fill-current" /> </button>
                     </div>
                     <div className="flex items-center justify-end gap-2 md:gap-4">
                         <button onClick={toggleRepeat} className={`p-2 rounded-full hover:bg-white/10 transition ${repeatMode !== 'OFF' ? 'text-primary' : 'text-neutral-400'}`}> {repeatMode === 'ONE' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />} </button>
                         <div className="hidden sm:flex items-center gap-4 group/vol ml-2">
                             <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-neutral-400 hover:text-white transition"> {volume === 0 ? <VolumeX className="w-5 h-5" /> : (volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />)} </button>
                             <div className="relative w-20 h-6 flex items-center select-none">
                                 <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full w-full"></div>
                                 <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white rounded-full pointer-events-none" style={{ width: `${volume * 100}%` }}></div>
                                 <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-transform group-hover/vol:scale-125" style={{ left: `${volume * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                                 <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="mt-6 flex justify-center gap-4 md:gap-8 border-t border-white/5 pt-4">
                      <div className="flex flex-col items-center w-24 md:w-32">
                          <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Speed</label>
                          <div className="flex items-center justify-center bg-black/30 border border-transparent rounded-lg p-1 w-full h-[32px]">
                              <button onClick={() => setPlaybackRate(Math.max(0.5, playbackRate - 0.1))} className="px-2 text-neutral-400 hover:text-white">-</button>
                              <span className="flex-1 text-center text-xs font-mono">{playbackRate.toFixed(1)}x</span>
                              <button onClick={() => setPlaybackRate(Math.min(2.0, playbackRate + 0.1))} className="px-2 text-neutral-400 hover:text-white">+</button>
                          </div>
                      </div>
                      <div className="flex flex-col items-center w-24 md:w-32">
                          <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Vinyl Mode</label>
                          <div className="bg-black/30 border border-transparent rounded-lg p-1 w-full h-[32px] flex">
                              <button onClick={toggleVinylMode} className={`flex-1 flex items-center justify-center rounded transition ${isVinyl ? 'bg-white/10' : ''} group`}> <span className={`text-xs font-bold transition ${isVinyl ? 'text-orange-500' : 'text-neutral-400 group-hover:text-white'}`}> {isVinyl ? 'ANALOG' : 'DIGITAL'} </span> </button>
                          </div>
                      </div>
                 </div>
            </div>
        </div>
      </div>
      <div className={`fixed left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 h-20 md:h-24 px-4 md:px-8 flex items-center justify-between z-40 transition-all duration-300 bottom-16 md:bottom-0 ${isExpanded ? 'translate-y-[200%]' : 'translate-y-0'} ${isZenMode ? 'translate-y-[200%]' : ''}`} onClick={() => setIsExpanded(true)}>
          <div className="flex items-center w-2/3 md:w-1/3 min-w-0 cursor-pointer group">
              <div className="relative w-12 h-12 md:w-14 md:h-14 mr-3 md:mr-4 shrink-0">
                  <img src={coverArt} className="w-full h-full rounded-lg object-cover shadow-md group-hover:scale-105 transition" alt="" />
                  <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center"> <Maximize2 className="w-5 h-5 text-white" /> </div>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                  <h4 className="text-white font-bold truncate group-hover:text-primary transition text-sm md:text-base">{currentSong.title}</h4>
                  <div className="flex items-center text-xs text-neutral-400 truncate">
                      <span className="truncate">{currentSong.artist}</span>
                      {currentSong.suffix && ( <> <span className="mx-1 opacity-50">|</span> {renderQualityBadge(currentSong.suffix, currentSong.bitRate, true)} </> )}
                  </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} className={`hidden md:block ml-4 p-2 rounded-full hover:bg-white/10 transition opacity-0 group-hover:opacity-100 ${currentSong.starred ? 'text-red-500 opacity-100' : 'text-neutral-400'}`}> <Heart className={`w-4 h-4 ${currentSong.starred ? 'fill-current' : ''}`} /> </button>
          </div>
          <div className="flex flex-col items-center w-1/3 md:w-1/3">
              <div className="flex items-center justify-end md:justify-center gap-4 md:gap-6 w-full">
                  <button onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} className={`hidden md:block transition ${repeatMode !== 'OFF' ? 'text-primary' : 'text-neutral-500 hover:text-white'}`}> <Repeat className="w-4 h-4" /> </button>
                  <button onClick={(e) => { e.stopPropagation(); prevSong(); }} className="hidden md:block text-neutral-300 hover:text-white hover:scale-110 transition"> <SkipBack className="w-5 h-5 fill-current" /> </button>
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary hover:text-white transition shadow-lg"> {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />} </button>
                  <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="text-neutral-300 hover:text-white hover:scale-110 transition"> <SkipForward className="w-5 h-5 fill-current" /> </button>
                  <button onClick={(e) => { e.stopPropagation(); setZenMode(true); }} className="hidden md:block text-neutral-500 hover:text-white transition" title="Zen Mode"> <Eye className="w-4 h-4" /> </button>
              </div>
              <div className="hidden md:flex w-full max-w-md items-center gap-3 text-[10px] font-mono text-neutral-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <div className="relative flex-1 h-1 bg-white/10 rounded-full group" onClick={(e) => e.stopPropagation()}>
                      <div className="absolute inset-0 rounded-full overflow-hidden"> <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}></div> </div>
                      <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleScrub} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                  <span>{formatTime(duration)}</span>
              </div>
          </div>
          <div className="hidden md:flex items-center justify-end w-1/3 gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center group/vol">
                  <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="mr-3 text-neutral-400 hover:text-white transition"> {volume === 0 ? <VolumeX className="w-5 h-5" /> : (volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />)} </button>
                  <div className="relative w-24 h-6 flex items-center select-none group/slide">
                      <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full w-full"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white rounded-full pointer-events-none" style={{ width: `${volume * 100}%` }}></div>
                      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)] border border-neutral-300 pointer-events-none transition-transform group-hover/slide:scale-125" style={{ left: `${volume * 100}%`, transform: 'translate(-50%, -50%)' }}></div>
                      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
              </div>
              <button onClick={() => setIsExpanded(true)} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"> <Maximize2 className="w-5 h-5" /> </button>
          </div>
      </div>
    </>
  );
};