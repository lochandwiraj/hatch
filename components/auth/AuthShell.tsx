'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Hatch } from '@/components/brand/Hatch'

/**
 * The shell every auth screen sits in.
 *
 * The old layout was a 420px box centred in an empty field, which at 1440
 * left about a thousand pixels of nothing and made the product feel like it
 * had not loaded. A centred box is also the single most generic shape an auth
 * page can take.
 *
 * This is a 5/7 ledger instead. The left column is the product stating what it
 * actually is, in its own index language and with real counts pulled live from
 * the database, so the page carries the brand rather than floating in a void.
 * The right column is the form, left-aligned on the sunken surface.
 *
 * On a phone it collapses to a single stack: wordmark, one honest mono line,
 * then the form. The left column's detail is dropped rather than squeezed,
 * because a phone has no room for a sidebar and no patience for one.
 */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string
  intro?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const [counts, setCounts] = useState<{ events: number; categories: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('events')
      .select('category')
      .eq('status', 'published')
      .then(({ data }) => {
        if (cancelled || !data) return
        setCounts({
          events: data.length,
          categories: new Set(data.map((e) => e.category).filter(Boolean)).size,
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-12">
        {/* The index column. Laptop only: it is context, not a control. */}
        <aside className="relative hidden border-r border-rule px-12 py-16 lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-block">
              <Hatch className="text-display-l leading-none text-type-primary" />
            </Link>
            <p className="mt-6 max-w-tight font-display text-title uppercase text-type-primary">
              Stop searching. Start discovering.
            </p>
            <p className="mt-4 max-w-tight font-serif text-body text-type-secondary">
              Hackathons, case competitions and workshops for Indian college students. Every listing
              is one a person found, checked and published by hand.
            </p>
          </div>

          {/* Real figures, read live. Nothing here is a claim we cannot check. */}
          <dl className="mt-12 border-t border-rule">
            {[
              { k: 'Open now', v: counts ? String(counts.events) : null, s: 'events' },
              { k: 'Categories', v: counts ? String(counts.categories) : null, s: 'in use' },
              { k: 'Free tier', v: '5', s: 'events a month' },
            ].map(({ k, v, s }) => (
              <div key={k} className="flex items-baseline justify-between border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">{k}</dt>
                <dd className="flex items-baseline gap-2">
                  <span data-mono className="text-mono-l text-type-primary">
                    {v ?? '--'}
                  </span>
                  <span data-mono className="text-mono text-type-muted">
                    {s}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* The form column. */}
        <main className="flex flex-col justify-center bg-ink-sunken px-4 py-12 lg:col-span-7 lg:px-24 lg:py-16">
          <div className="w-full max-w-[440px]">
            {/* Phone: the wordmark and one honest line stand in for the aside. */}
            <div className="lg:hidden">
              <Link href="/" className="inline-block">
                <Hatch className="text-display-m leading-none text-type-primary" />
              </Link>
              <p className="mt-2 font-sans text-ui-s text-type-secondary">
                {counts ? (
                  <>
                    <span data-mono className="text-mono text-type-primary">{counts.events}</span> events open now
                  </>
                ) : (
                  'Loading'
                )}
              </p>
            </div>

            <h1 className="mt-8 font-display text-display-m text-type-primary lg:mt-0">{title}</h1>
            {intro ? (
              <p className="mt-2 max-w-tight font-serif text-body text-type-secondary">{intro}</p>
            ) : null}

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-8 border-t border-rule pt-6">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuthShell
