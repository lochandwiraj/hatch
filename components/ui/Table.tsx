'use client'

import { Glyph } from './Glyph'

/**
 * The ledger. A real <table>, because that is what this data is.
 *
 * Section 8 is explicit: real th, scope and caption. The admin screens and the
 * event index are tables, so they get table semantics rather than a grid of
 * divs that reads as nothing to a screen reader.
 *
 * On phones a table is reflowed by the caller into stacked record blocks:
 * `Table.Stack` renders the same row data as a labelled block, so one data
 * shape serves both widths and nothing becomes a horizontally scrolling table
 * on a 360px screen.
 */

export interface Column<T> {
  key: string
  header: string
  /** Right-align numerics. */
  align?: 'left' | 'right'
  /** Hide on phone: the data still appears in the stacked block. */
  lgOnly?: boolean
  render: (row: T) => React.ReactNode
  sortable?: boolean
}

export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  empty,
  className = '',
}: {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: { key: string; dir: 'asc' | 'desc' }
  onSort?: (key: string) => void
  empty?: React.ReactNode
  className?: string
}) {
  if (rows.length === 0 && empty) return <>{empty}</>

  return (
    <>
      {/* Laptop: the ledger. */}
      <table className={`hidden w-full border-collapse text-left lg:table ${className}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`py-2 font-sans text-label uppercase text-type-muted ${
                  c.align === 'right' ? 'text-right' : ''
                }`}
              >
                {c.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="inline-flex items-center gap-1 uppercase text-type-muted hover:text-type-primary"
                  >
                    {c.header}
                    {sort?.key === c.key ? (
                      <Glyph name="chevron" size={12} className={sort.dir === 'asc' ? 'rotate-180' : ''} />
                    ) : null}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-rule">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`h-12 py-2 font-sans text-ui-s text-type-primary ${
                    c.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phone: one record per block. Never a sideways-scrolling table. */}
      <ul className="lg:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="border-b border-rule py-3">
            {columns.map((c) => (
              <div key={c.key} className="flex items-baseline justify-between gap-4 py-1">
                <span className="font-sans text-label uppercase text-type-muted">{c.header}</span>
                <span className="text-right font-sans text-ui-s text-type-primary">{c.render(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  )
}

export default Table
