'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  PencilIcon,
  TrashIcon,
  LinkIcon,
  CalendarDaysIcon,
  TagIcon,
  EyeIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string
  event_link: string
  poster_image_url: string | null
  category: string
  tags: string[] | null
  event_date: string
  registration_deadline: string | null
  required_tier: 'free' | 'basic_99' | 'premium_149'
  status: 'draft' | 'published'
  is_early_access: boolean
  organizer: string
  prize_pool: string | null
  mode: string
  eligibility: string | null
  created_at: string
  updated_at: string
}

const ADMIN_EMAILS = ['dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in']
const tierLabel = (t: string) => t === 'free' ? 'Free' : t === 'basic_99' ? 'Explorer' : 'Professional'
const tierStyle = (t: string) => t === 'free' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : t === 'basic_99' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'

export default function AdminManageEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  useEffect(() => {
    if (isAdmin) loadEvents()
  }, [isAdmin, tierFilter, statusFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      if (error) throw error
      let filtered = data || []
      if (tierFilter !== 'all') filtered = filtered.filter(e => e.required_tier === tierFilter)
      if (statusFilter !== 'all') filtered = filtered.filter(e => e.status === statusFilter)
      setEvents(filtered)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      toast.success('Event deleted!')
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
      toast.success(`Event ${newStatus === 'published' ? 'published' : 'unpublished'}!`)
      loadEvents()
    } catch {
      toast.error('Failed to update event status')
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-white font-medium mb-2">Access Denied</p>
            <p className="text-zinc-500 text-sm mb-4">You don't have permission to access this page.</p>
            <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const allEvents = (() => {
    const { data: _ } = { data: events }
    return events
  })()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Manage Events</h1>
            <p className="text-sm text-zinc-500">View, edit, and manage all events across all tiers.</p>
          </div>
          <Link href="/admin/events" className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors">
            Add New Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: events.length, icon: CalendarDaysIcon },
            { label: 'Free', value: events.filter(e => e.required_tier === 'free').length, icon: TagIcon },
            { label: 'Explorer', value: events.filter(e => e.required_tier === 'basic_99').length, icon: UserGroupIcon },
            { label: 'Professional', value: events.filter(e => e.required_tier === 'premium_149').length, icon: StarIcon },
            { label: 'Published', value: events.filter(e => e.status === 'published').length, icon: EyeIcon },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
              <stat.icon className="w-4 h-4 text-zinc-600 mb-2" />
              <div className="text-2xl font-semibold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-2">Tier</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'free', 'basic_99', 'premium_149'] as const).map(f => (
                  <button key={f} onClick={() => setTierFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${tierFilter === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}>
                    {f === 'all' ? 'All' : tierLabel(f)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'published', 'draft'] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#111111] rounded-xl animate-pulse" />)}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-medium text-white">{event.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${event.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {event.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${tierStyle(event.required_tier)}`}>
                        {tierLabel(event.required_tier)}
                      </span>
                      {event.is_early_access && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">Early Access</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{event.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>{event.organizer}</span>
                      <span>{event.category}</span>
                      <span>{event.mode}</span>
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-white/[0.04] text-zinc-500 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                    {event.prize_pool && (
                      <div className="mt-2">
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Prize: {event.prize_pool}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {event.event_link && (
                      <button onClick={() => window.open(event.event_link, '_blank')} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                        <LinkIcon className="w-3.5 h-3.5" /> View
                      </button>
                    )}
                    <Link href={`/admin/events?edit=${event.id}`} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                      <PencilIcon className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => toggleStatus(event.id, event.status)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${event.status === 'published' ? 'text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]' : 'text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20'}`}
                    >
                      {event.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#111111] border border-white/[0.07] rounded-xl">
            <CalendarDaysIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">No events found</p>
            <p className="text-xs text-zinc-600">Try adjusting the filters</p>
          </div>
        )}

      </main>
    </div>
  )
}
