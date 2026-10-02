'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Tables } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDateShort } from '@/lib/utils'
import {
  AdminShell,
  AdminAction,
  AdminLoading,
  FilterChips,
  SortBar,
  RecordRow,
  RowAction,
  Meta,
  useIsAdmin,
  sortRecords,
  confirmDeleteEvent,
} from '@/components/admin/AdminUI'

type Event = Tables<'events'>

const tierLabel = (t: string | null) =>
  t === 'free' ? 'Free' : t === 'basic_99' ? 'Explorer' : 'Professional'
const tierStyle = (t: string | null) =>
  t === 'premium_149' ? 'text-verified border-verified' : 'text-type-secondary border-rule'

const TIER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'basic_99', label: 'Explorer' },
  { value: 'premium_149', label: 'Professional' },
] as const

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
] as const

const SORTS = [
  { key: 'event_date', label: 'Date' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
] as const

export default function AdminManageEventsPage() {
  const [sortKey, setSortKey] = useState<string>('event_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const isAdmin = useIsAdmin()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    if (isAdmin) loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tierFilter, statusFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      let filtered = data || []
      if (tierFilter !== 'all') filtered = filtered.filter((e) => e.required_tier === tierFilter)
      if (statusFilter !== 'all') filtered = filtered.filter((e) => (e.status ?? '') === statusFilter)
      setEvents(filtered)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string, title: string) => {
    if (!(await confirmDeleteEvent(supabase, eventId, title))) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      toast.success('Event deleted.')
      loadEvents()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const toggleStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId)
      if (error) throw error
      toast.success(newStatus === 'published' ? 'Event published.' : 'Event unpublished.')
      loadEvents()
    } catch {
      toast.error('Failed to update event status')
    }
  }

  const rows = sortRecords(
    events as unknown as Record<string, unknown>[],
    sortKey,
    sortDir
  ) as unknown as Event[]

  return (
    <AdminShell
      label="admin · manage"
      title="Manage events"
      lede="The whole catalogue across every tier, with the blast radius shown before anything is deleted."
      actions={
        <AdminAction glyph="plus" href="/admin/events">
          Add event
        </AdminAction>
      }
      stats={[
        { label: 'Total', value: events.length },
        { label: 'Free', value: events.filter((e) => e.required_tier === 'free').length },
        { label: 'Explorer', value: events.filter((e) => e.required_tier === 'basic_99').length },
        { label: 'Professional', value: events.filter((e) => e.required_tier === 'premium_149').length },
        { label: 'Published', value: events.filter((e) => e.status === 'published').length },
      ]}
    >
      <div className="space-y-3 border-b border-rule pb-3">
        <FilterChips legend="Tier" options={TIER_FILTERS} value={tierFilter} onChange={setTierFilter} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterChips legend="Status" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          <SortBar
            options={SORTS}
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => {
              setSortKey(k)
              setSortDir(d)
            }}
          />
        </div>
      </div>

      {loading ? (
        <AdminLoading what="events" />
      ) : rows.length === 0 ? (
        <EmptyState glyph="calendar" title="No events found" detail="Try adjusting the filters" />
      ) : (
        <ul>
          {rows.map((event) => (
            <RecordRow
              key={event.id}
              title={event.title ?? ''}
              badges={
                <>
                  <span
                    className={`border px-2 py-px font-sans text-label uppercase ${
                      event.status === 'published'
                        ? 'text-verified border-verified'
                        : 'text-type-secondary border-rule'
                    }`}
                  >
                    {event.status ?? ''}
                  </span>
                  <span className={`border px-2 py-px font-sans text-label uppercase ${tierStyle(event.required_tier)}`}>
                    {tierLabel(event.required_tier)}
                  </span>
                  {event.is_early_access ? (
                    <span className="border border-signal px-2 py-px font-sans text-label uppercase text-signal">
                      Early access
                    </span>
                  ) : null}
                  {event.prize_pool ? (
                    <span className="border border-verified px-2 py-px font-sans text-label uppercase text-verified">
                      {event.prize_pool}
                    </span>
                  ) : null}
                </>
              }
              meta={
                <Meta
                  items={[event.organizer, event.category, event.mode, formatDateShort(event.event_date)]}
                />
              }
              actions={
                <>
                  {event.event_link ? (
                    <RowAction glyph="link-out" onClick={() => window.open(event.event_link ?? '', '_blank')}>
                      View
                    </RowAction>
                  ) : null}
                  <RowAction glyph="pencil" href={`/admin/events?edit=${event.id}`}>
                    Edit
                  </RowAction>
                  <RowAction onClick={() => toggleStatus(event.id, event.status ?? '')}>
                    {event.status === 'published' ? 'Unpublish' : 'Publish'}
                  </RowAction>
                  <RowAction danger glyph="trash" onClick={() => deleteEvent(event.id, event.title ?? '')}>
                    Delete
                  </RowAction>
                </>
              }
            />
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
