import { Fragment, type ReactNode } from 'react'

/**
 * Minimal inline markup for the legal texts: `**gras**` for emphasis and
 * `[[à compléter]]` for a field the shop owner still has to fill in.
 * Placeholders are rendered in gold on a tinted chip so an unfinished document
 * is impossible to miss on the page.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[[') && part.endsWith(']]')) {
          return (
            <mark className="legal__todo" key={i}>
              {part.slice(2, -2)}
            </mark>
          )
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
