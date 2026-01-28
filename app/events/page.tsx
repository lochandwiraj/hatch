'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import EventCard from '@/components/events/EventCard'
import Button from '@/components/ui/Button'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { getSubscriptionTierName, getEventLimit, getEventLimitDescription } from '@/lib/utils'
import CircleLoader from '@/components/ui/CircleLoader'

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

// Mock events data for now
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'React Conf 2024',
    description: 'Join us for the biggest React conference of the year with industry experts sharing the latest trends and best practices.',
    event_link: 'https://reactconf.com',
    poster_image_url: null,
    category: 'Conference',
    tags: ['React', 'JavaScript', 'Frontend'],
    event_date: '2024-03-15T10:00:00Z',
    event_time: '10:00',
    registration_deadline: '2024-03-10T23:59:59Z',
    required_tier: 'free',
    status: 'published',
    is_early_access: false,
    organizer: 'React Team',
    prize_pool: null,
    mode: 'Hybrid',
    eligibility: 'Open to all developers'
  },
  {
    id: '2',
    title: 'AI/ML Workshop',
    description: 'Hands-on workshop covering machine learning fundamentals and practical applications using Python and TensorFlow.',
    event_link: 'https://aiworkshop.com',
    poster_image_url: null,
    category: 'Workshop',
    tags: ['AI', 'ML', 'Python'],
    event_date: '2024-03-20T14:00:00Z',
    event_time: '14:00',
    registration_deadline: '2024-03-18T23:59:59Z',
    required_tier: 'basic_99',
    status: 'published',
    is_early_access: false,
    organizer: 'AI Academy',
    prize_pool: null,
    mode: 'Online',
    eligibility: 'Basic programming knowledge required'
  },
  {
    id: '3',
    title: 'Startup Pitch Competition',
    description: 'Present your startup idea to a panel of investors and win up to $50,000 in funding.',
    event_link: 'https://startuppitch.com',
    poster_image_url: null,
    category: 'Competition',
    tags: ['Startup', 'Pitch', 'Investment'],
    event_date: '2024-03-25T18:00:00Z',
    event_time: '18:00',
    registration_deadline: '2024-03-20T23:59:59Z',
    required_tier: 'premium_149',
    status: 'published',
    is_early_access: true,
    organizer: 'Startup Hub',
    prize_pool: '$50,000',
    mode: 'Offline',
    eligibility: 'Early-stage startups only'
  }
]

export default function EventsPage() {
  const { profile, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    loadEvents()
    if (profile) {
      loadUserStats()
    }
  }, [profile, filterTier])

  // Initialization effect
  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        // Any initialization code can go here
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [profile])

  const loadUserStats = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('user_attendance_stats')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (error) {
        // If the view doesn't exist yet, create a fallback stats object
        if (error.code === '42P01') { // relation does not exist
          console.log('Attendance system not yet set up - using fallback stats')
          setUserStats({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            subscription_tier: profile.subscription_tier,
            events_attended: 0,
            total_events_attended: 0,
            event_access: getEventLimit(profile.subscription_tier)
          })
          return
        }
        throw error
      }
      setUserStats(data)
    } catch (error) {
      console.error('Error loading user stats:', error)
      // Fallback stats
      setUserStats({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        subscription_tier: profile.subscription_tier,
        events_attended: 0,
        total_events_attended: 0,
        event_access: getEventLimit(profile.subscription_tier)
      })
    }
  }

  // Auto-refresh events every 30 seconds to catch admin changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile) {
        loadEvents()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [profile])

  // Add visibility change listener to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && profile) {
        loadEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [profile])

  // Refresh profile data every 15 seconds to catch tier changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile) {
        // This will trigger a re-render with updated tier info
        window.location.reload()
      }
    }, 60000) // 1 minute - less frequent to avoid too many reloads

    return () => clearInterval(interval)
  }, [profile])

  const loadEvents = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      console.log('Loading events for user:', profile.subscription_tier)
      
      // Load events from database
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Raw events from database:', data)

      // Filter events based on user's subscription tier (hierarchical access)
      const tierHierarchy = {
        free: ['free'],
        basic_99: ['free', 'basic_99'], // Explorer can see Free + Explorer events
        premium_149: ['free', 'basic_99', 'premium_149'] // Professional can see all events
      }
      
      const allowedTiers = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || ['free']
      console.log('User tier:', profile.subscription_tier, 'Allowed tiers:', allowedTiers)
      
      let filteredEvents = (data || []).filter(event => 
        allowedTiers.includes(event.required_tier)
      )

      console.log('Filtered events:', filteredEvents)

      // Apply additional tier filter if not 'all'
      if (filterTier !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredEvents)
    } catch (error: any) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events from database')
      
      // Fallback to mock events with tier filtering
      const tierHierarchy = {
        free: ['free'],
        basic_99: ['free', 'basic_99'],
        premium_149: ['free', 'basic_99', 'premium_149']
      }
      
      const allowedTiers = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || ['free']
      
      let filteredEvents = mockEvents.filter(event => 
        allowedTiers.includes(event.required_tier)
      )

      if (filterTier !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredEvents)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!profile || !searchQuery.trim()) {
      loadEvents()
      return
    }

    try {
      setLoading(true)
      
      // Load events from database with search
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      // Filter events based on user's subscription tier
      const tierHierarchy = {
        free: ['free'],
        basic_99: ['free', 'basic_99'],
        premium_149: ['free', 'basic_99', 'premium_149']
      }
      
      const allowedTiers = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] || ['free']
      
      let filteredEvents = (data || []).filter(event => 
        allowedTiers.includes(event.required_tier)
      )

      // Apply search filter
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Apply tier filter if not 'all'
      if (filterTier !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredEvents)
    } catch (error: any) {
      console.error('Error searching events:', error)
      toast.error('Failed to search events')
      
      // Fallback to mock events
      const searchResults = mockEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      let filteredData = searchResults
      if (filterTier !== 'all') {
        filteredData = searchResults.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredData)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    loadEvents()
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <CircleLoader />
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
              <Link href="/events" className="text-cyan-400 font-medium">
                Events
              </Link>
              <Link href="/calendar" className="text-gray-300 hover:text-cyan-400">
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Events</h1>
              <p className="text-gray-400 mt-1">
                Discover and register for events in your community
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button
                className="white-btn"
                onClick={loadEvents}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Events'}
              </button>
            </div>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="activity-card">
              <div className="activity-card-header">
                Your Event Activity
              </div>
              <div className="activity-stats-grid">
                <div className="activity-stat-item">
                  <div className="activity-stat-number">
                    {userStats.total_events_attended || 0}
                  </div>
                  <div className="activity-stat-label">Events Attended</div>
                </div>
                <div className="activity-stat-item">
                  <div className="activity-stat-number">
                    {userStats.event_access === -1 ? '∞' : userStats.event_access}
                  </div>
                  <div className="activity-stat-label">Event Access</div>
                </div>
              </div>
              <div className="activity-tier-info">
                <div className="flex justify-between items-center text-sm">
                  <span>Tier ({getSubscriptionTierName(userStats.subscription_tier)}):</span>
                  <span className="font-medium">
                    {getEventLimitDescription(userStats.subscription_tier)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="search-card">
            <div className="search-card-header">
              Search & Filters
            </div>
            <div className="search-card-body">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="funky-search-input"
                  />
                </div>
                
                {/* Search Actions */}
                <div className="search-actions">
                  <button className="funky-button" onClick={handleSearch} disabled={loading}>
                    Search
                  </button>
                  
                  {searchQuery && (
                    <button className="funky-button" onClick={clearSearch}>
                      Clear
                    </button>
                  )}
                  
                  <button
                    className="funky-button flex items-center"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="filter-pills-container">
                  <span className="text-sm font-medium mr-2" style={{ color: 'var(--text)' }}>Filter by tier:</span>
                  {['all', 'free', 'basic_99', 'premium_149'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFilterTier(tier as any)}
                      className={`filter-pill ${filterTier === tier ? 'active' : ''}`}
                    >
                      {tier === 'all' ? 'All Events' : 
                       tier === 'free' ? 'Free' :
                       tier === 'basic_99' ? 'Explorer' : 'Professional'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-80 bg-gray-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  userTier={profile.subscription_tier}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery ? 'No events found' : 'No events available'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new events'
                }
              </p>
              {searchQuery && (
                <button className="white-btn" onClick={clearSearch}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}