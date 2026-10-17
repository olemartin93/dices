import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { hash, rollFace } from '../../lib/random'
import { IMPACT_MS } from '../../dice/timing'
import type { PolyShape } from '../../dice/types'
import { PolySvg } from './PolySvg'
import type { DieBodyProps } from './types'

export function PolyDie(props: DieBodyProps & { readonly shape: PolyShape }): ReactNode {
  const { def, face, index, rollId, rolling, size, delayMs, shape } = props
  // While tumbling, the number flickers through random faces and slows down before landing.
  const [flicker, setFlicker] = useState<number | null>(null)

  useEffect(() => {
    if (!rolling) return
    const timers: number[] = []
    const end = delayMs + IMPACT_MS
    let t = delayMs
    let step = 40
    while (t < end - 30) {
      timers.push(window.setTimeout(() => setFlicker(rollFace(def.faces)), t))
      t += step
      step *= 1.14
    }
    timers.push(window.setTimeout(() => setFlicker(null), end))
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      setFlicker(null)
    }
  }, [rolling, rollId, def.faces, delayMs])

  const h = hash(rollId, index, 7)
  const rest = rollId === 0 ? 0 : (h % 25) - 12
  const spin = (h % 2 === 0 ? 1 : -1) * (540 + ((h >>> 3) % 300))
  const style = {
    '--rest': `${rest}deg`,
    '--spin': `${spin}deg`,
    transform: rolling ? undefined : `rotateZ(${rest}deg)`,
    animationDelay: `${delayMs}ms`,
  } as CSSProperties

  const revealed = flicker === null

  return (
    <div className="size-full" style={{ perspective: size * 5 }}>
      <div className={`size-full transform-3d ${rolling ? 'animate-tumble' : ''}`} style={style}>
        <PolySvg
          shape={shape}
          theme={def.theme}
          size={size}
          label={def.display(flicker ?? face)}
          labelKey={revealed ? `final-${rollId}` : 'flicker'}
          labelClassName={revealed && rollId > 0 ? 'animate-pop' : ''}
        />
      </div>
    </div>
  )
}
