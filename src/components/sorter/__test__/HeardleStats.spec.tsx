import { describe, it, expect } from 'vitest';
import { render } from '../../../__test__/utils';
import { HeardleStats } from '../HeardleStats';
import type { Song } from '~/types/songs';

const makeSong = (id: string, name: string, seriesId = 1): Song =>
  ({
    id,
    name,
    englishName: name,
    phoneticName: name.toLowerCase(),
    seriesIds: [seriesId],
    releasedOn: '2024-01-01',
    musicVideo: { videoId: 'v1', videoOffset: 0 },
    artists: [{ id: '1', variant: null }],
    discographyIds: [1],
    wikiAudioUrl: `https://example.com/${id}.ogg`
  }) as Song;

describe('HeardleStats', () => {
  it('renders nothing when total is 0', async () => {
    const [{ queryByText }] = await render(
      <HeardleStats correctCount={0} failedSongs={[]} lang="en" />
    );

    expect(queryByText(/correct/)).not.toBeInTheDocument();
    expect(queryByText(/Heardle Failed/)).not.toBeInTheDocument();
  });

  it('shows correct count with no failed songs', async () => {
    const [{ getByText, queryByText }] = await render(
      <HeardleStats correctCount={5} failedSongs={[]} lang="en" />
    );

    expect(getByText('5/5 (100%) correct')).toBeInTheDocument();
    expect(queryByText(/Heardle Failed/)).not.toBeInTheDocument();
  });

  it('shows correct stats with some failed songs', async () => {
    const failed = [makeSong('s1', 'Song Alpha'), makeSong('s2', 'Song Beta')];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={3} failedSongs={failed} lang="en" />
    );

    expect(getByText('3/5 (60%) correct')).toBeInTheDocument();
    expect(getByText('Heardle Failed (2)')).toBeInTheDocument();
  });

  it('lists all failed song names', async () => {
    const failed = [
      makeSong('s1', 'Song Alpha'),
      makeSong('s2', 'Song Beta'),
      makeSong('s3', 'Song Gamma')
    ];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={1} failedSongs={failed} lang="en" />
    );

    expect(getByText('Song Alpha')).toBeInTheDocument();
    expect(getByText('Song Beta')).toBeInTheDocument();
    expect(getByText('Song Gamma')).toBeInTheDocument();
  });

  it('rounds percentage correctly', async () => {
    const failed = [makeSong('s1', 'Song A')];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={2} failedSongs={failed} lang="en" />
    );

    // 2/3 = 66.666... -> 67%
    expect(getByText('2/3 (67%) correct')).toBeInTheDocument();
  });

  it('shows 0% when all songs failed', async () => {
    const failed = [makeSong('s1', 'Song A'), makeSong('s2', 'Song B')];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={0} failedSongs={failed} lang="en" />
    );

    expect(getByText('0/2 (0%) correct')).toBeInTheDocument();
  });

  it('uses Japanese name when lang is ja', async () => {
    const failed = [
      {
        ...makeSong('s1', '桜の歌'),
        englishName: 'Sakura Song'
      } as Song
    ];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={1} failedSongs={failed} lang="ja" />
    );

    expect(getByText('桜の歌')).toBeInTheDocument();
  });

  it('uses English name when lang is en', async () => {
    const failed = [
      {
        ...makeSong('s1', '桜の歌'),
        englishName: 'Sakura Song'
      } as Song
    ];
    const [{ getByText }] = await render(
      <HeardleStats correctCount={1} failedSongs={failed} lang="en" />
    );

    expect(getByText('Sakura Song')).toBeInTheDocument();
  });
});
