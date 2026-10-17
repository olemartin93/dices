import { useEffect, useRef, type RefObject } from 'react'
import { ParticleSystem } from '../lib/particles'

export function useParticles(): {
  canvasRef: RefObject<HTMLCanvasElement | null>
  fx: RefObject<ParticleSystem | null>
} {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fx = useRef<ParticleSystem | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const system = new ParticleSystem(canvas)
    fx.current = system
    const onResize = (): void => system.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      system.destroy()
      fx.current = null
    }
  }, [])

  return { canvasRef, fx }
}
