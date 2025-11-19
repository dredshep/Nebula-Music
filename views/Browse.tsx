import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { ISong, IAlbum } from '../types';
import { Play, Music, RefreshCw, Heart, Radio, Zap } from 'lucide-react';

export const BrowseView: React.FC = () => {
  const { service, playSong, setView } = useStore();
  const [generatedMixes, setGeneratedMixes] = useState<{title: string, desc: string, icon: any, songs: ISong[]}[]>([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState<IAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const random = await service.getRandomSongs(15);
    const recent = await service.getAlbumList('recent', 8);
    const frequent = await service.getAlbumList('frequent', 8);
    
    // Mocking "Generated" Playlists by shuffling the random songs into buckets
    const mix1 = random.slice(0, 5);
    const mix2 = random.slice(5, 10);
    const mix3 = random.slice(10, 15);

    setGeneratedMixes([
        { title: 'Flow State', desc: 'Focus generated just for you', icon: Zap, songs: mix1 },
        { title: 'Nostalgia Trip', desc: 'Rediscover your old favorites', icon: Radio, songs: mix2 },
        { title: 'Daily Mix', desc: 'Fresh tracks for today', icon: Music, songs: mix3 },
    ]);

    setRecommendedAlbums(frequent.length > 0 ? frequent : recent);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [service]);

  const PlaylistCard = ({ title, desc, icon: Icon, songs }: any) => (
    <div className="relative group bg-neutral-900 border border-white/5 hover:border-primary/50 rounded-2xl p-6 transition-all hover:bg-white/5 cursor-pointer overflow-hidden" onClick={() => playSong(songs[0], songs)}>
        <div className="absolute right-0 top-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition group-hover:bg-primary/10"></div>
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-neutral-400 mb-6">{desc}</p>
            
            <div className="space-y-2 mb-4">
                {songs.slice(0, 3).map((s: ISong) => (
                    <div key={s.id} className="flex items-center text-xs text-neutral-500">
                        <Music className="w-3 h-3 mr-2" />
                        <span className="truncate">{s.title}</span>
                    </div>
                ))}
            </div>

            <button className="w-full py-2 bg-white/10 hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <Play className="w-4 h-4 mr-2 fill-current" /> Play Mix
            </button>
        </div>
    </div>
  );

  return (
    <div className="p-10 pb-32">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">Browse & Discover</h2>
         <button onClick={loadData} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
             <RefreshCw className={`w-5 h-5 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
         </button>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center"><Zap className="w-5 h-5 text-yellow-500 mr-2" /> Generated For You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedMixes.map((mix, i) => <PlaylistCard key={i} {...mix} />)}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center"><Heart className="w-5 h-5 text-red-500 mr-2" /> Recommended Albums</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recommendedAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="group cursor-pointer bg-neutral-800/30 rounded-xl p-3 hover:bg-white/10 transition"
                  onClick={() => setView('ALBUM_DETAIL', album.id)}
                >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                        <img src={album.coverArt} alt="" className="w-full h-full object-cover transition group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{album.name}</h4>
                    <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};