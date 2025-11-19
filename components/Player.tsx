import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronDown, Shuffle, Maximize2, Heart, ListPlus, Eye, EyeOff, Disc, Repeat, Repeat1, Activity, Mic2 } from 'lucide-react';
import { useStore } from '../context/Store';
import { Visualizer } from './Visualizer';
import { ISong, VisualizerMode } from '../types';

export const Player: React.FC = () => {
  const { 
    queue, currentSongIndex, isPlaying, togglePlay, nextSong, prevSong, 
    volume, setVolume, playbackRate, setPlaybackRate, 
    pitchCorrection, setPitchCorrection, playSong,
    currentTime, duration, service, setView,
    visualizerMode, setVisualizerMode,
    repeatMode, toggleRepeat, toggleLike, openPlaylistModal
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'playing' | 'queue' | 'lyrics'>('playing');
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [immersive, setImmersive] = useState(false);

  const currentSong = queue[currentSongIndex];

  useEffect(() => {
    const fetchLyrics = async () => {
        if (activeTab === 'lyrics' && currentSong) {
            setLoadingLyrics(true);
            const text = await service.getLyrics(currentSong.artist, currentSong.title, currentSong.album, currentSong.duration);
            setLyrics(text);
            setLoadingLyrics(false);
        }
    };
    fetchLyrics();
  }, [activeTab, currentSong, service]);

  const cycleVisualizerMode = useCallback(() => {
    const modes: VisualizerMode[] = ['BARS', 'WAVE', 'CIRCLE', 'MIRROR'];
    const nextIndex = (modes.indexOf(visualizerMode) + 1) % modes.length;
    setVisualizerMode(modes[nextIndex]);
  }, [visualizerMode, setVisualizerMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        
        if (e.key.toLowerCase() === 'v') {
            cycleVisualizerMode();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleVisualizerMode]);

  if (!currentSong) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  const coverArt = service.getCoverArtUrl(currentSong.id, 600);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
     const newTime = (parseFloat(e.target.value) / 100) * duration;
     const audio = document.querySelector('audio');
     if(audio) audio.currentTime = newTime;
  };

  const toggleVinylMode = () => {
      setPitchCorrection(!pitchCorrection); 
  };

  const isVinyl = !pitchCorrection;

  return (
    <>
      {/* EXPANDED PLAYER OVERLAY */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-neutral-950 transition-transform duration-500 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {!immersive && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                 <img src={coverArt} className="absolute w-full h-full object-cover blur-3xl opacity-40 scale-110" alt="bg" />
                 <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob"></div>
                 <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-secondary rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
            </div>
        )}

        {immersive && (
            <div className="absolute inset-0 z-0">
                <Visualizer className="w-full h-full opacity-60" />
            </div>
        )}

        {!immersive && (
            <div className="relative z-10 flex-none flex items-center justify-between p-4 md:p-8">
                <button onClick={() => setIsExpanded(false)} className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white">
                    <ChevronDown className="w-8 h-8" />
                </button>
                
                <div className="flex items-center bg-white/5 rounded-full p-1 backdrop-blur-md border border-white/5">
                    <button 
                        onClick={() => setActiveTab('playing')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'playing' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Playing
                    </button>
                    <button 
                        onClick={() => setActiveTab('lyrics')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'lyrics' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Lyrics
                    </button>
                    <button 
                        onClick={() => setActiveTab('queue')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'queue' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Queue
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={cycleVisualizerMode}
                        className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white group relative"
                    >
                        <Activity className="w-6 h-6" />
                        <span className="absolute right-0 top-full mt-2 w-32 text-center text-[10px] bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                            {visualizerMode} (V)
                        </span>
                    </button>
                    <button onClick={() => setImmersive(true)} className="p-2 rounded-full hover:bg-white/10 transition text-neutral-400 hover:text-white group relative">
                        <Eye className="w-6 h-6" />
                        <span className="absolute right-0 top-full mt-2 w-24 text-center text-[10px] bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">Zen Mode</span>
                    </button>
                </div>
            </div>
        )}

        {immersive && (
            <div className="absolute top-6 right-6 z-30 flex items-center gap-4">
                <button 
                    onClick={cycleVisualizerMode}
                    className="p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition group relative"
                >
                    <Activity className="w-6 h-6" />
                    <span className="absolute right-0 top-full mt-2 w-max text-center text-[10px] bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
                        {visualizerMode} (V)
                    </span>
                </button>
                <button onClick={() => setImmersive(false)} className="p-3 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition">
                    <EyeOff className="w-6 h-6" />
                </button>
            </div>
        )}

        <div className={`relative z-10 flex-1 flex flex-col items-center px-4 md:px-8 w-full max-w-7xl mx-auto min-h-0 ${immersive ? 'hidden' : ''}`}>
            
            {activeTab === 'queue' && (
                <div className="w-full max-w-3xl flex-1 min-h-0 mb-8 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <h3 className="text-xl font-bold text-white mb-4 sticky top-0 bg-neutral-900/90 backdrop-blur p-2 -mx-2 rounded-lg z-20 shadow-lg">Queue</h3>
                        <div className="space-y-2 pb-4">
                            {queue.map((song, idx) => (
                                <div 
                                    key={`${song.id}-${idx}`} 
                                    onClick={() => playSong(song, queue)}
                                    className={`flex items-center p-3 rounded-xl transition cursor-pointer group ${idx === currentSongIndex ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="w-8 text-center text-sm font-mono mr-4">
                                        {idx === currentSongIndex && isPlaying ? (
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse mx-auto" />
                                        ) : (
                                            <span className="text-neutral-500 group-hover:text-white">{idx + 1}</span>
                                        )}
                                    </div>
                                    <img src={service.getCoverArtUrl(song.id, 100)} className="w-10 h-10 rounded bg-neutral-800 object-cover mr-4" loading="lazy" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-bold truncate ${idx === currentSongIndex ? 'text-primary' : 'text-white'}`}>{song.title}</h4>
                                        <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                                    </div>
                                    <span className="text-xs text-neutral-500 font-mono">
                                        {Math.floor(song.duration / 60)}:{song.duration % 60 < 10 ? '0' : ''}{song.duration % 60}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'lyrics' && (
                <div className="w-full max-w-3xl flex-1 min-h-0 mb-8 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col items-center">
                        <h3 className="text-xl font-bold text-white mb-6 sticky top-0 flex items-center gap-2 bg-neutral-900/80 p-2 rounded-lg z-20">
                            <Mic2 className="w-5 h-5 text-secondary" /> Lyrics
                        </h3>
                        {loadingLyrics ? (
                            <div className="flex-1 flex items-center justify-center min-h-[200px]">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="text-center text-lg md:text-2xl font-medium text-neutral-300 whitespace-pre-line leading-relaxed opacity-90 pb-8">
                                {lyrics || "No lyrics available for this track."}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'playing' && (
                <div className="flex flex-col lg:flex-row items-center justify-center w-full h-full overflow-y-auto lg:overflow-visible scrollbar-hide pb-8 gap-6 lg:gap-12">
                    {/* Art / Vinyl Display */}
                    <div className="w-[260px] sm:w-[320px] lg:w-full lg:max-w-md aspect-square relative group flex-shrink-0 flex items-center justify-center mb-2 lg:mb-0">
                        {isVinyl ? (
                           /* Vinyl Mode UI */
                           <div className={`relative w-full h-full rounded-full bg-black border-8 border-neutral-900 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : 'animate-wobble'}`}>
                                <div className="absolute inset-2 rounded-full border border-neutral-800 opacity-50"></div>
                                <div className="absolute inset-4 rounded-full border border-neutral-800 opacity-50"></div>
                                <div className="absolute inset-8 rounded-full border border-neutral-800 opacity-50"></div>
                                <div className="absolute inset-12 rounded-full border border-neutral-800 opacity-40"></div>
                                
                                <div className="w-[40%] h-[40%] rounded-full overflow-hidden border-4 border-neutral-900 relative z-20">
                                    <img src={coverArt} alt={currentSong.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute w-3 h-3 bg-black rounded-full z-30 border border-neutral-700"></div>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>
                           </div>
                        ) : (
                           <>
                             <img 
                                 src={coverArt} 
                                 alt={currentSong.title} 
                                 className={`w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/50 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`} 
                             />
                             <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent pointer-events-none border border-white/10"></div>
                           </>
                        )}
                    </div>

                    {/* Info & Controls */}
                    <div className="flex flex-col w-full max-w-2xl space-y-6 lg:space-y-8">
                        <div className="space-y-2 text-center lg:text-left flex flex-col lg:items-start items-center">
                            <h2 
                                className="text-3xl md:text-5xl font-bold text-white truncate w-full leading-tight cursor-pointer hover:text-primary transition"
                                onClick={() => { setIsExpanded(false); if(currentSong.albumId) setView('ALBUM_DETAIL', currentSong.albumId); }}
                            >
                                {currentSong.title}
                            </h2>
                            <p 
                                className="text-xl md:text-2xl text-neutral-400 truncate w-full cursor-pointer hover:text-white transition"
                                onClick={() => { setIsExpanded(false); if(currentSong.artistId) setView('ARTIST_DETAIL', currentSong.artistId); }}
                            >
                                {currentSong.artist}
                            </p>
                            <div className="flex items-center gap-2">
                                <p 
                                    className="text-lg text-neutral-500 truncate cursor-pointer hover:text-white transition"
                                    onClick={() => { setIsExpanded(false); if(currentSong.albumId) setView('ALBUM_DETAIL', currentSong.albumId); }}
                                >
                                    {currentSong.album}
                                </p>
                            </div>
                        </div>

                        {/* Waveform */}
                        <div className="h-16 md:h-20 w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 relative shrink-0">
                            <Visualizer className="opacity-60" />
                        </div>

                        {/* Progress */}
                        <div className="space-y-2 shrink-0">
                            <input 
                                type="range" 
                                min="0" max="100" step="0.1"
                                value={progress}
                                onChange={handleScrub}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary hover:accent-white transition-all"
                            />
                            <div className="flex justify-between text-sm text-neutral-500 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center justify-center lg:justify-start gap-6 md:gap-8 shrink-0">
                            <button 
                                onClick={toggleRepeat} 
                                className={`transition hover:scale-110 relative ${repeatMode === 'OFF' ? 'text-neutral-500 hover:text-white' : 'text-primary'}`}
                            >
                                {repeatMode === 'ONE' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                                {repeatMode !== 'OFF' && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>}
                            </button>
                            
                            <button onClick={prevSong} className="text-neutral-400 hover:text-white transition hover:scale-110">
                                <SkipBack className="w-8 h-8" />
                            </button>
                            
                            <button 
                                onClick={togglePlay} 
                                className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition shadow-lg shadow-primary/20"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />}
                            </button>
                            
                            <button onClick={nextSong} className="text-neutral-400 hover:text-white transition hover:scale-110">
                                <SkipForward className="w-8 h-8" />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setActiveTab('lyrics')}
                                    className="transition hover:scale-110 text-neutral-500 hover:text-white"
                                    title="Lyrics"
                                >
                                    <Mic2 className="w-6 h-6" />
                                </button>

                                <button 
                                    onClick={() => toggleLike(currentSong)} 
                                    className={`transition hover:scale-110 ${currentSong.starred ? 'text-red-500' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <Heart className={`w-6 h-6 ${currentSong.starred ? 'fill-current' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => openPlaylistModal(currentSong)}
                                    className="text-neutral-500 hover:text-white transition hover:scale-110"
                                >
                                    <ListPlus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Volume, Speed & Vinyl Toggle */}
                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/5 w-full self-start shrink-0">
                             {/* Volume */}
                             <div className="w-full md:flex-1 min-w-[120px]">
                                 <div className="flex justify-between text-xs uppercase text-neutral-400 tracking-wider mb-2">
                                     <span className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> Volume</span>
                                     <span>{Math.round(volume * 100)}%</span>
                                 </div>
                                 <input 
                                     type="range" 
                                     min="0" max="1" step="0.01"
                                     value={volume}
                                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                                     className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                 />
                             </div>

                             <div className="hidden md:block h-8 w-px bg-white/10"></div>

                             {/* Speed */}
                             <div className="w-full md:flex-1 min-w-[120px]">
                                 <div className="flex justify-between text-xs uppercase text-neutral-400 tracking-wider mb-2">
                                     <span>Speed</span>
                                     <span>{playbackRate.toFixed(2)}x</span>
                                 </div>
                                 <input 
                                     type="range" 
                                     min="0.5" max="2" step="0.05"
                                     value={playbackRate}
                                     onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                                     className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                 />
                             </div>
                             
                             <div className="hidden md:block h-8 w-px bg-white/10"></div>
                             
                             {/* Vinyl */}
                             <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                                 <div className="flex flex-col">
                                     <span className="text-xs uppercase text-neutral-400 tracking-wider font-bold flex items-center gap-1">
                                        <Disc className={`w-3 h-3 ${isVinyl ? 'text-primary animate-spin-slow' : 'text-neutral-500'}`} />
                                        Vinyl Mode
                                     </span>
                                 </div>
                                 <button 
                                    onClick={toggleVinylMode}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isVinyl ? 'bg-primary' : 'bg-neutral-700'}`}
                                 >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isVinyl ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                 </button>
                             </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MINIMIZED PLAYER BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-24 glass-strong z-40 flex items-center px-4 md:px-6 justify-between transition-all">
          {/* Track Info */}
          <div className="flex items-center w-1/3 min-w-0 cursor-pointer group" onClick={() => setIsExpanded(true)}>
              <div className="relative w-14 h-14 rounded-md overflow-hidden mr-4 shadow-lg">
                  <img src={coverArt} alt="Art" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-6 h-6 text-white" />
                  </div>
              </div>
              <div className="min-w-0">
                  <h4 className="font-semibold text-white truncate text-sm md:text-base hover:text-primary transition">{currentSong.title}</h4>
                  <p 
                    className="text-xs text-neutral-400 truncate hover:text-white hover:underline"
                    onClick={(e) => { e.stopPropagation(); if(currentSong.artistId) setView('ARTIST_DETAIL', currentSong.artistId); }}
                  >
                    {currentSong.artist}
                  </p>
              </div>
              <button 
                  onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} 
                  className={`ml-4 p-2 rounded-full hover:bg-white/10 transition ${currentSong.starred ? 'text-red-500' : 'text-neutral-500 hover:text-white'}`}
              >
                  <Heart className={`w-4 h-4 ${currentSong.starred ? 'fill-current' : ''}`} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); openPlaylistModal(currentSong); }}
                  className="ml-1 p-2 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition"
              >
                  <ListPlus className="w-4 h-4" />
              </button>
          </div>

          {/* Center Controls */}
          <div className="flex flex-col items-center w-1/3">
              <div className="flex items-center space-x-6 mb-1">
                  <button className="text-neutral-400 hover:text-white transition"><Shuffle className="w-4 h-4" /></button>
                  <button onClick={prevSong} className="text-neutral-200 hover:text-white hover:scale-110 transition"><SkipBack className="w-5 h-5 fill-current" /></button>
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition"
                  >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  <button onClick={nextSong} className="text-neutral-200 hover:text-white hover:scale-110 transition"><SkipForward className="w-5 h-5 fill-current" /></button>
                  
                  <button 
                      onClick={toggleRepeat} 
                      className={`transition ${repeatMode === 'OFF' ? 'text-neutral-400 hover:text-white' : 'text-primary'}`}
                  >
                      {repeatMode === 'ONE' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </button>
              </div>
              <div className="w-full max-w-md flex items-center gap-2 text-xs font-mono text-neutral-500">
                  <span>{formatTime(currentTime)}</span>
                  <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                      <div style={{ width: `${progress}%` }} className="h-full bg-primary/80 rounded-full"></div>
                  </div>
                  <span>{formatTime(duration)}</span>
              </div>
          </div>

          {/* Volume / Extra */}
          <div className="flex items-center justify-end w-1/3 space-x-4">
             <Visualizer className="w-20 h-8 hidden md:block opacity-50" />
             <div className="flex items-center group relative">
                 <Volume2 className="w-5 h-5 text-neutral-400 mr-2" />
                 <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-neutral-700 rounded-lg accent-secondary"
                 />
             </div>
          </div>
      </div>
    </>
  );
};
