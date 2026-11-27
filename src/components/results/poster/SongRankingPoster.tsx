import { useTranslation } from 'react-i18next';
import { RankingPoster } from './RankingPoster';
import { formatArtistsWithVariants, isOriginalRecording } from '../songs/SongRankingTable';
import { SongPerformanceContext } from '~/components/sorter/SongPerformanceContext';
import { useAbbreviations } from '~/hooks/useAbbreviations';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useSeriesData } from '~/hooks/useSeriesData';
import type { WithRank } from '~/types';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import type { Song } from '~/types/songs';
import { getSeriesName, getSongName } from '~/utils/names';
import { getSongColor } from '~/utils/song';

export function SongRankingPoster({
  songs,
  performanceMeta,
  abbreviate
}: {
  songs: WithRank<Song>[];
  performanceMeta?: PerformanceSortMeta;
  abbreviate?: boolean;
}) {
  const artists = useArtistsData();
  const seriesData = useSeriesData();
  const { t, i18n } = useTranslation();
  const { short } = useAbbreviations();
  const lang = i18n.language;

  const entries = songs.map((song) => {
    const artistNames = formatArtistsWithVariants(
      song.artists,
      artists,
      lang,
      abbreviate ? short.name : undefined
    );
    const series = song.seriesIds
      .map((id) => {
        const name = seriesData.find((item) => item.id === `${id}`)?.name ?? '';
        return (abbreviate && short.name(name)) || getSeriesName(name, lang);
      })
      .join(', ');
    const showSeries = !!series && !artistNames.startsWith(series);

    return {
      key: song.id,
      rank: song.rank,
      color: getSongColor(song),
      title: (abbreviate && short.song(song)) || getSongName(song.name, song.englishName, lang),
      subtitle: isOriginalRecording(song, performanceMeta)
        ? `${t('performance.original_recording')}: ${artistNames}`
        : artistNames,
      details: (showSeries || performanceMeta) && (
        <>
          {showSeries && series}
          {performanceMeta && (
            <SongPerformanceContext
              abbreviate={abbreviate}
              song={song}
              entries={performanceMeta.setlistOrder}
              alignStart
            />
          )}
        </>
      )
    };
  });

  return <RankingPoster entries={entries} />;
}
