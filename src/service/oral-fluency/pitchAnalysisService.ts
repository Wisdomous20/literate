import Pitchfinder from "pitchfinder"

export interface PitchAnalysis {
  pitchCoV:     number   // stdev / mean — key monotone signal
  meanF0:       number   // Hz
  voicedFrames: number   // frames where pitch was detected
  totalFrames:  number
  voicedRatio:  number   // voicedFrames / totalFrames
  error?:       string
}

// Below this CoV the reader is considered monotonous.
// Typical speech: 0.20–0.40  |  Monotone: < 0.12–0.15
export const MONOTONE_COV_THRESHOLD = 0.15

const SAMPLE_RATE = 16_000   // must match convertToWav() output
const FRAME_SIZE  = 2_048    // ~128ms window — good for speech F0
const HOP_SIZE    = 512      // 75% overlap
const MIN_F0      = 60       // Hz — below this is noise / creak
const MAX_F0      = 600      // Hz — above this is falsetto / noise

/**
 * Convert a WAV buffer (16kHz mono 16-bit PCM) to a Float32Array of samples.
 * Skips the standard 44-byte WAV header.
 */
function wavToFloat32(wavBuffer: Buffer): Float32Array {
  const PCM_OFFSET = 44
  const numSamples = (wavBuffer.length - PCM_OFFSET) / 2
  const signal     = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    signal[i] = wavBuffer.readInt16LE(PCM_OFFSET + i * 2) / 32_768
  }
  return signal
}

/**
 * Analyze pitch statistics from a WAV audio buffer using the YIN algorithm.
 *
 * Input must be a 16kHz mono 16-bit PCM WAV (the output of convertToWav()).
 */
export function analyzePitch(audioBuffer: Buffer): PitchAnalysis {
  try {
    const signal = wavToFloat32(audioBuffer)

    const detectPitch = Pitchfinder.YIN({
      sampleRate: SAMPLE_RATE,
      threshold:  0.10,   // lower = stricter voiced/unvoiced decision
    })

    const pitches: number[] = []
    let totalFrames = 0

    for (let i = 0; i + FRAME_SIZE <= signal.length; i += HOP_SIZE) {
      const frame = signal.slice(i, i + FRAME_SIZE)
      const pitch = detectPitch(frame)
      totalFrames++
      if (pitch !== null && pitch > MIN_F0 && pitch < MAX_F0) {
        pitches.push(pitch)
      }
    }

    if (pitches.length < 5) {
      // Not enough voiced speech to make a judgment
      return {
        pitchCoV:    0,
        meanF0:      0,
        voicedFrames: pitches.length,
        totalFrames,
        voicedRatio: totalFrames > 0 ? pitches.length / totalFrames : 0,
      }
    }

    const meanF0  = pitches.reduce((a, b) => a + b, 0) / pitches.length
    const stdevF0 = Math.sqrt(
      pitches.reduce((s, x) => s + (x - meanF0) ** 2, 0) / pitches.length
    )
    const pitchCoV    = meanF0 > 0 ? stdevF0 / meanF0 : 0
    const voicedRatio = pitches.length / totalFrames

    return {
      pitchCoV,
      meanF0:      Math.round(meanF0 * 10) / 10,
      voicedFrames: pitches.length,
      totalFrames,
      voicedRatio: Math.round(voicedRatio * 1000) / 1000,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn("[PitchAnalysis] failed:", msg)
    return {
      pitchCoV: 0, meanF0: 0, voicedFrames: 0,
      totalFrames: 0, voicedRatio: 0, error: msg,
    }
  }
}

export function isMonotonousPitch(pitch: PitchAnalysis | null): boolean {
  if (!pitch || pitch.error) return false
  if (pitch.voicedFrames < 5)  return false
  return pitch.pitchCoV < MONOTONE_COV_THRESHOLD
}