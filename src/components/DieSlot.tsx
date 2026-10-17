import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { DieDef } from '../dice/types'
import { DieBody } from './dice/DieBody'

export interface Point {
  readonly x: number
  readonly y: number
}

interface DieSlotProps {
  readonly def: DieDef
  readonly face: number
  readonly index: number
  readonly rollId: number
  readonly rolling: boolean
  readonly landed: boolean
  readonly origin: Point | null
  readonly size: number
  readonly delayMs: number
  readonly slotRef: (index: number, el: HTMLDivElement | null) => void
}

/** Positions one die and throws it from the tap point to its resting place. */
export function DieSlot({ def, face, index, rollId, rolling, landed, origin, size, delayMs, slotRef }: DieSlotProps): ReactNode {
  const slot = useRef<HTMLDivElement | null>(null)
  const tosser = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    slotRef(index, slot.current)
    return () => slotRef(index, null)
  }, [index, slotRef])

  // Measure the (untransformed) slot so the die flies in from where the finger touched.
  useLayoutEffect(() => {
    const s = slot.current
    const t = tosser.current
    if (!rolling || !s || !t) return
    const rect = s.getBoundingClientRect()
    const from = origin ?? { x: rect.left + rect.width / 2, y: window.innerHeight }
    t.style.setProperty('--from-x', `${from.x - (rect.left + rect.width / 2)}px`)
    t.style.setProperty('--from-y', `${from.y - (rect.top + rect.height / 2)}px`)
  }, [rolling, rollId, origin])

  const sparkle = landed && def.isMaxFace(face)
  const glow = def.theme.glow

  return (
    <div ref={slot} className="relative" style={{ width: size, height: size }}>
      <div
        className={`absolute -bottom-[14%] left-[10%] h-[18%] w-[80%] rounded-[50%] bg-black blur-md ${rolling ? 'animate-shadow' : 'opacity-60'}`}
        style={{ animationDelay: `${delayMs}ms` }}
      />
      <div
        ref={tosser}
        className={`size-full ${rolling ? 'animate-toss' : ''}`}
        style={{ animationDelay: `${delayMs}ms` }}
      >
        <div
          key={sparkle ? `glow-${rollId}` : 'plain'}
          className={`size-full transition-[filter] duration-500 ${sparkle ? 'animate-glow' : ''}`}
          style={{
            filter: sparkle
              ? `drop-shadow(0 0 ${size * 0.12}px ${glow}) drop-shadow(0 0 ${size * 0.04}px ${glow})`
              : `drop-shadow(0 ${size * 0.05}px ${size * 0.06}px rgba(0,0,0,0.45))`,
          }}
        >
          <DieBody def={def} face={face} index={index} rollId={rollId} rolling={rolling} size={size} delayMs={delayMs} />
        </div>
      </div>
    </div>
  )
}
