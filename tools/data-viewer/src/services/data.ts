import { join } from 'path';

const DATA_DIR = join(import.meta.dir, '../../../../data');

type DataRecord = Record<string, unknown> & { id?: string };
type DataFile = DataRecord[] | Record<string, unknown>;

const cache = new Map<string, { data: DataFile; mtime: number }>();

const DATA_FILES = [
  'character-info.json',
  'song-info.json',
  'artists-info.json',
  'discography-info.json',
  'performance-info.json',
  'units.json',
  'series-info.json',
  'series.json',
  'school.json',
  'hasu-songs.json'
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

export function getDataFiles(): readonly string[] {
  return DATA_FILES;
}

export async function loadData(filename: DataFileName): Promise<DataFile> {
  const path = join(DATA_DIR, filename);
  const file = Bun.file(path);
  const stat = await file.stat();

  const cached = cache.get(filename);
  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.data;
  }

  const data = await file.json();
  cache.set(filename, { data, mtime: stat.mtimeMs });
  return data;
}

export async function saveData(filename: DataFileName, data: DataFile): Promise<void> {
  const path = join(DATA_DIR, filename);
  await Bun.write(path, JSON.stringify(data));
  cache.delete(filename);
}

export async function updateRecord(
  filename: DataFileName,
  id: string,
  updates: Record<string, unknown>
): Promise<DataRecord | null> {
  const data = await loadData(filename);
  if (!Array.isArray(data)) return null;

  const index = data.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updated = { ...data[index], ...updates };
  data[index] = updated;
  await saveData(filename, data);
  return updated as DataRecord;
}

let lookupMaps: {
  artists: Map<string, string>;
  characters: Map<string, string>;
  series: Map<string, string>;
  discography: Map<string, string>;
  units: Map<string, string>;
} | null = null;

export async function buildLookups() {
  if (lookupMaps) return lookupMaps;

  const [artists, characters, seriesInfo, discography, units] = await Promise.all([
    loadData('artists-info.json') as Promise<DataRecord[]>,
    loadData('character-info.json') as Promise<DataRecord[]>,
    loadData('series-info.json') as Promise<DataRecord[]>,
    loadData('discography-info.json') as Promise<DataRecord[]>,
    loadData('units.json') as Promise<DataRecord[]>
  ]);

  lookupMaps = {
    artists: new Map(artists.map((a) => [a.id as string, (a.name || a.englishName) as string])),
    characters: new Map(
      characters.map((c) => [c.id as string, (c.englishName || c.fullName) as string])
    ),
    series: new Map(seriesInfo.map((s) => [s.id as string, s.name as string])),
    discography: new Map(discography.map((d) => [d.id as string, d.name as string])),
    units: new Map(units.map((u) => [u.id as string, (u.englishName || u.name) as string]))
  };

  return lookupMaps;
}

export function resolveLookup(
  type: keyof NonNullable<typeof lookupMaps>,
  id: string | number
): string {
  if (!lookupMaps) return String(id);
  return lookupMaps[type].get(String(id)) || String(id);
}

export function resolveField(
  fieldName: string,
  value: unknown
): { display: string; raw: unknown } | null {
  if (value === null || value === undefined) return null;

  if (fieldName === 'seriesIds' && Array.isArray(value)) {
    const names = value.map((id) => resolveLookup('series', id));
    return { display: names.join(', '), raw: value };
  }

  if (fieldName === 'discographyIds' && Array.isArray(value)) {
    const names = value.map((id) => resolveLookup('discography', id));
    return { display: names.join(', '), raw: value };
  }

  if (fieldName === 'characters' && Array.isArray(value)) {
    const names = value.filter(Boolean).map((id) => resolveLookup('characters', id));
    return { display: names.join(', '), raw: value };
  }

  if (fieldName === 'artists' && Array.isArray(value)) {
    const names = value.map((a) =>
      typeof a === 'object' && a && 'id' in a
        ? resolveLookup('artists', (a as { id: string }).id)
        : String(a)
    );
    return { display: names.join(', '), raw: value };
  }

  return null;
}
