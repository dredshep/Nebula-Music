import { useState, useEffect } from 'react';
import { useStore } from '../context/Store';

interface ArtistImageResult {
    image: string | null;
    bio: string | null;
    loading: boolean;
}

export const useArtistImage = (artistId?: string, artistName?: string): ArtistImageResult => {
    const { service } = useStore();
    const [image, setImage] = useState<string | null>(null);
    const [bio, setBio] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!artistId && !artistName) {
            setImage(null);
            setBio(null);
            return;
        }

        const fetchArtistInfo = async () => {
            setLoading(true);
            try {
                const info = await service.getArtistInfo(artistId || '', artistName);
                setImage(info.image || null);
                setBio(info.bio || null);
            } catch (e) {
                console.error('Failed to fetch artist info:', e);
                setImage(null);
                setBio(null);
            } finally {
                setLoading(false);
            }
        };

        fetchArtistInfo();
    }, [artistId, artistName, service]);

    return { image, bio, loading };
};
