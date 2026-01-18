import { Song } from '~/types/songs';
import { SongSearchPanel } from '../setlist-prediction/builder/SongSearchPanel';
import { useEffect, useState } from 'react';


function useAudioBlobUrl(url: string | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(url, { referrerPolicy: 'no-referrer' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to fetch audio:', err);
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return blobUrl;
}
const _guess = (songId: string) => {
  console.log('guess', songId);
};

const handleAddSong = (songId: string, _songTitle: string) => {
  _guess(songId);
};

export function Heardle(song: Song) {
  const audioBlobUrl = useAudioBlobUrl(song.wikiAudioUrl);
  if (!audioBlobUrl) return <div>No audio available</div>;

  return (
    <>
      <audio src={audioBlobUrl} controls style={{ width: '100%' }} />
      <SongSearchPanel onAddSong={handleAddSong} onAddCustomSong={undefined} />
    </>
  );
}
