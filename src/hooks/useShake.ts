import { useEffect, useRef } from 'react'

interface MotionPermissionApi {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export const shakeSupported = (): boolean => typeof window !== 'undefined' && 'DeviceMotionEvent' in window

/** iOS needs an explicit permission prompt, triggered from a tap. Returns true when allowed. */
export async function requestShakePermission(): Promise<boolean> {
  if (!shakeSupported()) return false
  const api = DeviceMotionEvent as unknown as MotionPermissionApi
  if (typeof api.requestPermission !== 'function') return true
  try {
    return (await api.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

/** Calls `onShake` when the phone is shaken firmly. */
export function useShake(enabled: boolean, onShake: () => void): void {
  const callback = useRef(onShake)
  useEffect(() => {
    callback.current = onShake
  }, [onShake])

  useEffect(() => {
    if (!enabled || !shakeSupported()) return
    let last: { x: number; y: number; z: number } | null = null
    let lastShake = 0

    const onMotion = (e: DeviceMotionEvent): void => {
      const a = e.accelerationIncludingGravity
      if (!a || a.x === null || a.y === null || a.z === null) return
      const current = { x: a.x, y: a.y, z: a.z }
      if (last) {
        const delta = Math.abs(current.x - last.x) + Math.abs(current.y - last.y) + Math.abs(current.z - last.z)
        const now = performance.now()
        if (delta > 28 && now - lastShake > 1500) {
          lastShake = now
          callback.current()
        }
      }
      last = current
    }

    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [enabled])
}
