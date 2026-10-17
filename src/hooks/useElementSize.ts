import { useEffect, useState, type RefObject } from 'react'

export interface Size {
  readonly width: number
  readonly height: number
}

/** Tracks an element's size with ResizeObserver. */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}
