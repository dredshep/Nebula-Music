import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, PanelRight, Heart, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useStore } from '../../context/Store';
import { useAdaptiveColors } from '../../hooks/useAdaptiveColors';

interface FloatingMiniPlayerProps {
    onExpand: () => void;
    onRestoreSidebar: () => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({ onExpand, onRestoreSidebar }) => {
    const {
        queue, currentSongIndex, isPlaying, togglePlay, nextSong, prevSong, service, audioRef, toggleLike, volume, setVolume
    } = useStore();

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isHoverProgress, setIsHoverProgress] = useState(false);
    const [isHoverVolume, setIsHoverVolume] = useState(false);
    const [visualProgress, setVisualProgress] = useState(0);

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

    if (!currentSong) return null;

    const coverArt = service.getCoverArtUrl(currentSong.id, 200);
    const { colors } = useAdaptiveColors(coverArt);
    const progress = duration ? (currentTime / duration) * 100 : 0;
    const displayProgress = visualProgress || progress;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        const newTime = (percentage / 100) * duration;
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(e.target.value);
        setVisualProgress(newProgress);
        const newTime = (newProgress / 100) * duration;
        const audio = audioRef.current;
        if (audio) audio.currentTime = newTime;
        setCurrentTime(newTime);
        setTimeout(() => setVisualProgress(0), 50);
    };

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    return (
        <div
            className="flex flex-col rounded-xl bg-neutral-100 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-300 dark:border-white/10 shadow-2xl animate-scale-in overflow-hidden"
            style={{
                boxShadow: `0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px ${colors.primary}15`,
                width: '680px',
                maxWidth: 'calc(100vw - 48px)'
            }}
        >
            {/* Progress bar at top - clickable with hover expand */}
            <div
                className={`relative cursor-pointer group transition-all duration-200 ${isHoverProgress ? 'h-3' : 'h-1.5'}`}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={handleProgressClick}
                onMouseEnter={() => setIsHoverProgress(true)}
                onMouseLeave={() => setIsHoverProgress(false)}
            >
                <div
                    className="absolute inset-y-0 left-0 rounded-r-full"
                    style={{ width: `${displayProgress}%`, backgroundColor: colors.primary, transition: visualProgress ? 'none' : 'width 0.1s ease-out' }}
                />
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={displayProgress}
                    onChange={handleScrub}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>

            {/* Main content */}
            <div className="flex items-center gap-4 px-4 py-3">
                {/* Album Art */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-lg cursor-pointer" onClick={onExpand}>
                    <img
                        src={coverArt}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Song Info */}
                <div className="min-w-0 w-36 shrink-0">
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{currentSong.title}</h4>
                    <p className="text-xs text-neutral-700 dark:text-white/50 truncate">{currentSong.artist}</p>
                </div>

                {/* Time display */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 dark:text-white/40 shrink-0">
                    <span className="tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-white/20">/</span>
                    <span className="tabular-nums">{formatTime(duration)}</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Volume control */}
                <div
                    className="flex items-center gap-1 shrink-0"
                    onMouseEnter={() => setIsHoverVolume(true)}
                    onMouseLeave={() => setIsHoverVolume(false)}
                >
                    <button
                        onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                        className="p-1.5 text-neutral-600 dark:text-white/40 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        {volume === 0 ? <VolumeX className="w-4 h-4" /> :
                            volume < 0.5 ? <Volume1 className="w-4 h-4" /> :
                                <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${isHoverVolume ? 'w-16' : 'w-0'}`}>
                        <div className="relative h-1 bg-white/10 rounded-full">
                            <div
                                className="absolute inset-y-0 left-0 bg-white/60 rounded-full"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Like button */}
                <button
                    onClick={() => toggleLike(currentSong)}
                    className={`p-2 transition-colors active:scale-95 ${currentSong.starred ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
                >
                    <Heart className={`w-4 h-4 ${currentSong.starred ? 'fill-current' : ''}`} />
                </button>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={prevSong}
                        className="p-2 text-white/50 hover:text-white transition-colors active:scale-95"
                    >
                        <SkipBack className="w-4 h-4" fill="currentColor" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: colors.primary }}
                    >
                        {isPlaying ? (
                            <Pause className="w-4 h-4 text-black" fill="black" />
                        ) : (
                            <Play className="w-4 h-4 ml-0.5 text-black" fill="black" />
                        )}
                    </button>
                    <button
                        onClick={nextSong}
                        className="p-2 text-white/50 hover:text-white transition-colors active:scale-95"
                    >
                        <SkipForward className="w-4 h-4" fill="currentColor" />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-white/10" />

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Restore Sidebar */}
                    <button
                        onClick={onRestoreSidebar}
                        className="p-2 text-white/40 hover:text-white transition-colors active:scale-95"
                        title="Show sidebar"
                    >
                        <PanelRight className="w-4 h-4" />
                    </button>
                    {/* Expand Full Screen */}
                    <button
                        onClick={onExpand}
                        className="p-2 text-white/40 hover:text-white transition-colors active:scale-95"
                        title="Full screen player"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
