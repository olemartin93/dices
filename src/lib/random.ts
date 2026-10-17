/** Unbiased random integer in [0, maxExclusive) using the crypto RNG. */
export function randomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  let n: number
  do {
    crypto.getRandomValues(buf)
    n = buf[0] ?? 0
  } while (n >= limit)
  return n % maxExclusive
}

/** Roll a face numbered 1..faces. */
export const rollFace = (faces: number): number => randomInt(faces) + 1

export const between = (min: number, max: number): number => min + Math.random() * (max - min)

export const pick = <T,>(items: readonly T[]): T => {
  const item = items[randomInt(items.length)]
  if (item === undefined) throw new Error('pick() from empty list')
  return item
}

/** Small deterministic hash so visuals (spin amounts, tilt) can be derived purely during render. */
export function hash(...parts: readonly number[]): number {
  let h = 2166136261
  for (const p of parts) {
    h ^= p
    h = Math.imul(h, 16777619)
    h ^= h >>> 13
  }
  return h >>> 0
}
