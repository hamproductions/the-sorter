import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps hooks that share a key in sync', () => {
    const first = renderHook(() => useLocalStorage<number>('shared', 0));
    const second = renderHook(() => useLocalStorage<number>('shared', 0));

    act(() => {
      first.result.current[1](5);
    });

    expect(second.result.current[0]).toBe(5);
    expect(JSON.parse(localStorage.getItem('shared') ?? 'null')).toBe(5);
  });

  it('reads and writes the new key after the key changes', () => {
    localStorage.setItem('songs-sort-state', JSON.stringify('normal session'));
    localStorage.setItem('perf-songs-sort-state', JSON.stringify('performance session'));
    const { result, rerender } = renderHook(({ key }) => useLocalStorage<string>(key), {
      initialProps: { key: 'songs-sort-state' }
    });
    expect(result.current[0]).toBe('normal session');

    rerender({ key: 'perf-songs-sort-state' });
    expect(result.current[0]).toBe('performance session');

    act(() => {
      result.current[1]('updated performance session');
    });
    expect(JSON.parse(localStorage.getItem('perf-songs-sort-state') ?? 'null')).toBe(
      'updated performance session'
    );
    expect(JSON.parse(localStorage.getItem('songs-sort-state') ?? 'null')).toBe('normal session');
  });
});
