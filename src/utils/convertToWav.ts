export async function convertToWav(blob: Blob): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const arrayBuffer = await blob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // Downmix to mono
  const numSamples = audioBuffer.length
  const sampleRate = 48000  
  const monoData = audioBuffer.getChannelData(0)

  // Build WAV file
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(wavBuffer)

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true) // subchunk1 size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, "data")
  view.setUint32(40, numSamples * 2, true)

  // Write PCM samples
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, monoData[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  await audioContext.close()
  return new Blob([wavBuffer], { type: "audio/wav" })
}