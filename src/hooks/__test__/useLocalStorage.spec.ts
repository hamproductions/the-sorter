import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isStoragePersisted, useLocalStorage, useStorageFailure } from '../useLocalStorage';

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

  it('keeps quota-failed changes in this tab without replacing persisted data', () => {
    localStorage.setItem('quota-session', JSON.stringify('persisted'));
    const first = renderHook(() => useLocalStorage<string>('quota-session'));
    const second = renderHook(() => useLocalStorage<string>('quota-session'));
    const status = renderHook(() => useStorageFailure());
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    act(() => first.result.current[1]('recent changes'));

    expect(first.result.current[0]).toBe('recent changes');
    expect(second.result.current[0]).toBe('recent changes');
    expect(localStorage.getItem('quota-session')).toBe(JSON.stringify('persisted'));
    expect(isStoragePersisted('quota-session')).toBe(false);
    expect(status.result.current).toBe(true);

    const remounted = renderHook(() => useLocalStorage<string>('quota-session'));
    expect(remounted.result.current[0]).toBe('recent changes');

    write.mockRestore();
    act(() => first.result.current[1]('recovered'));
    expect(localStorage.getItem('quota-session')).toBe(JSON.stringify('recovered'));
    expect(status.result.current).toBe(false);
  });

  it('does not rewrite saved values when mounting', () => {
    localStorage.setItem('existing', JSON.stringify('persisted'));
    const write = vi.spyOn(localStorage, 'setItem');
    write.mockClear();
    const { result } = renderHook(() => useLocalStorage<string>('existing'));
    expect(result.current[0]).toBe('persisted');
    expect(write).not.toHaveBeenCalled();
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
