'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Tables } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDateShort } from '@/lib/utils'
import EventComposer from './EventComposer'
import {
  AdminShell,
  AdminAction,
  AdminLoading,
  FilterChips,
  SortBar,
  RecordRow,
  RowAction,
  Meta,
  sortRecords,
  confirmDeleteEvent,
} from '@/components/admin/AdminUI'

type Event = Tables<'events'>

const tierLabel = (t: string | null) =>
  t === 'free' ? 'Free' : t === 'basic_99' ? 'Explorer' : 'Professional'
const tierStyle = (t: string | null) =>
  t === 'premium_149' ? 'text-verified border-verified' : 'text-type-secondary border-rule'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
] as const

const SORTS = [
  { key: 'event_date', label: 'Date' },
  { key: 'title', label: 'Title' },
  { key: 'required_tier', label: 'Tier' },
] as const

export default function AdminEventsPage() {
  const [sortKey, setSortKey] = useState<string>('event_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Manage Events links here as /admin/events?edit=<id>, which nothing read, so
  // its Edit button navigated and then did nothing.
  useEffect(() => {
    if (!events.length) return
    const id = new URLSearchParams(window.location.search).get('edit')
    if (!id) return
    const match = events.find((e) => e.id === id)
    if (match) setEditingEvent(match)
    else toast.error('That event no longer exists.')
    window.history.replaceState(null, '', '/admin/events')
  }, [events])

  const loadEvents = async () => {
    try {
      setLoading(true)
      let query = supabase.from('events').select('*').order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
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

  const rows = sortRecords(events as unknown as Record<string, unknown>[], sortKey, sortDir) as unknown as Event[]

  return (
    <>
      <AdminShell
        label="admin · events"
        title="Events"
        lede="Create, edit and publish what students see in the index."
        actions={
          <AdminAction glyph="plus" onClick={() => setShowAddModal(true)}>
            Add event
          </AdminAction>
        }
        stats={[
          { label: 'Total', value: events.length },
          { label: 'Published', value: events.filter((e) => e.status === 'published').length },
          { label: 'Drafts', value: events.filter((e) => e.status === 'draft').length },
          { label: 'Early access', value: events.filter((e) => e.is_early_access).length },
        ]}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3">
          <FilterChips legend="Status" options={FILTERS} value={filter} onChange={setFilter} />
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

        {loading ? (
          <AdminLoading what="events" />
        ) : rows.length === 0 ? (
          <EmptyState
            glyph="calendar"
            title="No events found"
            detail={filter === 'all' ? 'Create your first event to get started' : `No ${filter} events`}
          />
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
                  </>
                }
                meta={
                  <Meta
                    items={[
                      event.organizer,
                      event.category,
                      event.mode,
                      formatDateShort(event.event_date),
                    ]}
                  />
                }
                actions={
                  <>
                    {event.event_link ? (
                      <RowAction glyph="link-out" onClick={() => window.open(event.event_link ?? '', '_blank')}>
                        View
                      </RowAction>
                    ) : null}
                    <RowAction glyph="pencil" onClick={() => setEditingEvent(event)}>
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

      {showAddModal || editingEvent ? (
        <EventComposer
          event={editingEvent}
          onClose={() => {
            setShowAddModal(false)
            setEditingEvent(null)
          }}
          onSave={() => {
            loadEvents()
            setShowAddModal(false)
            setEditingEvent(null)
          }}
        />
      ) : null}
    </>
  )
}
