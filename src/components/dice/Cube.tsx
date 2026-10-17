import type { CSSProperties, ReactNode } from 'react'
import { hash } from '../../lib/random'
import { IMPACT_MS } from '../../dice/timing'
import type { DieTheme } from '../../dice/types'
import type { DieBodyProps } from './types'

/** Cube rotation that brings each face to the front. */
const FACE_ROTATION: Readonly<Record<number, { x: number; y: number }>> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
}

/** Where each face sits on the cube (opposite faces add up to 7). */
const FACE_PLACEMENT: readonly (readonly [number, string])[] = [
  [1, 'rotateY(0deg)'],
  [6, 'rotateY(180deg)'],
  [2, 'rotateY(90deg)'],
  [5, 'rotateY(-90deg)'],
  [3, 'rotateX(90deg)'],
  [4, 'rotateX(-90deg)'],
]

const PIP_CELLS: Readonly<Record<number, readonly number[]>> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Pips({ n, theme }: { n: number; theme: DieTheme }): ReactNode {
  const cells = PIP_CELLS[n] ?? []
  const color = n === 1 ? '#dc2626' : theme.ink
  return (
    <div className="grid size-full grid-cols-3 grid-rows-3 p-[14%]">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="flex items-center justify-center">
          {cells.includes(i) && (
            <span
              className={`block shrink-0 rounded-full ${n === 1 ? 'size-[120%]' : 'size-[74%]'}`}
              style={{
                background: `radial-gradient(circle at 40% 35%, ${color}cc, ${color} 60%)`,
                boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.7)',
              }}
            />
          )}
        </span>
      ))}
    </div>
  )
}

function FateSymbol({ symbol, theme, size }: { symbol: string; theme: DieTheme; size: number }): ReactNode {
  return (
    <div
      className="flex size-full items-center justify-center font-black leading-none"
      style={{ color: theme.ink, fontSize: size * 0.7, textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
    >
      {symbol}
    </div>
  )
}

export function Cube({ def, face, index, rollId, rolling, size, delayMs }: DieBodyProps): ReactNode {
  const base = FACE_ROTATION[face] ?? { x: 0, y: 0 }
  const h = hash(rollId, index, def.faces)
  // Rotation keeps growing with every roll so the cube always tumbles forward.
  const x = base.x + 360 * (rollId * 2 + (h % 2))
  const y = base.y + 360 * (rollId * 2 + ((h >>> 4) % 2))
  const z = 360 * rollId + ((h >>> 8) % 31) - 15
  const half = size / 2
  const { theme } = def

  const cubeStyle: CSSProperties = {
    transform: `rotateX(-24deg) rotateY(28deg) rotateZ(${z}deg) rotateX(${x}deg) rotateY(${y}deg)`,
    transition: rolling ? `transform ${IMPACT_MS}ms cubic-bezier(0.2, 0.65, 0.3, 1) ${delayMs}ms` : 'none',
  }

  const faceStyle = (placement: string): CSSProperties => ({
    transform: `${placement} translateZ(${half}px)`,
    background: `radial-gradient(circle at 30% 25%, ${theme.light}, ${theme.mid} 65%, ${theme.dark})`,
    boxShadow: `inset 0 0 ${size * 0.1}px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.35)`,
  })

  return (
    <div className="size-full" style={{ perspective: size * 5 }}>
      <div className="relative size-full transform-3d" style={cubeStyle}>
        {/* Inner planes fill the gaps left by the rounded corners. */}
        {['rotateX(90deg)', 'rotateY(90deg)', 'rotateX(0deg)'].map((t) => (
          <div
            key={t}
            className="absolute inset-[3%] rounded-[10%]"
            style={{ transform: t, backgroundColor: theme.dark }}
          />
        ))}
        {FACE_PLACEMENT.map(([n, placement]) => (
          <div key={n} className="absolute inset-0 rounded-[18%]" style={faceStyle(placement)}>
            {def.shape === 'pips' ? (
              <Pips n={n} theme={theme} />
            ) : (
              <FateSymbol symbol={def.display(n)} theme={theme} size={size} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
