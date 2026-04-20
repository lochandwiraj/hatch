'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import EventCard from '@/components/events/EventCard'
import { motion } from 'motion/react'
import { MagnifyingGlassIcon, ArrowPathIcon, BoltIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { getEventLimitDescription } from '@/lib/utils'

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
}

const TIER_HIERARCHY: Record<string, string[]> = {
  free: ['free'],
  basic_99: ['free', 'basic_99'],
  premium_149: ['free', 'basic_99', 'premium_149'],
}

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }
const INPUT_STYLE = { background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')

  useEffect(() => { if (profile) loadEvents() }, [profile, filterTier])
  useEffect(() => {
    const interval = setInterval(() => { if (profile) loadEvents() }, 30000)
    return () => clearInterval(interval)
  }, [profile])
  useEffect(() => {
    const handle = () => { if (!document.hidden && profile) loadEvents() }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [profile])

  const loadEvents = async () => {
    if (!profile) return
    try {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').eq('status', 'published').order('event_date', { ascending: true })
      if (error) throw error
      const allowed = TIER_HIERARCHY[profile.subscription_tier] ?? ['free']
      let filtered = (data ?? []).filter(e => allowed.includes(e.required_tier))
      if (filterTier !== 'all') filtered = filtered.filter(e => e.required_tier === filterTier)
      setEvents(filtered)
    } catch { toast.error('Failed to load events') }
    finally { setLoading(false) }
  }

  const handleSearch = async () => {
    if (!profile || !searchQuery.trim()) { loadEvents(); return }
    try {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').eq('status', 'published').order('event_date', { ascending: true })
      if (error) throw error
      const allowed = TIER_HIERARCHY[profile.subscription_tier] ?? ['free']
      const q = searchQuery.toLowerCase()
      let filtered = (data ?? []).filter(e => allowed.includes(e.required_tier))
        .filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      if (filterTier !== 'all') filtered = filtered.filter(e => e.required_tier === filterTier)
      setEvents(filtered)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const [filterCategory, setFilterCategory] = useState('all')

  const categoryFilters = [
    { value: 'all', label: 'All' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'design', label: 'Design' },
    { value: 'tech', label: 'Tech' },
    { value: 'business', label: 'Business' },
    { value: 'competitive', label: 'Competitive' },
    { value: 'science', label: 'Science' },
    { value: 'startup', label: 'Startup' },
  ]

  const tierFilters = [
    { value: 'all', label: 'All tiers' },
    { value: 'free', label: 'Free' },
    { value: 'basic_99', label: 'Explorer' },
    { value: 'premium_149', label: 'Professional' },
  ] as const

  const displayedEvents = filterCategory === 'all'
    ? events
    : events.filter(e => e.category.toLowerCase().includes(filterCategory))

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Events</h1>
            <p className="text-sm text-zinc-500 mt-1">{getEventLimitDescription(profile.subscription_tier)}</p>
          </div>
          <motion.button onClick={loadEvents} disabled={loading} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
            style={CARD}>
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.04 }}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input type="text" placeholder="Search events, organizers, categories..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
              style={INPUT_STYLE} />
          </div>
          <motion.button onClick={handleSearch} disabled={loading} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm text-white font-medium rounded-xl disabled:opacity-50 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            Search
          </motion.button>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); loadEvents() }}
              className="px-3.5 py-2 text-sm text-zinc-400 hover:text-white rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              Clear
            </button>
          )}
        </motion.div>

        {/* Category chips — Luma-style */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.08 }}
          className="flex flex-wrap gap-2 mb-3"
        >
          {categoryFilters.map(f => (
            <button key={f.value} onClick={() => setFilterCategory(f.value)}
              className="text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all duration-200"
              style={filterCategory === f.value
                ? { background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }
                : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#71717a' }}>
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Tier filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-7"
        >
          {tierFilters.map(f => (
            <button key={f.value} onClick={() => setFilterTier(f.value as any)}
              className="text-[11px] px-3 py-1 rounded-full border transition-all duration-200 font-medium"
              style={filterTier === f.value
                ? { background: 'rgba(124,58,237,0.18)', borderColor: 'rgba(124,58,237,0.35)', color: '#a78bfa' }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#52525b' }}>
              {f.label}
            </button>
          ))}
          {events.length > 0 && (
            <span className="text-[11px] text-zinc-600 self-center ml-1">
              {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''}
            </span>
          )}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(10,10,18,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="h-44 bg-white/[0.04]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 rounded-full bg-white/[0.04] w-1/2" />
                  <div className="h-4 rounded-full bg-white/[0.05] w-full" />
                  <div className="h-4 rounded-full bg-white/[0.04] w-4/5" />
                  <div className="h-3 rounded-full bg-white/[0.03] w-2/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedEvents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {displayedEvents.map((event, i) => (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: i * 0.04 }}>
                <EventCard event={event} userTier={profile.subscription_tier} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={CARD}>
              <BoltIcon className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-white font-semibold mb-2">
              {searchQuery ? 'No events found' : filterCategory !== 'all' ? `No ${filterCategory} events` : 'No events available'}
            </p>
            <p className="text-sm text-zinc-500">
              {searchQuery ? 'Try different search terms or clear filters.' : filterCategory !== 'all' ? 'Try a different category above.' : 'New events drop weekly — check back soon.'}
            </p>
            {filterCategory !== 'all' && (
              <button onClick={() => setFilterCategory('all')} className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Show all categories
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
