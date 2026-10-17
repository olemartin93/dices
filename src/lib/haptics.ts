export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Some browsers throw when vibration is blocked; ignore.
    }
  }
}
