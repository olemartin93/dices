// Synthesised sound effects (no audio files, works offline).

type AudioCtor = typeof AudioContext

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

function getCtx(): AudioContext | null {
  if (ctx === null) {
    const w = window as Window & { webkitAudioContext?: AudioCtor }
    const Ctor: AudioCtor | undefined = window.AudioContext ?? w.webkitAudioContext
    if (Ctor === undefined) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer === null) {
    const length = Math.floor(c.sampleRate * 0.25)
    noiseBuffer = c.createBuffer(1, length, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

interface ClickOptions {
  freq: number
  q: number
  gain: number
  dur: number
}

function click(c: AudioContext, at: number, o: ClickOptions): void {
  const src = c.createBufferSource()
  src.buffer = getNoise(c)
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = o.freq
  filter.Q.value = o.q
  const gain = c.createGain()
  gain.gain.setValueAtTime(o.gain, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + o.dur)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(at, Math.random() * 0.1)
  src.stop(at + o.dur + 0.02)
}

function tone(c: AudioContext, at: number, freq: number, dur: number, type: OscillatorType, peak: number, endFreq?: number): void {
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, at + dur)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

/** Call from inside a user gesture once so iOS unlocks audio. */
export function unlockAudio(): void {
  getCtx()
}

export const sfx = {
  /** Dice rattling in the hand / tumbling through the air. */
  rattle(durationMs: number, dice: number): void {
    const c = getCtx()
    if (!c) return
    const hits = Math.min(6 + dice * 3, 22)
    for (let i = 0; i < hits; i++) {
      const at = c.currentTime + (Math.random() * durationMs) / 1000
      click(c, at, { freq: 2200 + Math.random() * 2600, q: 6, gain: 0.08 + Math.random() * 0.08, dur: 0.035 })
    }
  },
  /** A die hitting the table. */
  land(): void {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    click(c, t, { freq: 900 + Math.random() * 500, q: 2.5, gain: 0.55, dur: 0.09 })
    click(c, t + 0.07 + Math.random() * 0.03, { freq: 1600, q: 4, gain: 0.18, dur: 0.05 })
    tone(c, t, 140, 0.12, 'sine', 0.35, 60)
  },
  coin(): void {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    tone(c, t, 2600, 0.6, 'sine', 0.12)
    tone(c, t, 3900, 0.4, 'sine', 0.06)
    click(c, t, { freq: 4000, q: 8, gain: 0.25, dur: 0.04 })
  },
  sparkle(): void {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    tone(c, t, 1568, 0.25, 'triangle', 0.07)
    tone(c, t + 0.06, 2093, 0.3, 'triangle', 0.06)
  },
  crit(): void {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((f, i) => tone(c, t + i * 0.07, f, 0.5, 'triangle', 0.16))
    tone(c, t + 0.35, 1046.5, 0.9, 'sine', 0.12)
  },
  fumble(): void {
    const c = getCtx()
    if (!c) return
    const t = c.currentTime
    tone(c, t, 330, 0.35, 'sawtooth', 0.08, 220)
    tone(c, t + 0.3, 247, 0.35, 'sawtooth', 0.08, 165)
    tone(c, t + 0.6, 196, 0.8, 'sawtooth', 0.09, 98)
  },
}
