'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import EventCard from '@/components/events/EventCard'
import Button from '@/components/ui/Button'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { getEvents, searchEvents } from '@/lib/api/events'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  max_attendees: number | null
  current_attendees: number
  required_tier: 'free' | 'basic_99' | 'premium_149'
  status: 'draft' | 'published' | 'cancelled'
}

export default function EventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [profile, filterTier])

  const loadEvents = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const filters = {
        status: 'published' as const,
        userTier: profile.subscription_tier,
      }

      const data = await getEvents(filters)
      
      // Apply tier filter if not 'all'
      let filteredData = data
      if (filterTier !== 'all') {
        filteredData = data.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredData)
    } catch (error: any) {
      toast.error('Failed to load events')
      console.error('Error loading events:', error)
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
      const data = await searchEvents(searchQuery, profile.subscription_tier)
      
      // Apply tier filter if not 'all'
      let filteredData = data
      if (filterTier !== 'all') {
        filteredData = data.filter(event => event.required_tier === filterTier)
      }
      
      setEvents(filteredData)
    } catch (error: any) {
      toast.error('Failed to search events')
      console.error('Error searching events:', error)
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
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Events</h1>
            <p className="text-neutral-600 mt-1">
              Discover and register for events in your community
            </p>
          </div>
        </div>

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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Button */}
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
            
            {searchQuery && (
              <Button variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
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
                     tier === 'basic_99' ? 'Basic' : 'Premium'}
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
              <Button variant="outline" onClick={clearSearch}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}