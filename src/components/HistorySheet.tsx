import type { ReactNode } from 'react'
import { DICE_BY_ID } from '../dice/definitions'
import type { DieId } from '../dice/types'
import { DieIcon } from './DieIcon'
import { CloseIcon } from './icons'

export interface HistoryEntry {
  readonly id: number
  readonly dieId: DieId
  readonly faces: readonly number[]
  readonly main: string
  readonly detail: string | null
  readonly at: number
}

interface HistorySheetProps {
  readonly entries: readonly HistoryEntry[]
  readonly onClose: () => void
  readonly onClear: () => void
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

export function HistorySheet({ entries, onClose, onClear }: HistorySheetProps): ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close history"
        className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="relative flex max-h-[75vh] animate-sheet flex-col rounded-t-3xl border-t border-white/10 bg-zinc-900/95 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/20" />
        <header className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="text-lg font-black">History</h2>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full px-3 py-1.5 text-sm font-bold text-white/60 active:bg-white/10"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full bg-white/10 active:scale-90"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <ol className="flex-1 overflow-y-auto px-3">
          {entries.length === 0 && <li className="py-10 text-center text-white/50">No rolls yet. Go throw something!</li>}
          {entries.map((e) => {
            const def = DICE_BY_ID[e.dieId]
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 odd:bg-white/[0.03]">
                <DieIcon def={def} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white/80">
                    {e.faces.length}× {def.label}
                    <span className="ml-2 font-medium text-white/40">{timeFormat.format(e.at)}</span>
                  </div>
                  <div className="truncate text-xs text-white/50">
                    {def.id === 'coin' || def.id === 'fate'
                      ? e.faces.map((f) => def.display(f).trim() || '0').join(' ')
                      : e.faces.join(', ')}
                    {e.detail !== null && def.id === 'fate' ? ` · ${e.detail}` : ''}
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: def.theme.glow }}>
                  {e.main}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
