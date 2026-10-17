import type { CSSProperties, ReactNode } from 'react'
import { hash } from '../../lib/random'
import { IMPACT_MS } from '../../dice/timing'
import type { DieBodyProps } from './types'

export function Coin({ def, face, index, rollId, rolling, size, delayMs }: DieBodyProps): ReactNode {
  const { theme } = def
  const flips = rollId * 6 + (hash(rollId, index) % 2)
  const rotation = 360 * flips + (face === 2 ? 180 : 0)
  const thickness = Math.max(5, size * 0.07)
  const layers = 10

  const style: CSSProperties = {
    transform: `rotateX(22deg) rotateX(${rotation}deg)`,
    transition: rolling ? `transform ${IMPACT_MS}ms cubic-bezier(0.25, 0.6, 0.35, 1) ${delayMs}ms` : 'none',
  }

  const faceStyle = (back: boolean): CSSProperties => ({
    transform: `${back ? 'rotateX(180deg) ' : ''}translateZ(${thickness / 2}px)`,
    background: `radial-gradient(circle at 32% 28%, ${theme.light}, ${theme.mid} 55%, ${theme.dark} 100%)`,
    boxShadow: `inset 0 0 0 ${size * 0.045}px ${theme.mid}, inset 0 0 0 ${size * 0.06}px ${theme.dark}66, inset 0 0 ${size * 0.15}px rgba(0,0,0,0.35)`,
    color: theme.ink,
  })

  const content = (letter: string, word: string): ReactNode => (
    <div className="flex size-full flex-col items-center justify-center leading-none">
      <span className="font-black" style={{ fontSize: size * 0.46, textShadow: `0 2px 0 ${theme.light}` }}>
        {letter}
      </span>
      <span className="font-extrabold tracking-[0.2em]" style={{ fontSize: size * 0.1 }}>
        {word}
      </span>
    </div>
  )

  return (
    <div className="size-full" style={{ perspective: size * 5 }}>
      <div className="relative size-full transform-3d" style={style}>
        {Array.from({ length: layers }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              transform: `translateZ(${-thickness / 2 + (i * thickness) / (layers - 1)}px)`,
              backgroundColor: i % 2 === 0 ? theme.dark : theme.mid,
            }}
          />
        ))}
        <div className="absolute inset-0 rounded-full backface-hidden" style={faceStyle(false)}>
          {content('H', 'HEADS')}
        </div>
        <div className="absolute inset-0 rounded-full backface-hidden" style={faceStyle(true)}>
          {content('T', 'TAILS')}
        </div>
      </div>
    </div>
  )
}
