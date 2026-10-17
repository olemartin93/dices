import type { PolyShape } from './types'

export type Pt = readonly [number, number]

export interface Facet {
  readonly pts: readonly Pt[]
  /** >0 lightens, <0 darkens. */
  readonly light: number
}

export interface PolyGeometry {
  readonly outline: readonly Pt[]
  readonly front: readonly Pt[]
  readonly facets: readonly Facet[]
  readonly text: { readonly x: number; readonly y: number; readonly scale: number }
}

const ring = (n: number, r: number, startDeg: number, cx = 50, cy = 50): Pt[] =>
  Array.from({ length: n }, (_, i): Pt => {
    const a = ((startDeg + (i * 360) / n) * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })

const at = <T,>(xs: readonly T[], i: number): T => {
  const v = xs[((i % xs.length) + xs.length) % xs.length]
  if (v === undefined) throw new Error('empty geometry')
  return v
}

/** Shade a facet based on where it sits relative to a light coming from the top-left. */
function lit(pts: readonly Pt[]): Facet {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length - 50
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length - 50
  const angle = Math.atan2(cy, cx)
  const light = 0.26 * Math.cos(angle - (-130 * Math.PI) / 180) - 0.1
  return { pts, light }
}

function d4(): PolyGeometry {
  const tri = ring(3, 50, -90, 50, 60)
  const [t, r, l] = [at(tri, 0), at(tri, 1), at(tri, 2)]
  const c: Pt = [50, 64]
  return {
    outline: [t, r, l],
    front: [],
    facets: [
      { pts: [t, c, l], light: 0.22 },
      { pts: [t, r, c], light: -0.05 },
      { pts: [l, c, r], light: -0.3 },
    ],
    text: { x: 50, y: 66, scale: 0.95 },
  }
}

function d8(): PolyGeometry {
  const T: Pt = [50, 2]
  const R: Pt = [95, 50]
  const B: Pt = [50, 98]
  const L: Pt = [5, 50]
  const fr: Pt = [83, 70]
  const fl: Pt = [17, 70]
  return {
    outline: [T, R, B, L],
    front: [T, fr, fl],
    facets: [lit([T, R, fr]), lit([T, fl, L]), lit([fl, fr, B]), lit([L, fl, B]), lit([R, B, fr])],
    text: { x: 50, y: 50, scale: 0.95 },
  }
}

function d10(): PolyGeometry {
  const T: Pt = [50, 2]
  const R: Pt = [96, 47]
  const B: Pt = [50, 98]
  const L: Pt = [4, 47]
  const fr: Pt = [79, 54]
  const fb: Pt = [50, 72]
  const fl: Pt = [21, 54]
  return {
    outline: [T, R, B, L],
    front: [T, fr, fb, fl],
    facets: [lit([T, fl, L]), lit([T, R, fr]), lit([L, fl, fb, B]), lit([R, B, fb, fr])],
    text: { x: 50, y: 47, scale: 0.9 },
  }
}

function d12(): PolyGeometry {
  const outer = ring(10, 49, -90)
  const inner = ring(5, 28, -90)
  const facets = Array.from({ length: 5 }, (_, i) =>
    lit([at(inner, i), at(outer, 2 * i), at(outer, 2 * i + 1), at(outer, 2 * i + 2), at(inner, i + 1)]),
  )
  return { outline: outer, front: inner, facets, text: { x: 50, y: 52, scale: 0.9 } }
}

function d20(): PolyGeometry {
  const o = ring(6, 49, -90)
  const i = ring(3, 31, -90)
  const tri = (a: Pt, b: Pt, c: Pt): Facet => lit([a, b, c])
  const [o0, o1, o2, o3, o4, o5] = [at(o, 0), at(o, 1), at(o, 2), at(o, 3), at(o, 4), at(o, 5)]
  const [i0, i1, i2] = [at(i, 0), at(i, 1), at(i, 2)]
  return {
    outline: o,
    front: i,
    facets: [
      tri(o5, o0, i0),
      tri(o0, o1, i0),
      tri(o1, i1, i0),
      tri(o1, o2, i1),
      tri(o2, o3, i1),
      tri(o3, i2, i1),
      tri(o3, o4, i2),
      tri(o4, o5, i2),
      tri(o5, i0, i2),
    ],
    text: { x: 50, y: 55, scale: 0.78 },
  }
}

export const POLY_SHAPES: Readonly<Record<PolyShape, PolyGeometry>> = {
  d4: d4(),
  d8: d8(),
  d10: d10(),
  d12: d12(),
  d20: d20(),
}

export const toPoints = (pts: readonly Pt[]): string => pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
