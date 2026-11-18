import { compressToUint8Array, decompressFromUint8Array } from 'lz-string';
import type { SortState } from './sort';
import type { SavedSortState } from '~/types/save-state';

type ItemId = string | number;
type Groups = ItemId[][];

const FORMAT_VERSION = 3;
const CHOICE_ALPHABET = ['L', 'R', 'T'];
const GROUP_KEYS = ['arr', 'ties', 'preservedOrder'] as const;
const MERGE_GROUP_KEYS = ['leftArr', 'rightArr'] as const;
const ID_MODE = { raw: 0, dictionary: 1, strings: 2 } as const;
const DIGITS = /^(0|[1-9]\d{0,8})$/;

class BitWriter {
  private bytes: number[] = [];
  private current = 0;
  private filled = 0;

  write(value: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      this.current = (this.current << 1) | (Math.floor(value / 2 ** i) & 1);
      if (++this.filled === 8) {
        this.bytes.push(this.current);
        this.current = 0;
        this.filled = 0;
      }
    }
  }

  gamma(value: number) {
    const bits = Math.floor(Math.log2(value)) + 1;
    this.write(0, bits - 1);
    this.write(value, bits);
  }

  finish() {
    if (this.filled > 0) this.bytes.push(this.current << (8 - this.filled));
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private position = 0;

  constructor(private bytes: Uint8Array) {}

  read(bits: number) {
    let value = 0;
    for (let i = 0; i < bits; i++) {
      const byte = this.bytes[this.position >> 3];
      if (byte === undefined) throw new RangeError('truncated');
      value = value * 2 + ((byte >> (7 - (this.position & 7))) & 1);
      this.position++;
    }
    return value;
  }

  gamma() {
    let zeros = 0;
    while (this.read(1) === 0) {
      if (++zeros > 40) throw new RangeError('invalid');
    }
    return 2 ** zeros + this.read(zeros);
  }
}

const bitsFor = (max: number) => Math.max(1, Math.ceil(Math.log2(max + 1)));

interface Lists {
  groups: (Groups | undefined)[];
  initialOrder?: ItemId[];
  choices?: string;
}

const collectLists = (save: SavedSortState): Lists => ({
  groups: [
    ...GROUP_KEYS.map((key) => save.state[key]),
    ...MERGE_GROUP_KEYS.map((key) => save.state.mergeState?.[key])
  ],
  initialOrder: save.log?.initialOrder,
  choices: save.log?.choices
});

const stripLists = (save: SavedSortState) => {
  const { arr: _arr, ties: _ties, preservedOrder: _preserved, mergeState, ...state } = save.state;
  const { leftArr: _left, rightArr: _right, ...merge } = mergeState ?? {};
  const { initialOrder: _order, choices: _choices, ...log } = save.log ?? {};
  return {
    ...save,
    history: undefined,
    state: { ...state, mergeState: mergeState ? merge : undefined },
    log: save.log ? log : undefined
  };
};

const restoreLists = (meta: ReturnType<typeof stripLists>, lists: Lists): SavedSortState => {
  const [arr, ties, preservedOrder, leftArr, rightArr] = lists.groups;
  const state = {
    ...meta.state,
    arr: arr ?? [],
    ...(ties ? { ties } : {}),
    ...(preservedOrder ? { preservedOrder } : {}),
    mergeState: meta.state.mergeState
      ? {
          ...meta.state.mergeState,
          ...(leftArr ? { leftArr } : {}),
          ...(rightArr ? { rightArr } : {})
        }
      : undefined
  } as SortState<ItemId>;
  return {
    ...meta,
    history: [],
    state,
    log: meta.log
      ? {
          ...meta.log,
          initialOrder: lists.initialOrder ?? [],
          choices: lists.choices ?? ''
        }
      : undefined
  } as SavedSortState;
};

const allIds = (lists: Lists[]) =>
  lists.flatMap((l) => [...l.groups.flatMap((g) => g?.flat() ?? []), ...(l.initialOrder ?? [])]);

const chooseIdCodec = (ids: ItemId[]) => {
  const numeric =
    ids.every((id) => typeof id === 'number' && Number.isInteger(id) && id >= 0 && id < 2 ** 30) ||
    ids.every((id) => typeof id === 'string' && DIGITS.test(id));
  if (!numeric) {
    const dictionary = [...new Set(ids)];
    return { mode: ID_MODE.strings, dictionary, width: bitsFor(dictionary.length - 1) };
  }
  const values = [...new Set(ids.map(Number))].sort((a, b) => a - b);
  const rawWidth = bitsFor(values.at(-1) ?? 0);
  const dictionaryWidth = bitsFor(values.length - 1);
  const dictionaryCost = values.reduce(
    (cost, value, i) => cost + 2 * Math.floor(Math.log2(value - (values[i - 1] ?? -1))) + 1,
    0
  );
  const useDictionary = dictionaryCost + ids.length * dictionaryWidth < ids.length * rawWidth;
  return {
    mode: useDictionary ? ID_MODE.dictionary : ID_MODE.raw,
    dictionary: useDictionary ? values : [],
    width: useDictionary ? dictionaryWidth : rawWidth,
    asNumbers: typeof ids[0] === 'number'
  };
};

export const encodeSavesBinary = (saves: SavedSortState[]) => {
  const lists = saves.map(collectLists);
  const ids = allIds(lists);
  const codec = chooseIdCodec(ids);
  const index = new Map<ItemId, number>(
    codec.mode === ID_MODE.raw ? [] : codec.dictionary.map((id, i) => [id, i])
  );
  const toCode = (id: ItemId) =>
    codec.mode === ID_MODE.raw
      ? Number(id)
      : (index.get(codec.mode === ID_MODE.dictionary ? Number(id) : id) ?? 0);
  const choicesPackable = lists.every((l) =>
    [...(l.choices ?? '')].every((c) => CHOICE_ALPHABET.includes(c))
  );
  const meta = {
    saves: saves.map((save, i) =>
      choicesPackable ? stripLists(save) : { ...stripLists(save), choices: lists[i].choices }
    ),
    ids: codec.mode === ID_MODE.strings ? codec.dictionary : undefined,
    asNumbers: codec.asNumbers
  };
  const metaBytes = compressToUint8Array(JSON.stringify(meta));

  const writer = new BitWriter();
  writer.write(FORMAT_VERSION, 8);
  writer.gamma(metaBytes.length + 1);
  metaBytes.forEach((byte) => writer.write(byte, 8));
  writer.write(codec.mode, 2);
  writer.gamma(codec.width);
  if (codec.mode === ID_MODE.dictionary) {
    writer.gamma(codec.dictionary.length + 1);
    codec.dictionary.forEach((value, i) =>
      writer.gamma((value as number) - ((codec.dictionary[i - 1] as number | undefined) ?? -1))
    );
  }
  const writeIds = (list: ItemId[]) => {
    writer.gamma(list.length + 1);
    list.forEach((id) => writer.write(toCode(id), codec.width));
  };
  writer.write(choicesPackable ? 1 : 0, 1);
  for (const { groups, initialOrder, choices } of lists) {
    for (const group of groups) {
      writer.write(group ? 1 : 0, 1);
      if (!group) continue;
      writer.gamma(group.length + 1);
      for (const items of group) {
        if (items.length === 1) {
          writer.write(1, 1);
        } else {
          writer.write(0, 1);
          writer.gamma(items.length + 1);
        }
        items.forEach((id) => writer.write(toCode(id), codec.width));
      }
    }
    writer.write(initialOrder ? 1 : 0, 1);
    if (initialOrder) writeIds(initialOrder);
    if (choicesPackable) {
      writer.gamma((choices?.length ?? 0) + 1);
      [...(choices ?? '')].forEach((c) => writer.write(CHOICE_ALPHABET.indexOf(c), 2));
    }
  }
  return writer.finish();
};

export const decodeSavesBinary = (bytes: Uint8Array): SavedSortState[] | null => {
  try {
    const reader = new BitReader(bytes);
    if (reader.read(8) !== FORMAT_VERSION) return null;
    const metaBytes = Uint8Array.from({ length: reader.gamma() - 1 }, () => reader.read(8));
    const meta = JSON.parse(decompressFromUint8Array(metaBytes) ?? '') as {
      saves: (ReturnType<typeof stripLists> & { choices?: string })[];
      ids?: ItemId[];
      asNumbers?: boolean;
    };
    const mode = reader.read(2);
    const width = reader.gamma();
    let dictionary: ItemId[] = meta.ids ?? [];
    if (mode === ID_MODE.dictionary) {
      let previous = -1;
      dictionary = Array.from({ length: reader.gamma() - 1 }, () => (previous += reader.gamma()));
    }
    const toId = (code: number): ItemId => {
      const value = mode === ID_MODE.raw ? code : dictionary[code];
      if (value === undefined) throw new RangeError('invalid id');
      return mode === ID_MODE.strings || meta.asNumbers ? value : String(value);
    };
    const readIds = () =>
      Array.from({ length: reader.gamma() - 1 }, () => toId(reader.read(width)));
    const choicesPacked = reader.read(1) === 1;
    return meta.saves.map((save) => {
      const groups = [...GROUP_KEYS, ...MERGE_GROUP_KEYS].map(() => {
        if (reader.read(1) === 0) return undefined;
        return Array.from({ length: reader.gamma() - 1 }, () => {
          const size = reader.read(1) === 1 ? 1 : reader.gamma() - 1;
          return Array.from({ length: size }, () => toId(reader.read(width)));
        });
      });
      const initialOrder = reader.read(1) === 1 ? readIds() : undefined;
      const choices = choicesPacked
        ? Array.from({ length: reader.gamma() - 1 }, () => CHOICE_ALPHABET[reader.read(2)]).join('')
        : save.choices;
      const { choices: _choices, ...rest } = save;
      return restoreLists(rest, { groups, initialOrder, choices });
    });
  } catch {
    return null;
  }
};
