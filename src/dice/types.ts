export type DieId = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'fate' | 'coin'

/** Which visual a die uses. `pips` and `fate` are 3D cubes, the d-shapes are faceted gems. */
export type PolyShape = 'd4' | 'd8' | 'd10' | 'd12' | 'd20'
export type DieShape = 'pips' | 'fate' | 'coin' | PolyShape

export interface DieTheme {
  readonly light: string
  readonly mid: string
  readonly dark: string
  /** Colour of numbers / pips. */
  readonly ink: string
  /** Accent used for glow and particles. */
  readonly glow: string
}

export interface RollSummary {
  readonly main: string
  readonly detail: string | null
}

export interface Verdict {
  readonly kind: 'crit' | 'fumble'
  readonly text: string
}

export interface DieDef {
  readonly id: DieId
  readonly label: string
  readonly name: string
  readonly blurb: string
  readonly shape: DieShape
  /** Faces are numbered 1..faces. */
  readonly faces: number
  readonly defaultCount: number
  readonly theme: DieTheme
  readonly display: (face: number) => string
  readonly summarize: (faces: readonly number[]) => RollSummary
  readonly verdict: (faces: readonly number[]) => Verdict | null
  /** True for faces that deserve a little sparkle on landing. */
  readonly isMaxFace: (face: number) => boolean
}
