/**
 * Small CSV reader/writer sized for the catalogue round-trip.
 *
 * Exports use semicolons and a UTF-8 BOM so French Excel opens the file in
 * columns without an import wizard; reads accept either separator.
 */

const BOM = '﻿'

function quote(value: string): string {
  return /[";\n\r,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(head: string[], rows: string[][]): string {
  const lines = [head, ...rows].map((row) => row.map(quote).join(';'))
  return BOM + lines.join('\r\n') + '\r\n'
}

/** Picks whichever of `;` or `,` appears more often outside quoted fields. */
function detectSeparator(text: string): ';' | ',' {
  let semicolons = 0
  let commas = 0
  let inQuotes = false

  for (const char of text.slice(0, 4000)) {
    if (char === '"') inQuotes = !inQuotes
    else if (!inQuotes && char === ';') semicolons++
    else if (!inQuotes && char === ',') commas++
  }

  return commas > semicolons ? ',' : ';'
}

/** Parses a CSV document into rows of raw strings, blank lines dropped. */
export function parseCsv(input: string): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input
  const separator = detectSeparator(text)

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') inQuotes = true
    else if (char === separator) endField()
    else if (char === '\n') endRow()
    else if (char !== '\r') field += char
  }

  if (field !== '' || row.length > 0) endRow()

  return rows
}
