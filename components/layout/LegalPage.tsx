'use client'

import { useState } from 'react'
import { Glyph } from '@/components/ui/Glyph'

/**
 * The shell for Terms, Privacy, Refund and Delivery.
 *
 * All four are kept because any payment flow needs them, and given the
 * same treatment as everything else rather than being left as a dumping
 * ground: numbered sections, the reading face at a capped measure, a
 * last-updated date in mono.
 *
 * The contents list is collapsible at the top on a phone and a sticky mono
 * index in the left 3 columns on a laptop. It is generated from the sections,
 * so it cannot drift out of step with the document.
 */

export interface LegalSection {
  id: string
  heading: string
  body: React.ReactNode
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  /** ISO date. Rendered in mono, as every date in this product is. */
  updated: string
  intro?: React.ReactNode
  sections: LegalSection[]
}) {
  const [tocOpen, setTocOpen] = useState(false)

  const toc = (
    <ol className="border-t border-rule">
      {sections.map((s, i) => (
        <li key={s.id} className="border-b border-rule">
          <a
            href={`#${s.id}`}
            onClick={() => setTocOpen(false)}
            className="flex min-h-touch items-baseline gap-3 py-2 font-sans text-ui-s text-type-secondary hover:text-signal"
          >
            <span data-mono className="text-mono text-type-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            {s.heading}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 lg:px-12 lg:py-16">
      <header className="border-b border-rule pb-6">
        <h1 className="font-display text-display-m text-type-primary">{title}</h1>
        <p className="mt-2">
          <span className="font-sans text-label uppercase text-type-muted">Last updated</span>{' '}
          <time data-mono dateTime={updated} className="text-mono text-type-secondary">
            {updated}
          </time>
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Phone: a collapsible contents list. */}
        <div className="border-b border-rule py-4 lg:hidden">
          <button
            type="button"
            onClick={() => setTocOpen((v) => !v)}
            aria-expanded={tocOpen}
            className="flex min-h-touch w-full items-center justify-between font-sans text-label uppercase text-type-muted"
          >
            Contents
            <Glyph name="chevron" size={16} className={tocOpen ? 'rotate-180' : ''} />
          </button>
          {tocOpen ? <div className="mt-3">{toc}</div> : null}
        </div>

        {/* Laptop: a sticky index in the left 3 columns. */}
        <nav aria-label="Contents" className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24 py-8">
            <p className="font-sans text-label uppercase text-type-muted">Contents</p>
            <div className="mt-3">{toc}</div>
          </div>
        </nav>

        <div className="py-8 lg:col-span-8 lg:col-start-5">
          {intro ? (
            <div className="mb-8 max-w-measure font-serif text-body-l text-type-secondary">{intro}</div>
          ) : null}

          <ol className="space-y-12">
            {sections.map((s, i) => (
              <li key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="flex items-baseline gap-3 border-b border-rule pb-2 font-display text-title uppercase text-type-primary">
                  <span data-mono className="text-mono text-signal">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-4 max-w-measure space-y-4 font-serif text-body text-type-secondary">
                  {s.body}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}

export default LegalPage
