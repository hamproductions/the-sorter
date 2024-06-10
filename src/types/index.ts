import type characterData from '../../data/character-info.json';

export type Character = (typeof characterData)[0];

export type WithRank<T> = T & { rank: number };
