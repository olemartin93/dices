import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/** useState that survives reloads via localStorage. `parse` validates stored data. */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      return parse(JSON.parse(raw)) ?? fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked (private mode) — the app still works without it.
    }
  }, [key, value])

  return [value, setValue]
}
