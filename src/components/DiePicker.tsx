import { useEffect, useRef, type ReactNode } from 'react'
import { DICE, MAX_DICE } from '../dice/definitions'
import type { DieDef, DieId } from '../dice/types'
import { DieIcon } from './DieIcon'
import { MinusIcon, PlusIcon } from './icons'

interface DiePickerProps {
  readonly selected: DieDef
  readonly count: number
  readonly onSelect: (id: DieId) => void
  readonly onCount: (count: number) => void
}

export function DiePicker({ selected, count, onSelect, onCount }: DiePickerProps): ReactNode {
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Centre the selected die in the strip. (scrollIntoView would also scroll the page sideways.)
  useEffect(() => {
    const list = listRef.current
    const button = activeRef.current
    if (!list || !button) return
    list.scrollTo({ left: button.offsetLeft - (list.clientWidth - button.clientWidth) / 2, behavior: 'smooth' })
  }, [selected.id])

  return (
    <div className="relative z-10 flex flex-col gap-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Fewer dice"
          disabled={count <= 1}
          onClick={() => onCount(count - 1)}
          className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition active:scale-90 disabled:opacity-30"
        >
          <MinusIcon />
        </button>
        <div className="min-w-24 text-center">
          <span className="text-2xl font-black tabular-nums">{count}</span>
          <span className="ml-1.5 text-sm font-bold text-white/60">× {selected.label}</span>
        </div>
        <button
          type="button"
          aria-label="More dice"
          disabled={count >= MAX_DICE}
          onClick={() => onCount(count + 1)}
          className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition active:scale-90 disabled:opacity-30"
        >
          <PlusIcon />
        </button>
      </div>

      <div ref={listRef} className="relative flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DICE.map((def) => {
          const active = def.id === selected.id
          return (
            <button
              key={def.id}
              ref={active ? activeRef : undefined}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(def.id)}
              className={`flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl border py-2.5 transition duration-200 active:scale-95 ${
                active ? 'border-white/40 bg-white/15' : 'border-white/5 bg-white/5'
              }`}
              style={active ? { boxShadow: `0 0 18px -2px ${def.theme.glow}aa, inset 0 0 12px ${def.theme.glow}33` } : undefined}
            >
              <span className={`transition duration-300 ${active ? 'scale-110' : 'opacity-75 grayscale-[35%]'}`}>
                <DieIcon def={def} size={36} />
              </span>
              <span className={`text-xs font-extrabold tracking-wide ${active ? 'text-white' : 'text-white/55'}`}>
                {def.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
