'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { EventIndex } from '@/components/events/EventIndex'
import { PageEnter } from '@/components/motion/PageEnter'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Hatch } from '@/components/brand/Hatch'
import Header from '@/components/layout/Header'
import { EventRow, type EventRowData } from '@/components/events/EventRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { normalizeUserTier, TIER_PRICING, formatRupees } from '@/lib/tier'

// Below the fold, so neither belongs in the landing route's first load.
// GSAP travels with them rather than with the initial bundle.
const EventRail = dynamic(
  () => import('@/components/events/EventRail').then((m) => m.EventRail),
  { ssr: false }
)
const Reveal = dynamic(() => import('@/components/motion/Reveal').then((m) => m.Reveal), {
  ssr: false,
})

const CURATION = [
  {
    n: '01',
    title: 'Found by a person',
    body: 'Someone goes looking. No scraper, no feed, no algorithm deciding what a student event is.',
  },
  {
    n: '02',
    title: 'Checked before it is published',
    body: 'Is it real, is it open to students, is the deadline still live. If any answer is no, it does not go up.',
  },
  {
    n: '03',
    title: 'Removed when it is over',
    body: 'Past events are archived automatically, so the index never shows something you can no longer enter.',
  },
]

export default function Home() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<EventRowData[]>([])
  const [loading, setLoading] = useState(true)

  const userTier = normalizeUserTier(profile?.subscription_tier)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('events')
      .select('id,title,organizer,category,mode,event_date,registration_deadline,prize_pool,required_tier')
      .eq('status', 'published')
      .order('event_date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error(error)
        setEvents((data as EventRowData[]) ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])


  return (
    <>
      <Header />

      <main className="spine mx-auto max-w-[1440px] px-4 lg:px-12">
        {/* Masthead. Type, rules and real data. No image, no orb, no gradient. */}
        <section className="relative z-10 border-b border-rule pb-12 pt-16 lg:pb-24 lg:pt-32">
          <Hatch className="block text-display-xl leading-[0.88] text-type-primary" />
          <PageEnter rule={false}>
            <h1 data-page-title className="mt-6 max-w-measure font-display text-display-m text-type-primary">
              Stop searching. Start discovering.
            </h1>
          </PageEnter>
          <p className="mt-6 max-w-tight font-serif text-body-l text-type-secondary">
            Hackathons, case competitions and workshops for Indian college students. Every
            listing below is one a person found, checked and published by hand.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={user ? '/events' : '/auth'}
              className="inline-flex min-h-touch items-center border border-signal bg-signal px-6 py-3 font-sans text-ui text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
            >
              {user ? 'Browse events' : 'Start for free'}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-touch items-center border border-rule-strong px-6 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal"
            >
              Pricing
            </Link>
          </div>
        </section>

        {/* The product, visible inside one scroll. Real rows, real filters. */}
        <section className="relative z-10 border-b border-rule py-12 lg:py-16" aria-labelledby="index-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="index-heading" className="font-display text-display-m text-type-primary">
              Open now
            </h2>
            <span data-mono className="text-mono text-type-secondary">
              {loading ? 'loading' : `${events.length} listed`}
            </span>
          </div>

          <div className="mt-8">
            <EventIndex events={events} userTier={userTier} loading={loading} compact />
          </div>
        </section>

        <EventRail events={events} />

        {/* How curation works. Numbered sequence, 8/4 at laptop. Never 3 cards. */}
        <section className="relative z-10 border-b border-rule py-12 lg:grid lg:grid-cols-12 lg:gap-6 lg:py-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-display-m text-type-primary">How it gets here</h2>
          </div>
          <Reveal as="ol" className="mt-8 lg:col-span-8 lg:mt-0" stagger={0.06}>
            {CURATION.map(({ n, title, body }) => (
              <li key={n} className="grid grid-cols-[48px_1fr] gap-4 border-t border-rule py-6">
                <span data-mono className="text-mono text-signal">
                  {n}
                </span>
                <div>
                  <h3 className="font-display text-title text-type-primary">{title}</h3>
                  <p className="mt-2 max-w-measure font-serif text-body text-type-secondary">{body}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </section>

        {/* Tier ledger. A table, not three cards. */}
        <section className="relative z-10 py-12 lg:py-16" aria-labelledby="tiers-heading">
          <h2 id="tiers-heading" className="font-display text-display-m text-type-primary">
            Tiers
          </h2>
          <p className="mt-4 max-w-tight font-serif text-body text-type-secondary">
            The limit that matters is how many events you can attend each month.
          </p>

          <table className="mt-8 w-full border-collapse text-left">
            <caption className="sr-only">Monthly limits and price by tier</caption>
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="py-3 font-sans text-label uppercase text-type-muted">
                  Tier
                </th>
                <th scope="col" className="py-3 font-sans text-label uppercase text-type-muted">
                  Events / month
                </th>
                <th scope="col" className="py-3 text-right font-sans text-label uppercase text-type-muted">
                  Monthly
                </th>
                <th scope="col" className="hidden py-3 text-right font-sans text-label uppercase text-type-muted lg:table-cell">
                  Annual
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'free' as const, name: 'Free', cap: '5' },
                { tier: 'basic_99' as const, name: 'Explorer', cap: '10' },
                { tier: 'premium_149' as const, name: 'Professional', cap: 'Highest' },
              ].map(({ tier, name, cap }) => (
                <tr
                  key={tier}
                  className={`border-b border-rule ${userTier === tier ? 'bg-ink-raised' : ''}`}
                >
                  <th scope="row" className="py-4 pl-3 font-display text-title uppercase text-type-primary">
                    {name}
                    {userTier === tier ? (
                      <span data-mono className="ml-2 text-mono text-signal">current</span>
                    ) : null}
                  </th>
                  <td data-mono className="py-4 text-mono text-type-primary">
                    {cap}
                  </td>
                  <td data-mono className="py-4 text-right text-mono text-type-primary">
                    {formatRupees(TIER_PRICING[tier].monthly)}
                  </td>
                  <td data-mono className="hidden py-4 text-right text-mono text-type-secondary lg:table-cell">
                    {TIER_PRICING[tier].annual > 0 ? formatRupees(TIER_PRICING[tier].annual) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Link
            href="/pricing"
            className="mt-8 inline-flex min-h-touch items-center border border-rule-strong px-6 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal"
          >
            Compare tiers in full
          </Link>
        </section>
      </main>
    </>
  )
}
