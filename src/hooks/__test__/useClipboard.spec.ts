import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboard } from '../useClipboard';

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock('~/context/ToasterContext', () => ({ useToaster: () => ({ toast }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('useClipboard', () => {
  beforeEach(() => {
    toast.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports denied text writes without claiming success or rejecting', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')) }
    });
    const { result } = renderHook(() => useClipboard());
    await expect(result.current.copyText('ranking')).resolves.toBeUndefined();
    expect(toast).toHaveBeenCalledExactlyOnceWith({
      type: 'error',
      description: 'setlistPrediction.failedToCopy'
    });
  });

  it('starts async text writes before URL serialization settles', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { write } });
    const data: Record<string, Promise<Blob>>[] = [];
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(item: Record<string, Promise<Blob>>) {
          data.push(item);
        }
      }
    );
    let finish!: (text: string) => void;
    const text = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const { result } = renderHook(() => useClipboard());
    const copying = result.current.copyText(text, 'toast.url_copied');
    expect(write).toHaveBeenCalledOnce();
    finish('https://example.com/share');
    await copying;
    expect((await data[0]['text/plain']).type).toBe('text/plain');
    expect(toast).toHaveBeenCalledWith({ description: 'toast.url_copied' });
  });

  it('starts the image write before rendering finishes', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { write } });
    const items: Record<string, Promise<Blob>>[] = [];
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(data: Record<string, Promise<Blob>>) {
          items.push(data);
        }
      }
    );
    let finish!: (blob: Blob) => void;
    const image = new Promise<Blob>((resolve) => {
      finish = resolve;
    });
    const { result } = renderHook(() => useClipboard());
    const copying = result.current.copyImage(() => image);
    expect(write).toHaveBeenCalledOnce();
    const blob = new Blob(['png'], { type: 'image/png' });
    finish(blob);
    await copying;
    await expect(items[0]['image/png']).resolves.toBe(blob);
    expect(toast).toHaveBeenCalledWith({ description: 'toast.screenshot_copied' });
  });

  it('handles unsupported image clipboard without starting a render', async () => {
    vi.stubGlobal('navigator', {});
    const render = vi.fn();
    const { result } = renderHook(() => useClipboard());
    await result.current.copyImage(render);
    expect(render).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith({
      type: 'error',
      description: 'setlistPrediction.failedToCopy'
    });
  });

  it('shares a prepared image only after a fresh explicit click', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: () => true });
    const { result } = renderHook(() => useClipboard());
    const image = new Blob(['png'], { type: 'image/png' });
    await result.current.copyImage(() => Promise.resolve(image), true);
    expect(share).not.toHaveBeenCalled();
    const ready = toast.mock.calls[0][0];
    expect(ready.description.props.children).toBe('results.share');
    ready.description.props.onClick();
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files[0].type).toBe('image/png');
  });

  it.each([false, true])(
    'offers native sharing with both APIs after copy denied=%s',
    async (denied) => {
      const write = denied
        ? vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'))
        : vi.fn().mockResolvedValue(undefined);
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { write }, share, canShare: () => true });
      vi.stubGlobal(
        'ClipboardItem',
        class {
          constructor(public data: Record<string, Promise<Blob>>) {}
        }
      );
      let finish!: (blob: Blob) => void;
      const image = new Promise<Blob>((resolve) => {
        finish = resolve;
      });
      const makeImage = vi.fn(() => image);
      const { result } = renderHook(() => useClipboard());
      const copying = result.current.copyImage(makeImage, true);
      expect(write).toHaveBeenCalledOnce();
      expect(makeImage).toHaveBeenCalledOnce();
      finish(new Blob(['png'], { type: 'image/png' }));
      await copying;
      expect(share).not.toHaveBeenCalled();
      const ready = toast.mock.calls.find(([options]) => options.description?.props);
      expect(ready).toBeDefined();
      await ready![0].description.props.onClick();
      expect(share).toHaveBeenCalledOnce();
      expect(makeImage).toHaveBeenCalledOnce();
    }
  );

  it('handles failed rendering through the clipboard promise', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        write: vi.fn((items: { data: Record<string, Promise<Blob>> }[]) =>
          items[0].data['image/png'].then(() => undefined)
        )
      }
    });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public data: Record<string, Promise<Blob>>) {}
      }
    );
    const { result } = renderHook(() => useClipboard());
    await expect(
      result.current.copyImage(() => Promise.reject(new Error('render failed')))
    ).resolves.toBeUndefined();
    expect(toast).toHaveBeenCalledExactlyOnceWith({
      type: 'error',
      description: 'setlistPrediction.failedToCopy'
    });
  });
});
