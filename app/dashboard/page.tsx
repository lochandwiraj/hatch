'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { EmptyState } from '@/components/ui/EmptyState'
import { Countdown } from '@/components/ui/Countdown'
import { AttendanceMeter } from '@/components/subscription/AttendanceMeter'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/supabase'
import { normalizeUserTier, tierName } from '@/lib/tier'
import { useRouter } from 'next/navigation'

type Registered = Views<'user_registered_events'>

/**
 * The dashboard. Operate mode: a student opens this to see what they are
 * registered for, what is due, and how much room they have left this month.
 *
 * It used to be a grid of equal-height tiles, each holding one short value and
 * a column of dead space, with "events this month" printed twice and a college
 * name set in 40px monospace that wrapped to five lines. Everything the reader
 * needs now sits in one status band and two ledgers.
 */
export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()

  // A college account has no student dashboard. Every sign-in path pushes to
  // /dashboard before the profile has loaded, so the role cannot be known at
  // the redirect; it is known here, and this is the one place every route into
  // the student dashboard passes through.
  const role = (profile as { role?: string } | null)?.role
  useEffect(() => {
    if (role === 'college') router.replace('/college')
  }, [role, router])
  const [registered, setRegistered] = useState<Registered[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [attendanceCap, setAttendanceCap] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_registered_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        setRegistered(data ?? [])
        setLoadingList(false)
      })
  }, [user])

  useEffect(() => {
    const tier = profile?.subscription_tier
    if (!tier) return
    supabase
      .rpc('get_attendance_limit', { tier })
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (!error && typeof data === 'number') setAttendanceCap(data)
      })
  }, [profile?.subscription_tier])

  useEffect(() => {
    const onFocus = () => {
      if (profile) refreshProfile()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [profile, refreshProfile])

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-ink">
        <Header />
        <p data-mono className="px-4 py-16 text-mono text-type-muted lg:px-12">
          Loading your dashboard
        </p>
      </div>
    )
  }

  const tier = normalizeUserTier(profile?.subscription_tier)
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const expires = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const daysLeft =
    expires && !Number.isNaN(expires.getTime())
      ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000))
      : null

  // Only deadlines still ahead. Listing closed ones made every row read
  // "Closed", which is noise rather than information.
  const now = Date.now()
  const deadlines = registered
    .filter((e) => e.registration_deadline && new Date(e.registration_deadline).getTime() > now)
    .sort((a, b) => String(a.registration_deadline).localeCompare(String(b.registration_deadline)))

  /** One row of the identity band. Values are sans unless they are a measurement. */
  const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
    // Label sits above its value at lg so the pair reads as one unit. Spreading
    // them to opposite ends of a wide column is what made the old row unreadable.
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 lg:block lg:border-0 lg:py-0">
      <dt className="font-sans text-label uppercase text-type-muted">{label}</dt>
      <dd className="truncate text-right font-sans text-ui-s text-type-primary lg:mt-1 lg:text-left">
        {children}
      </dd>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">
        <h1 className="font-display text-display-m text-type-primary">Hey, {firstName}</h1>

        {/* One status band. The cap is the number that decides what you can do,
            so it leads; the rest of the account sits under it as a quiet row. */}
        <section aria-label="Account status" className="mt-6 border border-rule">
          <div className="border-b border-rule px-4 py-3">
            <AttendanceMeter tier={tier} used={profile?.events_attended_this_month ?? 0} cap={attendanceCap} />
          </div>

          <dl className="grid grid-cols-1 gap-x-8 px-4 py-3 lg:grid-cols-4 lg:gap-y-0">
            <Fact label="Plan">
              <span className="inline-flex items-baseline gap-2">
                {tierName(tier)}
                {tier === 'free' ? (
                  <Link href="/subscription/upgrade" className="text-signal rule-underline">
                    upgrade
                  </Link>
                ) : null}
              </span>
            </Fact>
            <Fact label={daysLeft === null ? 'Renews' : 'Days left'}>
              {daysLeft === null ? (
                'No end date'
              ) : (
                <span data-mono className={daysLeft <= 7 ? 'text-deadline' : undefined}>
                  {daysLeft}
                </span>
              )}
            </Fact>
            <Fact label="Username">
              <span data-mono>@{profile?.username}</span>
            </Fact>
            <Fact label="College">{profile?.college || 'Not set'}</Fact>
          </dl>
        </section>

        {/* Registered. Empty is the common case on this product, so it gets a
            real screen rather than a blank region. */}
        <section className="mt-12" aria-labelledby="registered-heading">
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h2 id="registered-heading" className="font-display text-title uppercase text-type-primary">
              Registered
            </h2>
            <span data-mono className="text-mono text-type-secondary">
              {loadingList ? 'loading' : registered.length}
            </span>
          </div>

          {loadingList ? (
            <p data-mono className="py-4 text-mono text-type-muted">
              Loading
            </p>
          ) : registered.length === 0 ? (
            <EmptyState
              glyph="calendar"
              title="Nothing registered yet"
              detail="Every event here is published by hand. Browse the index and register for the ones worth your time."
              action={{ label: 'Browse events', href: '/events' }}
            />
          ) : (
            <ul>
              {registered.map((e) => (
                <li key={e.registration_id ?? e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="row-rule flex min-h-touch items-baseline justify-between gap-4 border-b border-rule py-3 pl-3"
                  >
                    <span className="min-w-0 truncate font-sans text-ui text-type-primary">{e.title}</span>
                    <span data-mono className="shrink-0 text-mono text-type-secondary">
                      {e.event_date ? e.event_date.slice(0, 10) : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deadlines. Only the registrations that actually carry one. */}
        {deadlines.length > 0 ? (
          <section className="mt-12" aria-labelledby="deadlines-heading">
            <h2
              id="deadlines-heading"
              className="border-b border-rule pb-2 font-display text-title uppercase text-type-primary"
            >
              Closing soon
            </h2>
            <ul>
              {deadlines.map((e) => (
                <li
                  key={e.registration_id ?? e.id}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                >
                  <span className="min-w-0 truncate font-sans text-ui text-type-primary">{e.title}</span>
                  <Countdown deadline={e.registration_deadline} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Destinations. A ruled index, not three cards of icon plus heading. */}
        <nav className="mt-12" aria-labelledby="go-heading">
          <h2 id="go-heading" className="border-b border-rule pb-2 font-display text-title uppercase text-type-primary">
            Go to
          </h2>
          <ul>
            {[
              { href: '/events', label: 'Events', note: 'The full index, filterable' },
              { href: '/calendar', label: 'Calendar', note: 'Your registrations by date' },
              { href: '/profile', label: 'Profile', note: 'Bio, skills and your PDF record' },
              { href: '/subscription', label: 'Subscription', note: 'Plan, billing and limits' },
            ].map(({ href, label, note }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="row-rule flex min-h-touch flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-3 pl-3"
                >
                  <span className="font-sans text-ui text-type-primary">{label}</span>
                  <span className="font-sans text-ui-s text-type-muted">{note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      </main>
    </div>
  )
}
