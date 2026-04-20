'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import { motion } from 'motion/react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface RegisteredEvent {
  registration_id: string
  user_id: string
  registered_at: string
  id: string
  title: string
  description: string
  event_link: string
  event_date: string
  event_time: string | null
  category: string
  organizer: string
  mode: string
  required_tier: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }
const CARD_INNER = { background: 'rgba(5,5,10,0.6)', border: '1px solid rgba(255,255,255,0.05)' }

export default function CalendarPage() {
  const { profile, user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) loadRegisteredEvents() }, [profile])

  const loadRegisteredEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('user_registered_events').select('*')
        .eq('user_id', user?.id).order('event_date', { ascending: true })
      if (error) throw error
      setRegisteredEvents(data ?? [])
    } catch { toast.error('Failed to load registered events') }
    finally { setLoading(false) }
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const isToday = (day: number) => {
    const t = new Date()
    return day === t.getDate() && currentDate.getMonth() === t.getMonth() && currentDate.getFullYear() === t.getFullYear()
  }
  const getEventsForDay = (day: number) => {
    const ds = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return registeredEvents.filter(e => e.event_date.startsWith(ds))
  }
  const calendarCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const navigate = (dir: -1 | 1) => setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + dir); return n })

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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="mb-6"
        >
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Calendar</h1>
          <p className="text-sm text-zinc-500">Your registered events at a glance.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
            className="lg:col-span-2 rounded-2xl p-5"
            style={CARD}
          >
            {/* Nav */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={() => navigate(-1)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  Today
                </button>
                <button onClick={() => navigate(1)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs text-zinc-600 py-1 font-medium">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (!day) return <div key={i} />
                const events = getEventsForDay(day)
                const today = isToday(day)
                return (
                  <motion.div key={i} whileHover={!today ? { scale: 1.08 } : {}}
                    transition={{ duration: 0.15 }}
                    className="relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 cursor-default"
                    style={today
                      ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }
                      : events.length > 0
                      ? { background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }
                      : { color: '#52525b' }}>
                    {day}
                    {events.length > 0 && !today && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }} />
                <span className="text-xs text-zinc-600">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }} />
                <span className="text-xs text-zinc-600">Has event</span>
              </div>
            </div>
          </motion.div>

          {/* Event list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            className="rounded-2xl p-5"
            style={CARD}
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarDaysIcon className="w-4 h-4 text-zinc-600" />
              <h2 className="text-sm font-bold text-white">Registered events</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : registeredEvents.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {registeredEvents.map((event, i) => (
                  <motion.div key={event.registration_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="rounded-xl p-3" style={CARD_INNER}>
                    <p className="text-sm text-white font-semibold line-clamp-1 mb-2">{event.title}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                        <span className="text-xs text-zinc-500">
                          {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {event.event_time && ` · ${event.event_time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                        <span className="text-xs text-zinc-500">{event.mode}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserGroupIcon className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                        <span className="text-xs text-zinc-500 truncate">{event.organizer}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CalendarDaysIcon className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 mb-2">No registered events</p>
                <a href="/events" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Browse events →
                </a>
              </div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  )
}
