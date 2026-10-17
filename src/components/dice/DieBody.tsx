import type { ReactNode } from 'react'
import { Coin } from './Coin'
import { Cube } from './Cube'
import { PolyDie } from './PolyDie'
import type { DieBodyProps } from './types'

export function DieBody(props: DieBodyProps): ReactNode {
  const shape = props.def.shape
  switch (shape) {
    case 'pips':
    case 'fate':
      return <Cube {...props} />
    case 'coin':
      return <Coin {...props} />
    default:
      return <PolyDie {...props} shape={shape} />
  }
}
