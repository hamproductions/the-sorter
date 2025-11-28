export async function detectSoundStart(
  audioUrl: string,
  soundThreshold: number = 0.01
): Promise<number | null> {
  let audioContext: AudioContext | undefined;

  try {
    audioContext = new window.AudioContext();

    console.log(audioUrl);
    const response: Response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer: ArrayBuffer = await response.arrayBuffer();

    const audioBuffer: AudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const audioData: Float32Array = audioBuffer.getChannelData(0);
    const sampleRate: number = audioBuffer.sampleRate;

    let firstSoundIndex: number = -1;

    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > soundThreshold) {
        firstSoundIndex = i;
        break;
      }
    }

    if (firstSoundIndex !== -1) {
      const silenceEnd: number = firstSoundIndex / sampleRate;
      return silenceEnd;
    } else {
      return null;
    }
  } catch (err) {
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
    }
    if (err instanceof Error) {
      throw new Error('Failed to analyze audio: ' + err.message);
    }
    return null;
  }
}
