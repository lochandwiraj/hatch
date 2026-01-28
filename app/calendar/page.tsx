'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import CircleLoader from '@/components/ui/CircleLoader'
import RollerLoader from '@/components/ui/RollerLoader'
import { formatTime } from '@/lib/utils'

interface RegisteredEvent {
  registration_id: string
  user_id: string
  registered_at: string
  registration_status: string
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

export default function CalendarPage() {
  const { profile, user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadRegisteredEvents()
    }
  }, [profile])

  const loadRegisteredEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_registered_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('event_date', { ascending: true })

      if (error) throw error
      setRegisteredEvents(data || [])
    } catch (error: any) {
      console.error('Error loading registered events:', error)
      toast.error('Failed to load registered events')
    } finally {
      setLoading(false)
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const hasEventOnDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return registeredEvents.some(event => 
      event.event_date.startsWith(dateStr)
    )
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return registeredEvents.filter(event => 
      event.event_date.startsWith(dateStr)
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center funky-events-background">
        <RollerLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen funky-events-background">
      {/* Header */}
      <header className="shadow-sm border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-cyan-400">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@hatch.in' || 
                user?.email === 'lochan@hatch.in') && (
                <>
                  <Link href="/admin/events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Users
                  </Link>
                  <Link href="/admin/payments" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-gray-300 hover:text-cyan-400">
                Events
              </Link>
              <Link href="/calendar" className="text-cyan-400 font-medium">
                Calendar
              </Link>
              <Link href="/subscription" className="text-gray-300 hover:text-cyan-400">
                Subscription
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-cyan-400">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="funky-calendar-card">
              {/* Calendar Header */}
              <div className="funky-calendar-header">
                <h2 className="text-xl font-bold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="funky-nav-button"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="funky-today-button"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="funky-nav-button"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="funky-calendar-body">
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-bold text-gray-800 uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`
                        funky-calendar-day
                        ${day && isToday(day) ? 'today' : ''}
                        ${day && hasEventOnDay(day) && !isToday(day) ? 'has-event' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <span className="text-sm font-bold">{day}</span>
                          {hasEventOnDay(day) && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-600 rounded mr-2 border border-black"></div>
                    <span className="text-gray-800">Today</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-cyan-400 rounded mr-2 border border-black"></div>
                    <span className="text-gray-800">Registered Events</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-auto font-bold">
                    Attendance is automatically tracked when events end
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered Events List */}
          <div className="lg:col-span-1">
            <div className="funky-events-list-card">
              <div className="funky-events-list-header">
                <CalendarDaysIcon className="h-6 w-6 mr-2" />
                Registered Events
              </div>

              <div className="funky-events-list-body">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse h-20 bg-gray-300 rounded-lg border-2 border-black"></div>
                    ))}
                  </div>
                ) : registeredEvents.length > 0 ? (
                  <div className="space-y-4">
                    {registeredEvents.map(event => (
                      <div key={event.registration_id} className="funky-event-item">
                        <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
                          {event.title}
                        </h4>
                        
                        <div className="space-y-1 text-sm text-gray-700 font-medium">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-2" />
                            <span>
                              {new Date(event.event_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {event.event_time && (
                              <span className="ml-2 text-purple-600 font-bold">
                                at {event.event_time}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span>{event.mode}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            <span>{event.organizer}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex space-x-2">
                          <Link href={`/events/${event.id}`} className="flex-1">
                            <button className="funky-event-button w-full">
                              View Details
                            </button>
                          </Link>
                          {event.event_link && (
                            <button
                              onClick={() => window.open(event.event_link, '_blank')}
                              className="funky-event-button primary flex-1"
                            >
                              Open Event
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="funky-empty-state">
                    <div className="funky-empty-icon"></div>
                    <p className="text-gray-700 font-bold mb-4">No registered events yet</p>
                    <Link href="/events">
                      <button className="funky-browse-events-button">
                        Browse Events
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}