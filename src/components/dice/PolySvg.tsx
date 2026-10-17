import { useId, type ReactNode } from 'react'
import { POLY_SHAPES, toPoints } from '../../dice/shapes'
import type { DieTheme, PolyShape } from '../../dice/types'

interface PolySvgProps {
  readonly shape: PolyShape
  readonly theme: DieTheme
  readonly label: string | null
  readonly size: number
  readonly labelKey?: string
  readonly labelClassName?: string
}

/** A faceted, gem-like drawing of a polyhedral die. */
export function PolySvg({ shape, theme, label, size, labelKey, labelClassName }: PolySvgProps): ReactNode {
  const geo = POLY_SHAPES[shape]
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const len = label?.length ?? 0
  const fontSize = (len >= 3 ? 25 : len === 2 ? 33 : 38) * geo.text.scale

  return (
    <svg viewBox="-2 -2 104 104" width={size} height={size} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.mid} />
          <stop offset="1" stopColor={theme.dark} />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={theme.light} />
          <stop offset="1" stopColor={theme.mid} />
        </linearGradient>
      </defs>
      <polygon
        points={toPoints(geo.outline)}
        fill={`url(#${id}-body)`}
        stroke={theme.dark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {geo.facets.map((f, i) => (
        <polygon
          key={i}
          points={toPoints(f.pts)}
          fill={f.light > 0 ? '#ffffff' : '#000000'}
          fillOpacity={Math.abs(f.light)}
          stroke={theme.light}
          strokeOpacity="0.4"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      ))}
      {geo.front.length > 0 && (
        <polygon
          points={toPoints(geo.front)}
          fill={`url(#${id}-face)`}
          stroke={theme.light}
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      )}
      {label !== null && (
        <text
          key={labelKey}
          x={geo.text.x}
          y={geo.text.y}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="900"
          fill={theme.ink}
          stroke={theme.dark}
          strokeWidth="3"
          paintOrder="stroke"
          className={labelClassName}
          style={{ transformOrigin: `${geo.text.x}px ${geo.text.y}px`, transformBox: 'view-box' }}
        >
          {label}
        </text>
      )}
    </svg>
  )
}
