'use client'

import { useState, useEffect } from 'react'
import { FlipTarget } from '@/components/motion/FlipTarget'
import { AttendanceMeter } from '@/components/subscription/AttendanceMeter'
import { normalizeUserTier } from '@/lib/tier'
import type { Tables } from '@/lib/supabase'
import { Glyph } from '@/components/ui/Glyph'
import { Countdown } from '@/components/ui/Countdown'
import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import RegistrationConfirmationModal from '@/components/events/RegistrationConfirmationModal'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDateShort, formatTime, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'
import { categoryInk } from '@/components/events/DataPlate'

type Event = Tables<'events'>



export default function EventDetailsPage() {
  const [attendanceCap, setAttendanceCap] = useState<number | null>(null)
  const { profile, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const eventId = params.id as string


  useEffect(() => {
    const tier = profile?.subscription_tier
    if (!tier) return
    supabase
      .rpc('get_attendance_limit', { tier })
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (!error && typeof data === 'number') setAttendanceCap(data)
      })
  }, [profile?.subscription_tier])
  useEffect(() => { if (eventId && profile) loadEvent() }, [eventId, profile])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).eq('status', 'published').single()
      if (error) {
        if (error.code === 'PGRST116') setNotFound(true)
        else throw error
        return
      }
      if (!isEventAccessible(data.required_tier, profile?.subscription_tier ?? 'free')) {
        toast.error('Upgrade your subscription to view this event')
        router.push('/subscription/upgrade')
        return
      }
      setEvent(data)
    } catch {
      toast.error('Failed to load event details')
      setNotFound(true)
    } finally { setLoading(false) }
  }

  const handleRegisterClick = () => {
    if (!event?.event_link) return
    window.open((event.event_link ?? ''), '_blank')
    setTimeout(() => setShowRegistrationModal(true), 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto w-full max-w-[1200px] px-4 py-16 lg:px-12">
          <p data-mono className="text-mono text-signal">404</p>
          <h1 className="mt-3 font-display text-display-m text-type-primary">Event not found</h1>
          <p className="mt-3 max-w-tight font-serif text-body text-type-secondary">
            This event does not exist, or it has been archived. Past events are removed from the index
            automatically once their date passes.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-flex min-h-touch items-center border border-rule-strong px-6 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal"
          >
            Back to the index
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.event_date)
  const isUpcoming = eventDate > new Date()
  const isPast = eventDate < new Date()
  const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null
  const isRegistrationOpen = !registrationDeadline || registrationDeadline > new Date()
  const ink = categoryInk(event.category ?? '')
  const canRegister = isUpcoming && isRegistrationOpen && Boolean(event.event_link)

  /** The facts, in the order a student actually asks them. */
  const facts = [
    { k: 'Date', v: formatDateShort(event.event_date), mono: true },
    { k: 'Time', v: formatTime(event.event_date), mono: true },
    { k: 'Mode', v: event.mode || 'Not set', mono: false },
    ...(registrationDeadline
      ? [{ k: 'Closes', v: formatDateShort(event.registration_deadline!), mono: true }]
      : []),
    ...(event.prize_pool ? [{ k: 'Prize', v: event.prize_pool, mono: true }] : []),
    { k: 'Access', v: getSubscriptionTierName(event.required_tier), mono: false },
  ]

  const paragraphs = (event.description ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-ink">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-32 pt-6 lg:px-12 lg:pb-16">
        {/* Back first, so leaving never means hunting for the browser button. */}
        <Link
          href="/events"
          className="inline-flex min-h-touch items-center gap-2 font-sans text-ui-s text-type-secondary hover:text-signal active:text-signal"
        >
          <Glyph name="arrow-left" size={14} />
          Index
        </Link>

        {/* Masthead. The title travels here from the row that was clicked, so
            it carries the Flip and nothing else competes with it. */}
        <FlipTarget id={event.id} className="mt-6 block">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-sans text-label uppercase" style={{ color: ink }}>
              {event.category || 'Uncategorised'}
            </span>
            {event.is_early_access && isUpcoming ? (
              <span className="border border-signal px-2 py-px font-sans text-label uppercase text-signal">
                Early access
              </span>
            ) : null}
            {isPast ? (
              <span className="border border-rule px-2 py-px font-sans text-label uppercase text-type-muted">
                Ended
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 break-words font-display text-display-l text-type-primary">{event.title}</h1>

          {event.organizer ? (
            <p className="mt-3 break-words font-sans text-body text-type-secondary">
              <span className="text-type-primary">{event.organizer}</span>
            </p>
          ) : null}
        </FlipTarget>

        {/* The category rule. One hairline of colour, the only colour on the page. */}
        <div className="mt-6 h-px w-full" style={{ background: ink }} aria-hidden />

        {/* Facts, as a ledger across the full width. */}
        <dl className="flex flex-wrap border-b border-rule">
          {facts.map(({ k, v, mono }) => (
            <div key={k} className="grow basis-[132px] border-b border-r border-rule px-3 py-3 last:border-r-0">
              <dt className="font-sans text-label uppercase text-type-muted">{k}</dt>
              <dd
                className={`mt-1 truncate ${mono ? 'text-mono' : 'font-sans text-ui-s'} text-type-primary`}
                {...(mono ? { 'data-mono': true } : {})}
                title={String(v)}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* The reading column. */}
          <div className="lg:col-span-7">
            <h2 className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
              About
            </h2>
            <div className="mt-6 max-w-measure space-y-6">
              {paragraphs.length ? (
                paragraphs.map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap break-words font-serif text-body-l text-type-primary">
                    {para}
                  </p>
                ))
              ) : (
                <p className="font-serif text-body text-type-secondary">
                  No description was published for this event.
                </p>
              )}
            </div>

            {event.eligibility ? (
              <section className="mt-12">
                <h2 className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
                  Who can enter
                </h2>
                <p className="mt-4 max-w-measure break-words font-serif text-body text-type-secondary">
                  {event.eligibility}
                </p>
              </section>
            ) : null}

            {event.tags?.length ? (
              <section className="mt-12">
                <h2 className="border-b border-rule-strong pb-2 font-display text-title uppercase text-type-primary">
                  Tags
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <li
                      key={tag}
                      className="border border-rule px-2 py-1 font-sans text-ui-s text-type-secondary"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* The decision column. Everything needed to say yes, in one place. */}
          <aside className="mt-12 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
            {event.poster_image_url ? (
              <img
                src={event.poster_image_url}
                alt={event.title ?? ""}
                className="mb-4 w-full border border-rule"
              />
            ) : null}

            <div className="border border-rule-strong">
              <div className="border-b border-rule px-4 py-3">
                <p className="font-sans text-label uppercase text-type-muted">Status</p>
                <p className="mt-1 font-sans text-ui text-type-primary">
                  {isPast ? 'This event has ended' : isRegistrationOpen ? 'Registration open' : 'Registration closed'}
                </p>
                {registrationDeadline && isUpcoming && isRegistrationOpen ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-sans text-ui-s text-type-muted">Closes in</span>
                    <Countdown deadline={event.registration_deadline} />
                  </div>
                ) : null}
              </div>

              <div className="border-b border-rule px-4 py-3">
                <AttendanceMeter
                  tier={normalizeUserTier(profile?.subscription_tier)}
                  used={profile?.events_attended_this_month ?? 0}
                  cap={attendanceCap}
                />
              </div>

              {/* Laptop action. The phone gets the pinned bar below instead. */}
              <div className="hidden px-4 py-4 lg:block">
                {canRegister ? (
                  <button
                    onClick={handleRegisterClick}
                    className="inline-flex min-h-touch w-full items-center justify-center gap-2 border border-signal bg-signal px-4 py-3 font-sans text-ui font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
                  >
                    Register
                    <Glyph name="link-out" size={14} />
                  </button>
                ) : (
                  <p className="border border-rule px-4 py-3 text-center font-sans text-ui-s text-type-muted">
                    {isPast ? 'Event ended' : !event.event_link ? 'No registration link' : 'Registration closed'}
                  </p>
                )}
                <p className="mt-2 font-sans text-ui-s text-type-muted">
                  {canRegister ? 'Opens the organizer’s page in a new tab.' : 'Browse the index for events still open.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Phone: the action stays in thumb reach without covering the text. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-ink px-4 py-3 lg:hidden">
        {canRegister ? (
          <button
            onClick={handleRegisterClick}
            className="inline-flex min-h-touch w-full items-center justify-center gap-2 border border-signal bg-signal px-4 py-3 font-sans text-ui font-medium text-ink active:bg-ink active:text-signal"
          >
            Register
            <Glyph name="link-out" size={14} />
          </button>
        ) : (
          <p className="border border-rule px-4 py-3 text-center font-sans text-ui-s text-type-muted">
            {isPast ? 'Event ended' : !event.event_link ? 'No registration link' : 'Registration closed'}
          </p>
        )}
      </div>

      <RegistrationConfirmationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        event={event}
      />
    </div>
  )
}
