'use client'

import { useState, useEffect } from 'react'
import { EventIndex } from '@/components/events/EventIndex'
import type { EventRowData } from '@/components/events/EventRow'
import { Sheet } from '@/components/ui/Sheet'
import { normalizeUserTier, normalizeRequiredTier } from '@/lib/tier'
import type { Tables } from '@/lib/supabase'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import { EventRow } from '@/components/events/EventRow'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { getEventLimitDescription } from '@/lib/utils'

type Event = Tables<'events'>

const TIER_HIERARCHY: Record<string, string[]> = {
  free: ['free'],
  basic_99: ['free', 'basic_99'],
  premium_149: ['free', 'basic_99', 'premium_149'],
}

const CARD = { background: 'var(--ink-raised)', border: '1px solid var(--rule)' }
const INPUT_STYLE = { background: 'var(--ink-raised)', border: '1px solid var(--rule)' }

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  /**
   * The index refreshes every 30 seconds and whenever the tab regains focus,
   * which is wanted. What was not wanted: each of those refreshes set the same
   * flag the very first paint uses, and EventIndex swaps the entire list for
   * the words "Fetching events" while that flag is true. So the rows vanished
   * and came back twice a minute, and again every time the tab was looked at.
   *
   * Only the first load may blank the list. A refresh swaps the data
   * underneath the rows, and an automatic one that fails leaves what is
   * already on screen alone instead of announcing itself.
   */
  const loadEvents = async (mode: 'initial' | 'manual' | 'auto' = 'initial') => {
    if (!profile) return
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    try {
      const { data, error } = await supabase.from('events').select('*').eq('status', 'published').order('event_date', { ascending: true })
      if (error) throw error
      // Every published event is listed. Ones above the user's tier render
      // locked rather than being filtered away, so the thing being paid for
      // is actually visible.
      setEvents(data ?? [])
    } catch {
      if (mode !== 'auto') toast.error('Failed to load events')
    } finally {
      if (mode === 'initial') setLoading(false)
      else setRefreshing(false)
    }
  }

  // Keyed on the id rather than the profile object: AuthProvider hands back a
  // new object whenever it refreshes, and that re-ran all three of these.
  const profileId = profile?.id

  useEffect(() => {
    if (profileId) loadEvents('initial')
  }, [profileId])

  useEffect(() => {
    if (!profileId) return
    const interval = setInterval(() => loadEvents('auto'), 30000)
    return () => clearInterval(interval)
  }, [profileId])

  useEffect(() => {
    if (!profileId) return
    const handle = () => {
      if (!document.hidden) loadEvents('auto')
    }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [profileId])

  if (!profile) {
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-display-m font-extrabold text-type-primary tracking-tight">Events</h1>
            <p className="text-ui text-type-muted mt-1">{getEventLimitDescription(profile.subscription_tier)}</p>
          </div>
          <button onClick={() => loadEvents('manual')} disabled={loading || refreshing} className="flex items-center gap-2 text-ui text-type-secondary hover:text-type-primary px-4 py-2 disabled:opacity-50 self-start md:self-auto"
            style={CARD}>
            <Glyph name="refresh" className={`w-4 h-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* One filterable ledger, shared with the landing page. It owns the
            five filters, the Flip relayout and the empty state, so the two
            surfaces cannot drift apart the way they had. */}
        {/* Gated to the plan: Free sees free listings, Explorer sees free and
            Explorer, Professional sees all three. The landing page still shows
            everything, so the paid listings remain visible to a visitor. */}
        <EventIndex
          events={events as unknown as EventRowData[]}
          userTier={normalizeUserTier(profile.subscription_tier)}
          loading={loading}
          accessibleOnly
        />

      </main>
    </div>
  )
}
