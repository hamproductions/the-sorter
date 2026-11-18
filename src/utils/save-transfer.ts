import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { getSortItems, isSortState, type SortState } from './sort';
import { getAllCommaSeparated, getSongPerformanceParams } from './share';
import { decodeSavesBinary, encodeSavesBinary } from './save-qr-codec';
import {
  createSavedSortState,
  getSortSaveIdentity,
  hashString,
  toSavedSortStates
} from './save-state';
import type { SavedSortState, SorterType } from '~/types/save-state';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import type { SongFilterType } from '~/components/sorter/SongFilters';

export const SAVE_CODE_PREFIX = 'LLSORT1:';
export const SAVE_FILE_FORMAT = 'the-sorter-saves';
const QR_PREFIX = 'LLSQR3';
export const QR_CHUNK_SIZE = 1100;

interface SaveTransferPayload {
  format: typeof SAVE_FILE_FORMAT;
  version: 1;
  saves: SavedSortState[];
}

const toPortablePerformanceMeta = (meta: PerformanceSortMeta | undefined) => {
  if (!meta || !(meta.performanceIds?.length || meta.performanceId)) return meta;
  const { contextVersion: _contextVersion, ...rest } = meta;
  return { ...rest, setlistOrder: [] };
};

const toPortableSave = (save: SavedSortState, includeHistory: boolean): SavedSortState => {
  const { ticket: _ticket, ticketRequested: _ticketRequested, ...log } = save.log ?? {};
  if (includeHistory)
    return { ...save, log: save.log ? (log as SavedSortState['log']) : undefined };
  return {
    ...save,
    history: [],
    performanceMeta: toPortablePerformanceMeta(save.performanceMeta),
    log: save.log && !save.isCompleted ? (log as SavedSortState['log']) : undefined
  };
};

const toPayload = (saves: SavedSortState[], includeHistory: boolean): SaveTransferPayload => ({
  format: SAVE_FILE_FORMAT,
  version: 1,
  saves: saves.map((save) => toPortableSave(save, includeHistory))
});

export const encodeSaveCode = (saves: SavedSortState[]) =>
  `${SAVE_CODE_PREFIX}${compressToEncodedURIComponent(JSON.stringify(toPayload(saves, false)))}`;

export const encodeSaveFile = (saves: SavedSortState[]) => JSON.stringify(toPayload(saves, true));

const fromPayload = (value: unknown): SavedSortState[] | null => {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<SaveTransferPayload>;
  if (payload.format !== SAVE_FILE_FORMAT || !Array.isArray(payload.saves)) return null;
  const saves = toSavedSortStates(payload.saves).map((save) => ({
    ...save,
    history: save.history.filter(isSortState)
  }));
  return saves.length > 0 ? saves : null;
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const decodeSaveCode = (code: string) => {
  const trimmed = code.trim();
  if (!trimmed.startsWith(SAVE_CODE_PREFIX)) return null;
  const json = decompressFromEncodedURIComponent(trimmed.slice(SAVE_CODE_PREFIX.length));
  return json ? fromPayload(parseJson(json)) : null;
};

const BASE45_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export const encodeBase45 = (bytes: Uint8Array) => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const n = bytes[i] * 256 + bytes[i + 1];
      out +=
        BASE45_CHARSET[n % 45] +
        BASE45_CHARSET[Math.floor(n / 45) % 45] +
        BASE45_CHARSET[Math.floor(n / 2025)];
    } else {
      out += BASE45_CHARSET[bytes[i] % 45] + BASE45_CHARSET[Math.floor(bytes[i] / 45)];
    }
  }
  return out;
};

export const decodeBase45 = (text: string) => {
  const values = [...text].map((char) => BASE45_CHARSET.indexOf(char));
  if (values.includes(-1) || values.length % 3 === 1) return null;
  const bytes: number[] = [];
  for (let i = 0; i < values.length; i += 3) {
    if (i + 2 < values.length) {
      const n = values[i] + values[i + 1] * 45 + values[i + 2] * 2025;
      if (n > 0xffff) return null;
      bytes.push(n >> 8, n & 0xff);
    } else {
      const n = values[i] + values[i + 1] * 45;
      if (n > 0xff) return null;
      bytes.push(n);
    }
  }
  return new Uint8Array(bytes);
};

export const encodeSaveQrChunks = (saves: SavedSortState[], chunkSize = QR_CHUNK_SIZE) => {
  const data = encodeBase45(encodeSavesBinary(toPayload(saves, false).saves));
  const total = Math.max(1, Math.ceil(data.length / chunkSize));
  const id = hashString(data).toUpperCase();
  return Array.from(
    { length: total },
    (_, i) =>
      `${QR_PREFIX}/${id}/${i + 1}/${total}/${data.slice(i * chunkSize, (i + 1) * chunkSize)}`
  );
};

const decodeQrData = (data: string) => {
  const bytes = decodeBase45(data);
  const saves = bytes ? decodeSavesBinary(bytes) : null;
  return saves ? fromPayload({ format: SAVE_FILE_FORMAT, saves }) : null;
};

export type QrScanProgress =
  | { status: 'invalid' }
  | { status: 'progress'; received: number; total: number }
  | { status: 'done'; saves: SavedSortState[] | null };

export const createQrChunkCollector = () => {
  let setId: string | undefined;
  let parts: string[] = [];

  return (text: string): QrScanProgress => {
    if (text.trim().startsWith(SAVE_CODE_PREFIX)) {
      return { status: 'done', saves: decodeSaveCode(text) };
    }
    const match = /^LLSQR3\/([0-9A-Z]+)\/(\d+)\/(\d+)\/(.*)$/s.exec(text.replace(/^\s+/, ''));
    if (!match) return { status: 'invalid' };
    const [, id, indexText, totalText, data] = match;
    const index = Number(indexText);
    const total = Number(totalText);
    if (index < 1 || index > total) return { status: 'invalid' };
    if (id !== setId || parts.length !== total) {
      setId = id;
      parts = Array<string>(total).fill('');
    }
    parts[index - 1] = data;
    const received = parts.filter(Boolean).length;
    if (received < total) return { status: 'progress', received, total };
    const joined = parts.join('');
    if (hashString(joined).toUpperCase() !== id) {
      setId = undefined;
      parts = [];
      return { status: 'invalid' };
    }
    return { status: 'done', saves: decodeQrData(joined) };
  };
};

const toResults = (value: unknown): string[][] | null =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((group) => Array.isArray(group) && group.every((id) => typeof id === 'string'))
    ? (value as string[][])
    : null;

const getShareSorterType = (pathname: string): SorterType | null => {
  if (/\/songs\/share\/?$/.test(pathname)) return 'songs';
  if (/\/share\/?$/.test(pathname)) return 'characters';
  return null;
};

export const getSongFiltersFromParams = (params: URLSearchParams): SongFilterType => ({
  series: getAllCommaSeparated(params, 'series'),
  artists: getAllCommaSeparated(params, 'artists'),
  types: getAllCommaSeparated(params, 'types') as ('group' | 'solo' | 'unit')[],
  characters: getAllCommaSeparated(params, 'characters').map(Number),
  discographies: getAllCommaSeparated(params, 'discographies').map(Number),
  songs: getAllCommaSeparated(params, 'songs').map(Number),
  years: getAllCommaSeparated(params, 'years').map(Number)
});

export const createResultSave = ({
  sorterType,
  results,
  name,
  isSeiyuu,
  songFilters,
  performanceMeta,
  filterSummary
}: {
  sorterType: SorterType;
  results: string[][];
  name: string;
  isSeiyuu?: boolean;
  songFilters?: SongFilterType;
  performanceMeta?: PerformanceSortMeta;
  filterSummary?: string;
}) => {
  const state: SortState<string> = {
    arr: results.map((group) => [...group]),
    currentSize: results.length,
    leftStart: 0,
    status: 'end'
  };
  return createSavedSortState({
    name,
    sorterType,
    state,
    history: [],
    comparisonsCount: 0,
    itemCount: getSortItems(state).length,
    progress: 1,
    isSeiyuu,
    songFilters,
    performanceMeta,
    filterSummary
  });
};

export const parseSharedResultUrl = (
  text: string,
  nameFor: (sorterType: SorterType, itemCount: number) => string
) => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  const sorterType = getShareSorterType(url.pathname);
  const encoded = url.searchParams.get('data');
  if (!sorterType || !encoded) return null;
  const data = parseJson(decompressFromEncodedURIComponent(encoded) ?? '') as {
    results?: unknown;
    performanceMeta?: PerformanceSortMeta;
  } | null;
  const results = toResults(data?.results);
  if (!results) return null;
  const itemCount = new Set(results.flat()).size;
  if (sorterType === 'characters') {
    return createResultSave({
      sorterType,
      results,
      name: nameFor(sorterType, itemCount),
      isSeiyuu: url.searchParams.get('seiyuu') === 'true'
    });
  }
  return createResultSave({
    sorterType,
    results,
    name: nameFor(sorterType, itemCount),
    songFilters: getSongFiltersFromParams(url.searchParams),
    performanceMeta: data?.performanceMeta ?? getSongPerformanceParams(url.searchParams)?.meta
  });
};

export const parseSaveImport = (
  text: string,
  nameFor: (sorterType: SorterType, itemCount: number) => string
): SavedSortState[] | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fromCode = decodeSaveCode(trimmed);
  if (fromCode) return fromCode;
  const fromFile = fromPayload(parseJson(trimmed));
  if (fromFile) return fromFile;
  const fromUrl = parseSharedResultUrl(trimmed, nameFor);
  return fromUrl ? [fromUrl] : null;
};

export const mergeImportedSaves = (existing: SavedSortState[], imported: SavedSortState[]) => {
  const identities = new Set(existing.map(getSortSaveIdentity));
  const ids = new Set(existing.map((save) => save.id));
  const added = imported
    .filter((save) => {
      const identity = getSortSaveIdentity(save);
      if (identities.has(identity)) return false;
      identities.add(identity);
      return true;
    })
    .map((save) => (ids.has(save.id) ? { ...save, id: crypto.randomUUID() } : save));
  return { saves: [...added, ...existing], added };
};
