import { vi } from 'vitest';

/**
 * Mock URL.createObjectURL and URL.revokeObjectURL.
 * Returns a getter for the last created object URL.
 */
export function mockBlobUrls() {
  let lastUrl = '';
  let counter = 0;

  const createObjectURL = vi.fn((_blob: Blob) => {
    counter++;
    lastUrl = `blob:test/${counter}`;
    return lastUrl;
  });

  const revokeObjectURL = vi.fn();

  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL,
    revokeObjectURL
  });

  return { createObjectURL, revokeObjectURL, getLastUrl: () => lastUrl };
}

/**
 * Mock global fetch to return a successful audio blob response.
 */
export function mockFetchAudio(audioBlob?: Blob) {
  const blob = audioBlob ?? new Blob(['audio-data'], { type: 'audio/ogg' });

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(blob)
  });

  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

/**
 * Mock global fetch to return a network error.
 */
export function mockFetchError(message = 'Network error') {
  const mockFetch = vi.fn().mockRejectedValue(new Error(message));
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

/**
 * Set up spies on an HTMLAudioElement's play/pause methods and make
 * duration/currentTime writable via Object.defineProperty.
 */
export function setupAudioElement(el: HTMLAudioElement, duration = 30) {
  const playSpy = vi.fn().mockResolvedValue(undefined);
  const pauseSpy = vi.fn();

  el.play = playSpy;
  el.pause = pauseSpy;

  Object.defineProperty(el, 'duration', {
    writable: true,
    configurable: true,
    value: duration
  });

  Object.defineProperty(el, 'currentTime', {
    writable: true,
    configurable: true,
    value: 0
  });

  return { playSpy, pauseSpy };
}
