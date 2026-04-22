import { describe, expect, it } from 'vitest';
import songInfo from '../../../data/song-info.json';
import artistsInfo from '../../../data/artists-info.json';
import seriesInfo from '../../../data/series-info.json';

const validSeriesIds = new Set(seriesInfo.map((s) => Number(s.id)));
const artistIds = new Set(artistsInfo.map((a) => a.id));

describe('Song Data Integrity', () => {
  it('has no duplicate song ids', () => {
    const ids = songInfo.map((s) => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('every song has required fields', () => {
    for (const song of songInfo) {
      expect(song.id, `song missing id`).toBeTruthy();
      expect(song.name, `song ${song.id} missing name`).toBeTruthy();
      expect(song.seriesIds, `song ${song.id} missing seriesIds`).toBeInstanceOf(Array);
      expect(song.seriesIds.length, `song ${song.id} has empty seriesIds`).toBeGreaterThan(0);
      expect(song.artists, `song ${song.id} missing artists`).toBeInstanceOf(Array);
      expect(song.artists.length, `song ${song.id} has no artists`).toBeGreaterThan(0);
    }
  });

  it('every song references valid series', () => {
    const invalid: string[] = [];
    for (const song of songInfo) {
      for (const sid of song.seriesIds) {
        if (!validSeriesIds.has(sid)) {
          invalid.push(`song ${song.id} (${song.name}) has invalid seriesId ${sid}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every song references valid artists', () => {
    const invalid: string[] = [];
    for (const song of songInfo) {
      for (const artist of song.artists) {
        if (!artistIds.has(artist.id)) {
          invalid.push(`song ${song.id} (${song.name}) has invalid artistId ${artist.id}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('no duplicate song names within same series', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const song of songInfo) {
      const key = `${song.name}|${song.seriesIds.sort().join(',')}`;
      if (seen.has(key)) {
        dupes.push(`"${song.name}" duplicated: ids ${seen.get(key)} and ${song.id}`);
      }
      seen.set(key, song.id);
    }
    expect(dupes).toEqual([]);
  });

  it('wikiAudioUrl is valid URL when present', () => {
    const invalid: string[] = [];
    for (const song of songInfo) {
      const url = (song as any).wikiAudioUrl;
      if (url && typeof url === 'string') {
        try {
          new URL(url);
        } catch {
          invalid.push(`song ${song.id} (${song.name}) has invalid wikiAudioUrl: ${url}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('releasedOn is valid date format when present', () => {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const invalid: string[] = [];
    for (const song of songInfo) {
      if (song.releasedOn && !dateRe.test(song.releasedOn)) {
        invalid.push(`song ${song.id} (${song.name}) bad date: ${song.releasedOn}`);
      }
    }
    expect(invalid).toEqual([]);
  });
});

describe('Artist Data Integrity', () => {
  it('has no duplicate artist ids', () => {
    const ids = artistsInfo.map((a) => a.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('every artist has required fields', () => {
    for (const artist of artistsInfo) {
      expect(artist.id, 'artist missing id').toBeTruthy();
      expect(artist.name, `artist ${artist.id} missing name`).toBeTruthy();
      expect(artist.seriesIds, `artist ${artist.id} missing seriesIds`).toBeInstanceOf(Array);
    }
  });

  it('every artist references valid series', () => {
    const invalid: string[] = [];
    for (const artist of artistsInfo) {
      for (const sid of artist.seriesIds) {
        if (!validSeriesIds.has(sid)) {
          invalid.push(`artist ${artist.id} (${artist.name}) has invalid seriesId ${sid}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every song artist exists in artists-info', () => {
    const missing: string[] = [];
    for (const song of songInfo) {
      for (const a of song.artists) {
        if (!artistIds.has(a.id)) {
          missing.push(`song ${song.id} references missing artist ${a.id}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('Heardle Audio Coverage', () => {
  const songsWithAudio = songInfo.filter((s) => (s as any).wikiAudioUrl);
  const songsWithoutAudio = songInfo.filter((s) => !(s as any).wikiAudioUrl);

  it('reports audio coverage stats', () => {
    const coverage = (songsWithAudio.length / songInfo.length) * 100;
    console.log(`Audio coverage: ${songsWithAudio.length}/${songInfo.length} (${coverage.toFixed(1)}%)`);
    console.log(`Missing audio: ${songsWithoutAudio.length} songs`);
    expect(coverage).toBeGreaterThan(90);
  });

  it('lists songs missing wikiAudioUrl', () => {
    if (songsWithoutAudio.length > 0) {
      console.log('Songs without audio:');
      for (const s of songsWithoutAudio) {
        console.log(`  [${s.id}] ${s.name} (series: ${s.seriesIds.join(',')})`);
      }
    }
    expect(songsWithoutAudio.length).toBeLessThan(50);
  });

  for (const series of seriesInfo) {
    const sid = Number(series.id);
    const seriesSongs = songInfo.filter((s) => s.seriesIds.includes(sid) && s.seriesIds.length === 1);
    const withAudio = seriesSongs.filter((s) => (s as any).wikiAudioUrl);

    it(`series "${series.name}" audio coverage`, () => {
      if (seriesSongs.length === 0) return;
      const pct = (withAudio.length / seriesSongs.length) * 100;
      console.log(`  ${series.name}: ${withAudio.length}/${seriesSongs.length} (${pct.toFixed(1)}%)`);
      expect(pct).toBeGreaterThan(50);
    });
  }
});
