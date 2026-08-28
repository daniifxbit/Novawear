import type { CSSProperties } from 'react'

/** A run in the gold hairline: `left` is a percentage, `height` in pixels. */
export interface Run {
  left: string
  height: number
  faded?: boolean
}

/**
 * The brand's "drip" motif — a gold hairline with uneven runs bleeding down.
 * Used as a section separator and under category titles.
 */
export function Drip({ runs, className, style }: { runs: Run[]; className?: string; style?: CSSProperties }) {
  return (
    <div className={className ? `drip ${className}` : 'drip'} style={style} aria-hidden="true">
      {runs.map((run, i) => (
        <span
          key={i}
          style={{
            left: run.left,
            height: run.height,
            background: run.faded
              ? 'linear-gradient(rgba(195,156,108,.7),transparent)'
              : 'linear-gradient(#C39C6C,transparent)',
          }}
        />
      ))}
    </div>
  )
}
