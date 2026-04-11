/**
 * Convert any browser-captured audio blob to a 24kHz mono 16-bit PCM WAV.
 *
 * Why 24kHz instead of 16kHz: children's voices have higher fundamental
 * frequencies (250–400Hz) and the formants that distinguish similar consonants
 * ("th" vs "f", "s" vs "sh") live in the 4–8kHz range. At 16kHz the Nyquist
 * limit is 8kHz — right at the edge. Bumping to 24kHz gives a 12kHz Nyquist,
 * which captures the higher formants that help Chirp 2 distinguish consonant
 * clusters more accurately.
 *
 * IMPORTANT: When changing sampleRate here, also update these constants:
 *   - googleSTTService.ts: BYTES_PER_SECOND = sampleRate * 2
 *   - pitchAnalysisService.ts: SAMPLE_RATE = sampleRate
 *   - behaviorDetectionService.ts: SAMPLE_RATE = sampleRate
 */
export async function convertToWav(blob: Blob): Promise<Blob> {
  const sampleRate = 24000;
  const audioContext = new AudioContext({ sampleRate });
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const numSamples = audioBuffer.length;
  const monoData = audioBuffer.getChannelData(0);

  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, monoData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  await audioContext.close();
  return new Blob([wavBuffer], { type: "audio/wav" });
}