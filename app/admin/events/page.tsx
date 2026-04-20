'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  CalendarDaysIcon,
  TagIcon,
  EyeIcon,
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
  event_time: string | null
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

export default function AdminEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  useEffect(() => {
    if (isAdmin) loadEvents()
  }, [isAdmin, filter])

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

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      toast.success('Event deleted successfully!')
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Event Management</h1>
            <p className="text-sm text-zinc-500">Create, edit, and manage events.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: events.length, icon: CalendarDaysIcon },
            { label: 'Published', value: events.filter(e => e.status === 'published').length, icon: EyeIcon },
            { label: 'Drafts', value: events.filter(e => e.status === 'draft').length, icon: PencilIcon },
            { label: 'Early Access', value: events.filter(e => e.is_early_access).length, icon: TagIcon },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
              <stat.icon className="w-4 h-4 text-zinc-600 mb-2" />
              <div className="text-2xl font-semibold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5">
          {(['all', 'published', 'draft'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
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
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {event.event_link && (
                      <button onClick={() => window.open(event.event_link, '_blank')} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                        <LinkIcon className="w-3.5 h-3.5" /> View
                      </button>
                    )}
                    <button onClick={() => setEditingEvent(event)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                      <PencilIcon className="w-3.5 h-3.5" /> Edit
                    </button>
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
            <p className="text-xs text-zinc-600">
              {filter === 'all' ? 'Create your first event to get started' : `No ${filter} events`}
            </p>
          </div>
        )}

      </main>

      {(showAddModal || editingEvent) && (
        <EventModal
          event={editingEvent}
          onClose={() => { setShowAddModal(false); setEditingEvent(null) }}
          onSave={() => { loadEvents(); setShowAddModal(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}

interface EventModalProps {
  event?: Event | null
  onClose: () => void
  onSave: () => void
}

function EventModal({ event, onClose, onSave }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_link: event?.event_link || '',
    poster_image_url: event?.poster_image_url || '',
    category: event?.category || '',
    tags: event?.tags?.join(', ') || '',
    event_date: event?.event_date?.split('T')[0] || '',
    event_time: event?.event_time || '10:00',
    registration_deadline: event?.registration_deadline?.split('T')[0] || '',
    required_tier: (event?.required_tier || 'free') as 'free' | 'basic_99' | 'premium_149',
    status: (event?.status || 'draft') as 'draft' | 'published',
    is_early_access: event?.is_early_access || false,
    organizer: event?.organizer || '',
    prize_pool: event?.prize_pool || '',
    mode: event?.mode || '',
    eligibility: event?.eligibility || '',
  })
  const [saving, setSaving] = useState(false)

  const inputCls = "w-full bg-[#080808] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
  const labelCls = "block text-xs text-zinc-400 mb-1.5"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_link: formData.event_link,
        poster_image_url: formData.poster_image_url || null,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
        required_tier: formData.required_tier,
        status: formData.status,
        is_early_access: formData.is_early_access,
        organizer: formData.organizer,
        prize_pool: formData.prize_pool || null,
        mode: formData.mode,
        eligibility: formData.eligibility || null,
      }
      if (event) {
        const { error } = await supabase.from('events').update(eventData).eq('id', event.id)
        if (error) throw error
        toast.success('Event updated successfully!')
      } else {
        const { error } = await supabase.from('events').insert([eventData])
        if (error) throw error
        toast.success('Event created successfully!')
      }
      onSave()
    } catch {
      toast.error(`Failed to ${event ? 'update' : 'create'} event`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-white/[0.07] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-base font-medium text-white mb-5">{event ? 'Edit Event' : 'Add New Event'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Event Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Description *</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Organizer *</label>
                <input type="text" required value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputCls}>
                  <option value="">Select Category</option>
                  {['Hackathon','Conference','Workshop','Competition','Networking','Career Fair','Webinar','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Event Date *</label>
                <input type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Event Time *</label>
                <input type="time" required value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Registration Deadline</label>
                <input type="date" value={formData.registration_deadline} onChange={e => setFormData({...formData, registration_deadline: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Required Tier *</label>
                <select required value={formData.required_tier} onChange={e => setFormData({...formData, required_tier: e.target.value as any})} className={inputCls}>
                  <option value="free">Free</option>
                  <option value="basic_99">Explorer (₹99)</option>
                  <option value="premium_149">Professional (₹149)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Mode *</label>
                <select required value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className={inputCls}>
                  <option value="">Select Mode</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Event Link</label>
                <input type="url" value={formData.event_link} onChange={e => setFormData({...formData, event_link: e.target.value})} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className={labelCls}>Tags (comma separated)</label>
                <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className={inputCls} placeholder="React, JavaScript, Frontend" />
              </div>
              <div>
                <label className={labelCls}>Prize Pool</label>
                <input type="text" value={formData.prize_pool} onChange={e => setFormData({...formData, prize_pool: e.target.value})} className={inputCls} placeholder="₹50,000" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Eligibility</label>
                <input type="text" value={formData.eligibility} onChange={e => setFormData({...formData, eligibility: e.target.value})} className={inputCls} placeholder="Open to all students" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="early_access" checked={formData.is_early_access} onChange={e => setFormData({...formData, is_early_access: e.target.checked})} className="accent-violet-600" />
                <label htmlFor="early_access" className="text-xs text-zinc-400">Early Access Event</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="text-sm text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
