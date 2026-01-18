'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import EventCard from '@/components/events/EventCard'
import AttendanceConfirmationModal from '@/components/events/AttendanceConfirmationModal'
import TierLimitModal from '@/components/events/TierLimitModal'
import Button from '@/components/ui/Button'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

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
  const [attendancePrompts, setAttendancePrompts] = useState<any[]>([])
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showTierLimitModal, setShowTierLimitModal] = useState(false)
  const [tierLimitInfo, setTierLimitInfo] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    loadEvents()
    if (profile) {
      checkAttendancePrompts()
      loadUserStats()
    }
  }, [profile, filterTier])

  // Check for attendance prompts every time user visits
  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        checkAttendancePrompts()
      }, 2000) // Check after 2 seconds

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
            events_attended_this_month: 0,
            total_events_attended: 0,
            monthly_limit: profile.subscription_tier === 'free' ? 5 : 
                          profile.subscription_tier === 'basic_99' ? 10 : 999,
            events_remaining: profile.subscription_tier === 'free' ? 5 : 
                             profile.subscription_tier === 'basic_99' ? 10 : 999
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
        events_attended_this_month: 0,
        total_events_attended: 0,
        monthly_limit: profile.subscription_tier === 'free' ? 5 : 
                      profile.subscription_tier === 'basic_99' ? 10 : 999,
        events_remaining: profile.subscription_tier === 'free' ? 5 : 
                         profile.subscription_tier === 'basic_99' ? 10 : 999
      })
    }
  }

  const checkAttendancePrompts = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase.rpc('get_pending_attendance_prompts', {
        user_uuid: profile.id
      })

      if (error) {
        // If the function doesn't exist yet, just skip attendance prompts
        if (error.code === '42883') { // function does not exist
          console.log('Attendance system not yet set up - skipping prompts')
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setAttendancePrompts(data)
        setShowAttendanceModal(true)
      }
    } catch (error) {
      console.error('Error checking attendance prompts:', error)
    }
  }

  const handleAttendanceResponse = async (eventId: string, attended: boolean) => {
    if (!profile) return

    try {
      const { data, error } = await supabase.rpc('confirm_attendance', {
        user_uuid: profile.id,
        event_uuid: eventId,
        did_attend: attended
      })

      if (error) throw error

      toast.success(data.message)
      
      // Remove this prompt from the list
      setAttendancePrompts(prev => prev.filter(p => p.event_id !== eventId))
      
      // If no more prompts, close modal
      if (attendancePrompts.length <= 1) {
        setShowAttendanceModal(false)
      }
      
      // Refresh user stats
      loadUserStats()
      
    } catch (error: any) {
      console.error('Error confirming attendance:', error)
      toast.error('Failed to confirm attendance')
    }
  }

  const handleRegisterForEvent = async (eventId: string) => {
    if (!profile) {
      toast.error('Please log in to register for events')
      return
    }

    try {
      const { data, error } = await supabase.rpc('register_for_event', {
        user_uuid: profile.id,
        event_uuid: eventId
      })

      if (error) {
        // If the function doesn't exist yet, show a message
        if (error.code === '42883') { // function does not exist
          toast.error('Event registration system is being set up. Please try again later.')
          return
        }
        throw error
      }

      if (data.success) {
        toast.success(data.message)
        if (data.events_remaining !== undefined) {
          toast.success(`You have ${data.events_remaining} events remaining this month`)
        }
      } else {
        // Show tier limit modal
        setTierLimitInfo({
          currentTier: data.current_tier,
          eventsAttended: data.events_attended,
          tierLimit: data.tier_limit,
          upgradeNeeded: data.upgrade_needed
        })
        setShowTierLimitModal(true)
      }
      
    } catch (error: any) {
      console.error('Error registering for event:', error)
      toast.error('Failed to register for event')
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

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free'
      case 'basic_99': return 'Explorer'
      case 'premium_149': return 'Professional'
      default: return tier
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    loadEvents()
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
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
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@hatch.in' || 
                user?.email === 'lochan@hatch.in') && (
                <>
                  <Link href="/admin/events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    📅 Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    🔧 Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    👥 Users
                  </Link>
                  <Link href="/admin/payments" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    💳 Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-primary-600 font-medium">
                Events
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Events</h1>
              <p className="text-neutral-600 mt-1">
                Discover and register for events in your community
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button
                variant="secondary"
                onClick={loadEvents}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Events'}
              </Button>
            </div>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Event Activity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {userStats.events_attended_this_month}
                  </div>
                  <div className="text-sm text-neutral-600">Events This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {userStats.events_remaining}
                  </div>
                  <div className="text-sm text-neutral-600">Events Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {userStats.total_events_attended}
                  </div>
                  <div className="text-sm text-neutral-600">Total Events Attended</div>
                </div>
              </div>
              <div className="mt-4 bg-neutral-50 rounded-lg p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600">Monthly Limit ({getTierName(userStats.subscription_tier)}):</span>
                  <span className="font-medium text-neutral-900">
                    {userStats.monthly_limit === 999 ? 'Unlimited' : userStats.monthly_limit} events
                  </span>
                </div>
                {userStats.monthly_limit !== 999 && (
                  <div className="mt-2">
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((userStats.events_attended_this_month / userStats.monthly_limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Search Button */}
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
              
              {searchQuery && (
                <Button variant="secondary" onClick={clearSearch}>
                  Clear
                </Button>
              )}
              
              {/* Filter Toggle */}
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-neutral-700 mr-2">Filter by tier:</span>
                  {['all', 'free', 'basic_99', 'premium_149'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFilterTier(tier as any)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filterTier === tier
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tier === 'all' ? 'All Events' : 
                       tier === 'free' ? 'Free' :
                       tier === 'basic_99' ? 'Explorer' : 'Professional'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-80 bg-neutral-200 rounded-xl"></div>
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
                  onRegister={handleRegisterForEvent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="h-12 w-12 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {searchQuery ? 'No events found' : 'No events available'}
              </h3>
              <p className="text-neutral-600 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new events'
                }
              </p>
              {searchQuery && (
                <Button variant="secondary" onClick={clearSearch}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Attendance Confirmation Modal */}
        <AttendanceConfirmationModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          prompts={attendancePrompts}
          onConfirm={() => {
            // Refresh prompts after confirmation
            checkAttendancePrompts()
          }}
          onAttendanceResponse={handleAttendanceResponse}
        />

        {/* Tier Limit Modal */}
        <TierLimitModal
          isOpen={showTierLimitModal}
          onClose={() => setShowTierLimitModal(false)}
          currentTier={tierLimitInfo?.currentTier || profile.subscription_tier}
          eventsAttended={tierLimitInfo?.eventsAttended || userStats?.events_attended_this_month || 0}
          tierLimit={tierLimitInfo?.tierLimit || userStats?.monthly_limit || 5}
          upgradeNeeded={tierLimitInfo?.upgradeNeeded}
        />
      </div>
    </div>
  )
}