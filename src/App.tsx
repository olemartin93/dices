import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { DICE_BY_ID, isDieId, MAX_DICE } from './dice/definitions'
import { IMPACT_MS, ROLL_MS, STAGGER_MS } from './dice/timing'
import type { DieDef, DieId, Verdict } from './dice/types'
import { DiePicker } from './components/DiePicker'
import { DieSlot, type Point } from './components/DieSlot'
import { HistorySheet, type HistoryEntry } from './components/HistorySheet'
import { HistoryIcon, InstallIcon, ShakeIcon, SoundOffIcon, SoundOnIcon } from './components/icons'
import { useElementSize, type Size } from './hooks/useElementSize'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { useParticles } from './hooks/useParticles'
import { usePersistentState } from './hooks/usePersistentState'
import { requestShakePermission, shakeSupported, useShake } from './hooks/useShake'
import { vibrate } from './lib/haptics'
import { rollFace } from './lib/random'
import { sfx, unlockAudio } from './lib/sound'

type Phase = 'idle' | 'rolling' | 'landed'

interface RollState {
  readonly id: number
  readonly faces: readonly number[]
  readonly phase: Phase
  readonly origin: Point | null
}

interface Settings {
  readonly dieId: DieId
  readonly counts: Partial<Record<DieId, number>>
  readonly sound: boolean
  readonly shake: boolean
}

interface Ripple {
  readonly id: number
  readonly x: number
  readonly y: number
}

interface Flash {
  readonly id: number
  readonly color: string
}

const DEFAULT_SETTINGS: Settings = { dieId: 'd6', counts: {}, sound: true, shake: false }
const HISTORY_LIMIT = 50

const clampCount = (n: number): number => Math.max(1, Math.min(MAX_DICE, Math.round(n)))

function parseSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const counts: Partial<Record<DieId, number>> = {}
  const rawCounts = r['counts']
  if (typeof rawCounts === 'object' && rawCounts !== null) {
    for (const [k, v] of Object.entries(rawCounts)) {
      if (isDieId(k) && typeof v === 'number' && Number.isFinite(v)) counts[k] = clampCount(v)
    }
  }
  const dieId = r['dieId']
  return {
    dieId: isDieId(dieId) ? dieId : DEFAULT_SETTINGS.dieId,
    counts,
    sound: typeof r['sound'] === 'boolean' ? r['sound'] : DEFAULT_SETTINGS.sound,
    shake: r['shake'] === true,
  }
}

function parseHistory(raw: unknown): HistoryEntry[] | null {
  if (!Array.isArray(raw)) return null
  return raw
    .filter((e): e is HistoryEntry => {
      if (typeof e !== 'object' || e === null) return false
      const r = e as Record<string, unknown>
      return (
        typeof r['id'] === 'number' &&
        isDieId(r['dieId']) &&
        Array.isArray(r['faces']) &&
        r['faces'].every((f) => typeof f === 'number') &&
        typeof r['main'] === 'string' &&
        (r['detail'] === null || typeof r['detail'] === 'string') &&
        typeof r['at'] === 'number'
      )
    })
    .slice(0, HISTORY_LIMIT)
}

const randomFaces = (def: DieDef, count: number): number[] => Array.from({ length: count }, () => rollFace(def.faces))

function columns(count: number): number {
  if (count <= 3) return count
  if (count === 4) return 2
  if (count <= 6) return 3
  return 4
}

/** Space taken in the tray by the result text above the dice and the hint below them. */
const TRAY_RESERVED_HEIGHT = 112 + 96

/** Pick a die size that looks good but always fits the tray. */
function dieSize(count: number, gap: number, tray: Size | null): number {
  const preferred = count === 1 ? 150 : count === 2 ? 120 : count <= 4 ? 100 : count <= 6 ? 86 : 72
  if (!tray) return preferred
  const cols = columns(count)
  const rows = Math.ceil(count / cols)
  // Dice tumble in 3D and need some room around them.
  const fitWidth = (tray.width - 24 - (cols - 1) * gap) / cols / 1.1
  const fitHeight = (tray.height - TRAY_RESERVED_HEIGHT - (rows - 1) * (gap + 8)) / rows / 1.15
  return Math.max(44, Math.floor(Math.min(preferred, fitWidth, fitHeight)))
}

function restartAnimation(el: HTMLElement | null, className: string): void {
  if (!el) return
  el.classList.remove('animate-shake', 'animate-shake-hard')
  void el.offsetWidth
  el.classList.add(className)
}

const needsMotionPermission = (): boolean =>
  typeof DeviceMotionEvent !== 'undefined' &&
  typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function'

export default function App(): ReactNode {
  const [settings, setSettings] = usePersistentState('dice:settings', DEFAULT_SETTINGS, parseSettings)
  const [history, setHistory] = usePersistentState<HistoryEntry[]>('dice:history', [], parseHistory)
  const def = DICE_BY_ID[settings.dieId]
  const count = settings.counts[def.id] ?? def.defaultCount

  const [roll, setRoll] = useState<RollState>(() => ({ id: 0, faces: randomFaces(def, count), phase: 'idle', origin: null }))
  const [verdict, setVerdict] = useState<(Verdict & { id: number }) | null>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [flash, setFlash] = useState<Flash | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  // iOS forgets motion permission between launches, so it must be granted again by a tap.
  const [shakeOn, setShakeOn] = useState(() => settings.shake && !needsMotionPermission())

  const { canvasRef, fx } = useParticles()
  const { canInstall, install } = useInstallPrompt()

  const trayRef = useRef<HTMLDivElement | null>(null)
  const traySize = useElementSize(trayRef)
  const slotEls = useRef<(HTMLDivElement | null)[]>([])
  const timers = useRef<number[]>([])
  const busy = useRef(false)
  const rollCounter = useRef(0)

  const cancelTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    busy.current = false
  }, [])
  useEffect(() => cancelTimers, [cancelTimers])

  const setSlot = useCallback((index: number, el: HTMLDivElement | null) => {
    slotEls.current[index] = el
  }, [])

  const later = (ms: number, fn: () => void): void => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const slotCenter = (index: number): Point | null => {
    const el = slotEls.current[index]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.8 }
  }

  const throwDice = (origin: Point | null): void => {
    if (busy.current) return
    busy.current = true
    unlockAudio()

    const faces = randomFaces(def, count)
    const id = ++rollCounter.current
    const lastDelay = (faces.length - 1) * STAGGER_MS
    const result = def.verdict(faces)
    const { theme } = def

    setRoll({ id, faces, phase: 'rolling', origin })
    setVerdict(null)
    if (settings.sound) sfx.rattle(IMPACT_MS, faces.length)
    vibrate(8)

    // Each die hits the table: sparks, a thud and a buzz.
    faces.forEach((face, i) => {
      later(IMPACT_MS + i * STAGGER_MS, () => {
        const max = def.isMaxFace(face)
        const p = slotCenter(i)
        if (p) fx.current?.burst(p.x, p.y, [theme.glow, theme.light, '#ffffff'], max ? 1.5 : 0.8)
        if (settings.sound) {
          if (def.shape === 'coin') sfx.coin()
          else sfx.land()
          if (max) sfx.sparkle()
        }
        vibrate(max ? [18, 30, 18] : 14)
        if (i === 0) restartAnimation(trayRef.current, 'animate-shake')
      })
    })

    // Big moments: natural 20s, natural 1s, max rolls.
    if (result) {
      later(IMPACT_MS + lastDelay + 60, () => {
        setVerdict({ ...result, id })
        if (result.kind === 'crit') {
          fx.current?.confetti([theme.glow, theme.light, '#fde047', '#ffffff', '#f472b6', '#60a5fa'])
          setFlash({ id, color: '#fde68a' })
          if (settings.sound) sfx.crit()
          vibrate([30, 50, 30, 50, 120])
        } else {
          faces.forEach((_, i) => {
            const p = slotCenter(i)
            if (p) fx.current?.embers(p.x, p.y - 30, ['#ef4444', '#f97316', '#7f1d1d'])
          })
          setFlash({ id, color: '#dc2626' })
          restartAnimation(trayRef.current, 'animate-shake-hard')
          if (settings.sound) sfx.fumble()
          vibrate([200, 80, 300])
        }
      })
    }

    later(ROLL_MS + lastDelay, () => {
      busy.current = false
      setRoll((r) => (r.id === id ? { ...r, phase: 'landed' } : r))
      const summary = def.summarize(faces)
      setHistory((h) =>
        [{ id: Date.now(), dieId: def.id, faces, main: summary.main, detail: summary.detail, at: Date.now() }, ...h].slice(
          0,
          HISTORY_LIMIT,
        ),
      )
    })
  }

  // Keep a stable reference for listeners (shake, keyboard) that always calls the latest throwDice.
  const throwRef = useRef(throwDice)
  useEffect(() => {
    throwRef.current = throwDice
  })

  const throwFromCenter = useCallback(() => {
    const r = trayRef.current?.getBoundingClientRect()
    throwRef.current(r ? { x: r.left + r.width / 2, y: r.bottom } : null)
  }, [])

  useShake(shakeOn, throwFromCenter)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        throwFromCenter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [throwFromCenter])

  const onTrayPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return
    const ripple: Ripple = { id: performance.now(), x: e.clientX, y: e.clientY }
    setRipples((rs) => [...rs.slice(-4), ripple])
    window.setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== ripple.id)), 700)
    throwDice({ x: e.clientX, y: e.clientY })
  }

  const resetDice = (nextDef: DieDef, nextCount: number): void => {
    cancelTimers()
    setVerdict(null)
    setRoll({ id: rollCounter.current, faces: randomFaces(nextDef, nextCount), phase: 'idle', origin: null })
  }

  const selectDie = (id: DieId): void => {
    const nextDef = DICE_BY_ID[id]
    setSettings((s) => ({ ...s, dieId: id }))
    resetDice(nextDef, settings.counts[id] ?? nextDef.defaultCount)
    vibrate(5)
  }

  const changeCount = (n: number): void => {
    const next = clampCount(n)
    setSettings((s) => ({ ...s, counts: { ...s.counts, [def.id]: next } }))
    resetDice(def, next)
    vibrate(5)
  }

  const toggleSound = (): void => {
    unlockAudio()
    setSettings((s) => ({ ...s, sound: !s.sound }))
  }

  const toggleShake = async (): Promise<void> => {
    if (shakeOn) {
      setShakeOn(false)
      setSettings((s) => ({ ...s, shake: false }))
      return
    }
    const ok = await requestShakePermission()
    setShakeOn(ok)
    setSettings((s) => ({ ...s, shake: ok }))
  }

  const gap = roll.faces.length > 6 ? 18 : 28
  const size = dieSize(roll.faces.length, gap, traySize)
  const cols = columns(roll.faces.length)
  const summary = def.summarize(roll.faces)
  const rolling = roll.phase === 'rolling'
  const landed = roll.phase === 'landed'

  const headerButton =
    'grid size-11 place-items-center rounded-full bg-white/[0.07] text-white/80 backdrop-blur transition active:scale-90'

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#07070d] text-white">
      {/* Coloured ambient glow that follows the selected die. */}
      <div
        className="pointer-events-none absolute top-[38%] left-1/2 size-[130vmin] -translate-1/2 rounded-full opacity-25 blur-[90px] transition-colors duration-700"
        style={{ backgroundColor: def.theme.glow }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
        <h1 className="text-xl font-black tracking-tight">
          Dice<span style={{ color: def.theme.glow }}>.</span>
        </h1>
        <div className="flex items-center gap-2">
          {canInstall && (
            <button type="button" aria-label="Install app" onClick={install} className={headerButton}>
              <InstallIcon />
            </button>
          )}
          {shakeSupported() && (
            <button
              type="button"
              aria-label={shakeOn ? 'Turn off shake to roll' : 'Turn on shake to roll'}
              aria-pressed={shakeOn}
              onClick={() => void toggleShake()}
              className={`${headerButton} ${shakeOn ? 'text-white! ring-2' : ''}`}
              style={shakeOn ? ({ '--tw-ring-color': def.theme.glow } as CSSProperties) : undefined}
            >
              <ShakeIcon />
            </button>
          )}
          <button
            type="button"
            aria-label={settings.sound ? 'Mute sounds' : 'Unmute sounds'}
            onClick={toggleSound}
            className={headerButton}
          >
            {settings.sound ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>
          <button type="button" aria-label="Roll history" onClick={() => setShowHistory(true)} className={headerButton}>
            <HistoryIcon />
          </button>
        </div>
      </header>

      {/* The whole middle of the screen is the tap target. */}
      <div
        ref={trayRef}
        role="button"
        tabIndex={-1}
        aria-label={`Roll ${count} ${def.label}`}
        onPointerDown={onTrayPointerDown}
        className="relative z-0 flex flex-1 touch-none flex-col items-center justify-center px-3"
      >
        <div className="flex h-28 flex-col items-center justify-end pb-6 text-center">
          {roll.phase === 'idle' && (
            <>
              <p className="text-2xl font-black">{def.name}</p>
              <p className="mt-1 max-w-64 text-sm text-white/55">{def.blurb}</p>
            </>
          )}
          {rolling && <p className="animate-breathe text-lg font-bold tracking-[0.3em] text-white/50">ROLLING</p>}
          {landed && (
            <div key={roll.id} className="animate-pop">
              <p
                className="text-6xl leading-none font-black tabular-nums"
                style={{ textShadow: `0 0 28px ${def.theme.glow}aa` }}
              >
                {summary.main}
              </p>
              {summary.detail !== null && <p className="mt-2 text-sm font-semibold text-white/55">{summary.detail}</p>}
            </div>
          )}
        </div>

        <div
          className="flex flex-wrap justify-center"
          style={{ gap: `${gap + 8}px ${gap}px`, width: cols * size + (cols - 1) * gap, maxWidth: '100%' }}
        >
          {roll.faces.map((face, i) => (
            <DieSlot
              key={`${def.id}-${i}`}
              def={def}
              face={face}
              index={i}
              rollId={roll.id}
              rolling={rolling}
              landed={landed}
              origin={roll.origin}
              size={size}
              delayMs={i * STAGGER_MS}
              slotRef={setSlot}
            />
          ))}
        </div>

        <div className="relative mt-8 flex h-16 w-full items-center justify-center">
          {verdict ? (
            <p
              key={verdict.id}
              className={`pointer-events-none animate-banner text-5xl font-black tracking-tight whitespace-nowrap italic ${verdict.kind === 'crit' ? 'text-amber-200' : 'text-red-400'}`}
              style={{
                textShadow:
                  verdict.kind === 'crit'
                    ? '0 0 24px #f59e0b, 0 0 60px #f59e0b, 0 4px 0 #78350f'
                    : '0 0 24px #dc2626, 0 4px 0 #450a0a',
              }}
            >
              {verdict.text}
            </p>
          ) : (
            <p
              className={`text-sm font-semibold tracking-wide text-white/40 transition-opacity duration-500 ${rolling ? 'opacity-0' : 'animate-breathe'}`}
            >
              {shakeOn ? 'Tap or shake to roll' : 'Tap anywhere to roll'}
            </p>
          )}
        </div>
      </div>

      <DiePicker selected={def} count={count} onSelect={selectDie} onCount={changeCount} />

      {/* Effects layers */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none fixed z-20 size-56 animate-ripple rounded-full border-2"
          style={{ left: r.x, top: r.y, borderColor: def.theme.glow, boxShadow: `0 0 30px ${def.theme.glow}66` }}
        />
      ))}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30 size-full" />
      {flash && (
        <div
          key={flash.id}
          className="pointer-events-none fixed inset-0 z-30 animate-flash"
          style={{ background: `radial-gradient(circle at center, ${flash.color}aa, ${flash.color}33 60%, transparent)` }}
        />
      )}
      {showHistory && (
        <HistorySheet entries={history} onClose={() => setShowHistory(false)} onClear={() => setHistory([])} />
      )}
    </div>
  )
}
