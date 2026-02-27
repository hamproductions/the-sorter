import { describe, it, expect } from 'vitest';
import { render } from '../../../__test__/utils';
import { HeardleStats } from '../HeardleStats';
import type { Song } from '~/types/songs';
import type { GuessResult } from '~/hooks/useHeardleState';

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
  it('renders nothing when no guess results', async () => {
    const [{ queryByText }] = await render(
      <HeardleStats guessResults={{}} songs={[]} lang="en" maxAttempts={5} />
    );

    expect(queryByText(/View Heardle Stats/)).not.toBeInTheDocument();
  });

  it('shows the stats button when there are results', async () => {
    const songs = [makeSong('s1', 'Song Alpha')];
    const guessResults: Record<string, GuessResult> = {
      s1: { attempts: 2, result: 'correct', guessHistory: ['wrong'] }
    };
    const [{ getByText }] = await render(
      <HeardleStats guessResults={guessResults} songs={songs} lang="en" maxAttempts={5} />
    );

    expect(getByText('View Heardle Stats')).toBeInTheDocument();
  });

  it('renders with failed results', async () => {
    const songs = [makeSong('s1', 'Song Alpha'), makeSong('s2', 'Song Beta')];
    const guessResults: Record<string, GuessResult> = {
      s1: { attempts: 2, result: 'correct', guessHistory: ['wrong'] },
      s2: {
        attempts: 5,
        result: 'failed',
        guessHistory: ['wrong', 'wrong', 'pass', 'wrong', 'wrong']
      }
    };
    const [{ getByText }] = await render(
      <HeardleStats guessResults={guessResults} songs={songs} lang="en" maxAttempts={5} />
    );

    expect(getByText('View Heardle Stats')).toBeInTheDocument();
  });

  it('renders with no-audio results', async () => {
    const songs = [makeSong('s1', 'Song Alpha')];
    const guessResults: Record<string, GuessResult> = {
      s1: { attempts: 0, result: 'no-audio', guessHistory: [] }
    };
    const [{ getByText }] = await render(
      <HeardleStats guessResults={guessResults} songs={songs} lang="en" maxAttempts={5} />
    );

    expect(getByText('View Heardle Stats')).toBeInTheDocument();
  });
});
