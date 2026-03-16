import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, ChevronUp } from 'lucide-react';
import { useStore } from '../context/Store';
import { useAdaptiveColors } from '../hooks/useAdaptiveColors';

interface MobilePlayerBarProps {
    onExpand: () => void;
}

export const MobilePlayerBar: React.FC<MobilePlayerBarProps> = ({ onExpand }) => {
    const {
        queue, currentSongIndex, isPlaying, togglePlay, nextSong, service, audioRef
    } = useStore();

    const [progress, setProgress] = useState(0);
    const currentSong = queue[currentSongIndex];
    const coverArt = currentSong ? service.getCoverArtUrl(currentSong.id, 200) : '';

    const { colors } = useAdaptiveColors(coverArt);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        audio.addEventListener('timeupdate', updateProgress);
        return () => audio.removeEventListener('timeupdate', updateProgress);
    }, [audioRef]);

    if (!currentSong) return null;

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
            {/* Progress bar */}
            <div className="h-0.5 bg-white/10">
                <div
                    className="h-full transition-all duration-150"
                    style={{ width: `${progress}%`, backgroundColor: colors.primary }}
                />
            </div>

            <div
                className="flex items-center gap-3 p-3 bg-neutral-950/95 backdrop-blur-xl border-t border-white/5"
                onClick={onExpand}
            >
                {/* Album Art */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg shrink-0">
                    <img src={coverArt} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{currentSong.title}</h4>
                    <p className="text-xs text-white/50 truncate">{currentSong.artist}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                        style={{ backgroundColor: colors.primary, color: colors.text }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextSong(); }}
                        className="p-2 text-white/60 hover:text-white active:scale-95 transition-all"
                        aria-label="Next track"
                    >
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onExpand(); }}
                        className="p-2 text-white/40 hover:text-white active:scale-95 transition-all"
                        aria-label="Open full screen player"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
