import type { ReactNode } from 'react'
import type { DieDef } from '../dice/types'
import { PolySvg } from './dice/PolySvg'

/** Small flat picture of a die for the picker. */
export function DieIcon({ def, size }: { def: DieDef; size: number }): ReactNode {
  const { theme } = def
  switch (def.shape) {
    case 'pips':
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
          <rect x="4" y="4" width="32" height="32" rx="8" fill={theme.light} stroke={theme.dark} strokeWidth="1.5" />
          {[
            [12, 12],
            [28, 12],
            [20, 20],
            [12, 28],
            [28, 28],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" fill={theme.ink} />
          ))}
        </svg>
      )
    case 'fate':
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
          <rect x="4" y="4" width="32" height="32" rx="8" fill={theme.mid} stroke={theme.dark} strokeWidth="1.5" />
          <path d="M20 12v16M12 20h16" stroke={theme.ink} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      )
    case 'coin':
      return (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill={theme.mid} stroke={theme.dark} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="12" fill="none" stroke={theme.light} strokeWidth="1.5" />
          <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill={theme.dark}>
            H
          </text>
        </svg>
      )
    default:
      return <PolySvg shape={def.shape} theme={theme} label={null} size={size} />
  }
}
