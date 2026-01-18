'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  PencilIcon,
  EyeIcon,
  CalendarDaysIcon,
  TagIcon,
  LinkIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  TrashIcon
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

export default function AdminManageEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  // Check if user is admin
  const isAdmin = user?.email === 'dwiraj06@gmail.com' || 
                  user?.email === 'pokkalilochan@gmail.com' ||
                  user?.email === 'dwiraj@HATCH.in' || 
                  user?.email === 'lochan@HATCH.in'

  useEffect(() => {
    if (isAdmin) {
      loadEvents()
    }
  }, [isAdmin, filter, statusFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Load all events from database (admin can see all)
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      let filteredEvents = data || []

      // Apply tier filter if not 'all'
      if (filter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.required_tier === filter)
      }

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === statusFilter)
      }
      
      setEvents(filteredEvents)
    } catch (error: any) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      toast.success('Event deleted successfully!')
      loadEvents()
    } catch (error: any) {
      toast.error('Failed to delete event')
      console.error('Error deleting event:', error)
    }
  }

  const toggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId)

      if (error) throw error

      toast.success(`Event ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`)
      loadEvents()
    } catch (error: any) {
      toast.error('Failed to update event status')
      console.error('Error updating event:', error)
    }
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free': return 'success'
      case 'basic_99': return 'primary'
      case 'premium_149': return 'warning'
      default: return 'default'
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
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
              <Link href="/admin/events" className="text-neutral-600 hover:text-primary-600">
                Admin Events
              </Link>
              <Link href="/admin/manage-events" className="text-primary-600 font-medium">
                Manage Events
              </Link>
              <Link href="/admin/payments" className="text-neutral-600 hover:text-primary-600">
                Admin Payments
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
              <h1 className="text-3xl font-bold text-neutral-900">Admin - Manage Events</h1>
              <p className="text-neutral-600 mt-1">
                View, edit, and manage all events across all subscription tiers
              </p>
            </div>
            <Link href="/admin/events">
              <Button>
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Add New Event
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="text-center">
              <CalendarDaysIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.length}
              </div>
              <p className="text-neutral-600">Total Events</p>
            </Card>
            
            <Card className="text-center">
              <TagIcon className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.required_tier === 'free').length}
              </div>
              <p className="text-neutral-600">Free Events</p>
            </Card>
            
            <Card className="text-center">
              <UserGroupIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.required_tier === 'basic_99').length}
              </div>
              <p className="text-neutral-600">Explorer Events</p>
            </Card>
            
            <Card className="text-center">
              <StarIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.required_tier === 'premium_149').length}
              </div>
              <p className="text-neutral-600">Professional Events</p>
            </Card>

            <Card className="text-center">
              <EyeIcon className="h-8 w-8 text-accent-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.status === 'published').length}
              </div>
              <p className="text-neutral-600">Published</p>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-neutral-700 mr-2">Filter by tier:</span>
                {[
                  { key: 'all', label: 'All Tiers' },
                  { key: 'free', label: 'Free' },
                  { key: 'basic_99', label: 'Explorer' },
                  { key: 'premium_149', label: 'Professional' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === option.key
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-neutral-700 mr-2">Filter by status:</span>
                {[
                  { key: 'all', label: 'All Status' },
                  { key: 'published', label: 'Published' },
                  { key: 'draft', label: 'Draft' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setStatusFilter(option.key as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === option.key
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Events List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-32 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 mr-3">
                          {event.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge 
                            variant={event.status === 'published' ? 'success' : 'warning'}
                          >
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                          <Badge variant={getTierBadgeVariant(event.required_tier)}>
                            {getTierName(event.required_tier)}
                          </Badge>
                          {event.is_early_access && (
                            <Badge variant="primary">Early Access</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-neutral-600 mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Organizer:</span> {event.organizer}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {event.category}
                        </div>
                        <div>
                          <span className="font-medium">Mode:</span> {event.mode}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(event.event_date)}
                        </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.tags.map((tag, index) => (
                            <span key={index} className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {event.prize_pool && (
                        <div className="mt-2">
                          <span className="bg-success-100 text-success-800 px-2 py-1 rounded text-sm font-medium">
                            💰 Prize Pool: {event.prize_pool}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4 lg:mt-0">
                      {event.event_link && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(event.event_link, '_blank')}
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      
                      <Link href={`/admin/events?edit=${event.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      
                      <Button
                        variant={event.status === 'published' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleEventStatus(event.id, event.status)}
                      >
                        {event.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No events found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {filter === 'all' && statusFilter === 'all'
                    ? 'No events have been created yet'
                    : `No events match the selected filters`
                  }
                </p>
                <Link href="/admin/events">
                  <Button>
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}