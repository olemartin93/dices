import type { DieDef } from '../../dice/types'

export interface DieBodyProps {
  readonly def: DieDef
  readonly face: number
  readonly index: number
  readonly rollId: number
  readonly rolling: boolean
  readonly size: number
  readonly delayMs: number
}
