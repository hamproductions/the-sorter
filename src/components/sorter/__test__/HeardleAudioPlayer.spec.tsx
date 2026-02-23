import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render } from '../../../__test__/utils';
import { HeardleAudioPlayer } from '../HeardleAudioPlayer';
import { setupAudioElement } from '../../../__test__/utils/audio';

/**
 * Find the clickable progress bar element. styled-system uses class-based
 * styles, so we locate it by structure: the Box that has an onClick handler
 * and wraps the progress fill and the audio element is its sibling.
 */
function getProgressBar(container: HTMLElement): HTMLElement {
  // The progress bar is the element with role-less click handler and
  // overflow="hidden". We find it by looking for the inner progress fill
  // (the Box with transition style) and getting its parent.
  const fills = container.querySelectorAll('[style*="width"]');
  for (const fill of fills) {
    const parent = fill.parentElement;
    if (parent && parent !== container) {
      return parent;
    }
  }
  throw new Error('Progress bar not found');
}

describe('HeardleAudioPlayer', () => {
  beforeEach(() => {
    // Stub HTMLMediaElement methods that jsdom doesn't implement.
    // The component's useEffect calls pause() on mount, so these must exist
    // before any render.
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('shows "Loading audio..." when blobUrl is null', async () => {
    const [{ getByText }] = await render(<HeardleAudioPlayer blobUrl={null} maxDuration={5} />);

    expect(getByText('Loading audio...')).toBeInTheDocument();
  });

  it('renders play button and time display when blobUrl provided', async () => {
    const [{ getByLabelText, getByText }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    expect(getByLabelText('Play')).toBeInTheDocument();
    expect(getByText('0:00 / 0:00')).toBeInTheDocument();
  });

  it('clicking Play calls audio.play() and changes aria-label to Pause', async () => {
    const [{ container, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { playSpy } = setupAudioElement(audio, 30);

    await user.click(getByLabelText('Play'));

    expect(playSpy).toHaveBeenCalled();
    expect(getByLabelText('Pause')).toBeInTheDocument();
  });

  it('clicking Pause calls audio.pause() and reverts aria-label to Play', async () => {
    const [{ container, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { pauseSpy } = setupAudioElement(audio, 30);

    // Play first
    await user.click(getByLabelText('Play'));
    // Then pause
    await user.click(getByLabelText('Pause'));

    expect(pauseSpy).toHaveBeenCalled();
    expect(getByLabelText('Play')).toBeInTheDocument();
  });

  it('displays effectiveDuration after loadedmetadata', async () => {
    const [{ container, getByText }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // effectiveDuration = min(30, 5) = 5
    expect(getByText('0:00 / 0:05')).toBeInTheDocument();
  });

  it('updates current time display on timeupdate', async () => {
    const [{ container, getByText }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Simulate time update to 3 seconds
    (audio as any).currentTime = 3;
    fireEvent.timeUpdate(audio);

    expect(getByText('0:03 / 0:05')).toBeInTheDocument();
  });

  it('pauses playback and caps time when currentTime >= maxDuration', async () => {
    const [{ container, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { pauseSpy } = setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Start playing
    await user.click(getByLabelText('Play'));

    // Simulate exceeding max duration
    (audio as any).currentTime = 5;
    fireEvent.timeUpdate(audio);

    // When exceeding max duration, playback should pause
    expect(pauseSpy).toHaveBeenCalled();
    expect(getByLabelText('Play')).toBeInTheDocument();
  });

  it('resets to 0 before replaying when at maxDuration', async () => {
    const [{ container, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { playSpy } = setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Start and reach max duration
    await user.click(getByLabelText('Play'));
    (audio as any).currentTime = 5;
    fireEvent.timeUpdate(audio);

    // Now click play again — should reset to 0
    await user.click(getByLabelText('Play'));

    expect((audio as any).currentTime).toBe(0);
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('seeking via progress bar seeks to proportional position', async () => {
    const [{ container }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    const progressBar = getProgressBar(container);

    vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 100,
      top: 0,
      right: 100,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    // Click at 60% (60px out of 100px) — 60% of effectiveDuration(5) = 3
    fireEvent.click(progressBar, { clientX: 60 });

    expect((audio as any).currentTime).toBe(3);
  });

  it('seeking clamps to maxDuration', async () => {
    const [{ container }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    const progressBar = getProgressBar(container);

    vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 100,
      top: 0,
      right: 100,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    // Click at 120% (beyond max) — should clamp to maxDuration (5)
    fireEvent.click(progressBar, { clientX: 120 });

    expect((audio as any).currentTime).toBe(5);
  });

  it('resets playback when blobUrl changes', async () => {
    const [{ container, rerender, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { pauseSpy } = setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Start playing
    await user.click(getByLabelText('Play'));

    // Rerender with new blobUrl
    rerender(<HeardleAudioPlayer blobUrl="blob:test/2" maxDuration={5} />);

    expect(pauseSpy).toHaveBeenCalled();
    expect(getByLabelText('Play')).toBeInTheDocument();
  });

  it('resets playback when maxDuration changes', async () => {
    const [{ container, rerender, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={5} />
    );

    const audio = container.querySelector('audio')!;
    const { pauseSpy } = setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Start playing
    await user.click(getByLabelText('Play'));

    // Rerender with new maxDuration
    rerender(<HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={10} />);

    expect(pauseSpy).toHaveBeenCalled();
    expect(getByLabelText('Play')).toBeInTheDocument();
  });

  it('with startTime, resets to startTime and shows adjusted time display', async () => {
    const [{ container, getByText }] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={3} startTime={2} />
    );

    const audio = container.querySelector('audio')!;
    setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // effectiveDuration = min(30 - 2, 3) = 3
    // Displayed elapsed = currentTime(2) - startTime(2) = 0
    expect(getByText('0:00 / 0:03')).toBeInTheDocument();
  });

  it('with startTime, caps playback at startTime + maxDuration', async () => {
    const [{ container, getByLabelText }, user] = await render(
      <HeardleAudioPlayer blobUrl="blob:test/1" maxDuration={3} startTime={2} />
    );

    const audio = container.querySelector('audio')!;
    const { pauseSpy } = setupAudioElement(audio, 30);

    fireEvent.loadedMetadata(audio);

    // Start playing
    await user.click(getByLabelText('Play'));

    // Simulate reaching startTime + maxDuration = 5
    (audio as any).currentTime = 5;
    fireEvent.timeUpdate(audio);

    expect(pauseSpy).toHaveBeenCalled();
    expect(getByLabelText('Play')).toBeInTheDocument();
    expect((audio as any).currentTime).toBe(5);
  });
});
