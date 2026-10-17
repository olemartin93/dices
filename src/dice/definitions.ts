import type { DieDef, DieId, DieShape, DieTheme, RollSummary, Verdict } from './types'

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0)

function numericSummary(faces: readonly number[]): RollSummary {
  return {
    main: String(sum(faces)),
    detail: faces.length > 1 ? faces.join(' + ') : null,
  }
}

function allMaxVerdict(faces: readonly number[], max: number): Verdict | null {
  return faces.length > 1 && faces.every((f) => f === max) ? { kind: 'crit', text: 'MAX ROLL!' } : null
}

interface NumericOptions {
  id: DieId
  label: string
  name: string
  blurb: string
  shape: DieShape
  faces: number
  theme: DieTheme
  verdict?: (faces: readonly number[]) => Verdict | null
}

function numericDie(o: NumericOptions): DieDef {
  return {
    id: o.id,
    label: o.label,
    name: o.name,
    blurb: o.blurb,
    shape: o.shape,
    faces: o.faces,
    defaultCount: 1,
    theme: o.theme,
    display: (face) => String(face),
    summarize: numericSummary,
    verdict: o.verdict ?? ((faces) => allMaxVerdict(faces, o.faces)),
    isMaxFace: (face) => face === o.faces,
  }
}

const FATE_VALUES = [-1, -1, 0, 0, 1, 1] as const
const FATE_LADDER: Readonly<Record<number, string>> = {
  [-4]: 'Horrifying',
  [-3]: 'Abysmal',
  [-2]: 'Terrible',
  [-1]: 'Poor',
  0: 'Mediocre',
  1: 'Average',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
}
const fateValue = (face: number): number => FATE_VALUES[face - 1] ?? 0
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

export const DICE: readonly DieDef[] = [
  numericDie({
    id: 'd6',
    label: 'D6',
    name: 'Classic d6',
    blurb: 'The board-game classic with pips.',
    shape: 'pips',
    faces: 6,
    theme: { light: '#ffffff', mid: '#e7e5e4', dark: '#a8a29e', ink: '#1c1917', glow: '#fef3c7' },
  }),
  numericDie({
    id: 'd20',
    label: 'D20',
    name: 'Twenty-sided',
    blurb: 'Attack rolls, saves and skill checks.',
    shape: 'd20',
    faces: 20,
    theme: { light: '#fda4af', mid: '#e11d48', dark: '#4c0519', ink: '#ffffff', glow: '#fb7185' },
    verdict: (faces) => {
      if (faces.includes(20)) return { kind: 'crit', text: 'NAT 20!' }
      if (faces.includes(1)) return { kind: 'fumble', text: 'NAT 1…' }
      return null
    },
  }),
  numericDie({
    id: 'd4',
    label: 'D4',
    name: 'Four-sided',
    blurb: 'Daggers, magic missiles, small damage.',
    shape: 'd4',
    faces: 4,
    theme: { light: '#6ee7b7', mid: '#059669', dark: '#022c22', ink: '#ffffff', glow: '#34d399' },
  }),
  numericDie({
    id: 'd8',
    label: 'D8',
    name: 'Eight-sided',
    blurb: 'Longswords and healing potions.',
    shape: 'd8',
    faces: 8,
    theme: { light: '#7dd3fc', mid: '#0284c7', dark: '#082f49', ink: '#ffffff', glow: '#38bdf8' },
  }),
  numericDie({
    id: 'd10',
    label: 'D10',
    name: 'Ten-sided',
    blurb: 'Dice pools and percentages.',
    shape: 'd10',
    faces: 10,
    theme: { light: '#c4b5fd', mid: '#7c3aed', dark: '#2e1065', ink: '#ffffff', glow: '#a78bfa' },
  }),
  numericDie({
    id: 'd12',
    label: 'D12',
    name: 'Twelve-sided',
    blurb: 'Greataxes and barbarian rage.',
    shape: 'd12',
    faces: 12,
    theme: { light: '#fcd34d', mid: '#d97706', dark: '#451a03', ink: '#ffffff', glow: '#fbbf24' },
  }),
  numericDie({
    id: 'd100',
    label: 'D100',
    name: 'Percentile',
    blurb: 'Roll 1–100 for loot tables and chances.',
    shape: 'd10',
    faces: 100,
    theme: { light: '#67e8f9', mid: '#0891b2', dark: '#083344', ink: '#ffffff', glow: '#22d3ee' },
    verdict: (faces) => (faces.includes(100) ? { kind: 'crit', text: 'ONE HUNDRED!' } : null),
  }),
  {
    id: 'fate',
    label: 'Fate',
    name: 'Fate / Fudge',
    blurb: 'Plus, minus or blank. Usually rolled as 4dF.',
    shape: 'fate',
    faces: 6,
    defaultCount: 4,
    theme: { light: '#e0e7ff', mid: '#a5b4fc', dark: '#4338ca', ink: '#1e1b4b', glow: '#818cf8' },
    display: (face) => ['−', '−', ' ', ' ', '+', '+'][face - 1] ?? ' ',
    summarize: (faces) => {
      const total = sum(faces.map(fateValue))
      return { main: signed(total), detail: FATE_LADDER[Math.max(-4, Math.min(4, total))] ?? null }
    },
    verdict: (faces) => {
      if (faces.length < 4) return null
      if (faces.every((f) => fateValue(f) === 1)) return { kind: 'crit', text: 'LEGENDARY!' }
      if (faces.every((f) => fateValue(f) === -1)) return { kind: 'fumble', text: 'DISASTER…' }
      return null
    },
    isMaxFace: (face) => fateValue(face) === 1,
  },
  {
    id: 'coin',
    label: 'Coin',
    name: 'Coin flip',
    blurb: 'Heads or tails. Settle any argument.',
    shape: 'coin',
    faces: 2,
    defaultCount: 1,
    theme: { light: '#fef08a', mid: '#eab308', dark: '#713f12', ink: '#713f12', glow: '#facc15' },
    display: (face) => (face === 1 ? 'Heads' : 'Tails'),
    summarize: (faces) => {
      if (faces.length === 1) return { main: faces[0] === 1 ? 'Heads' : 'Tails', detail: null }
      const heads = faces.filter((f) => f === 1).length
      return { main: `${heads} : ${faces.length - heads}`, detail: 'heads : tails' }
    },
    verdict: (faces) =>
      faces.length >= 3 && faces.every((f) => f === faces[0])
        ? { kind: 'crit', text: faces[0] === 1 ? 'ALL HEADS!' : 'ALL TAILS!' }
        : null,
    isMaxFace: () => false,
  },
]

export const DICE_BY_ID: Readonly<Record<DieId, DieDef>> = Object.fromEntries(
  DICE.map((d) => [d.id, d]),
) as Record<DieId, DieDef>

export const isDieId = (v: unknown): v is DieId => typeof v === 'string' && v in DICE_BY_ID

export const MAX_DICE = 8
