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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link href="/events" className="text-neutral-600 hover:text-primary-600">
                Events
              </Link>
              <Link href="/calendar" className="text-primary-600 font-medium">
                Calendar
              </Link>
              <Link href="/subscription" className="text-neutral-600 hover:text-primary-600">
                Subscription
              </Link>
              <Link href="/profile" className="text-neutral-600 hover:text-primary-600">
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
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-neutral-600">
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
                      aspect-square p-2 text-center text-sm relative
                      ${day ? 'hover:bg-neutral-50 cursor-pointer' : ''}
                      ${day && isToday(day) ? 'bg-primary-100 text-primary-800 font-bold rounded-lg' : ''}
                      ${day && hasEventOnDay(day) && !isToday(day) ? 'bg-success-100 text-success-800 font-medium rounded-lg' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <span>{day}</span>
                        {hasEventOnDay(day) && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-1.5 h-1.5 bg-success-600 rounded-full"></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-primary-100 rounded mr-2"></div>
                  <span className="text-neutral-600">Today</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-success-100 rounded mr-2"></div>
                  <span className="text-neutral-600">Registered Events</span>
                </div>
                <div className="text-xs text-neutral-500 ml-auto">
                  💡 Attendance is automatically tracked when events end
                </div>
              </div>
            </div>
          </div>

          {/* Registered Events List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <CalendarDaysIcon className="h-6 w-6 text-primary-600 mr-2" />
                Registered Events
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-neutral-200 rounded-lg"></div>
                  ))}
                </div>
              ) : registeredEvents.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {registeredEvents.map(event => (
                    <div key={event.registration_id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
                      <h4 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
                        {event.title}
                      </h4>
                      
                      <div className="space-y-1 text-sm text-neutral-600">
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
                            <span className="ml-2 text-primary-600 font-medium">
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
                          <button className="w-full px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50 transition-colors">
                            View Details
                          </button>
                        </Link>
                        {event.event_link && (
                          <button
                            onClick={() => window.open(event.event_link, '_blank')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
                          >
                            Open Event
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 mb-4">No registered events yet</p>
                  <Link href="/events">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
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
  )
}