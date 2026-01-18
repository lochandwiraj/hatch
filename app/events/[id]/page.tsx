'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  CurrencyRupeeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate, formatTime, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'

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

export default function EventDetailsPage() {
  const { profile, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    if (eventId && profile) {
      loadEvent()
    }
  }, [eventId, profile])

  const loadEvent = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('status', 'published') // Only show published events
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true)
        } else {
          throw error
        }
        return
      }

      // Check if user has access to this event tier
      const canAccess = isEventAccessible(data.required_tier, profile?.subscription_tier || 'free')
      
      if (!canAccess) {
        toast.error('You need to upgrade your subscription to view this event')
        router.push('/subscription/upgrade')
        return
      }

      setEvent(data)
    } catch (error: any) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event details')
      setNotFound(true)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Event Not Found</h1>
          <p className="text-neutral-600 mb-4">The event you're looking for doesn't exist or is no longer available.</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.event_date)
  const isUpcoming = eventDate > new Date()
  const isPast = eventDate < new Date()
  const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null
  const isRegistrationOpen = !registrationDeadline || registrationDeadline > new Date()

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
                user?.email === 'dwiraj@eventscout.in' || 
                user?.email === 'lochan@eventscout.in') && (
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
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Link 
            href="/events" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Events
          </Link>

          {/* Event Header */}
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={getTierBadgeVariant(event.required_tier)}>
                    {getSubscriptionTierName(event.required_tier)}
                  </Badge>
                  {event.is_early_access && (
                    <Badge variant="primary">Early Access</Badge>
                  )}
                  {isPast && (
                    <Badge variant="default">Past Event</Badge>
                  )}
                  <Badge variant="secondary">{event.category}</Badge>
                </div>

                <h1 className="text-3xl font-bold text-neutral-900 mb-4">
                  {event.title}
                </h1>

                <p className="text-lg text-neutral-600 mb-6">
                  {event.description}
                </p>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Event Date</p>
                        <p className="text-neutral-600">{formatDate(event.event_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Time</p>
                        <p className="text-neutral-600">{formatTime(event.event_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Mode</p>
                        <p className="text-neutral-600">{event.mode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-neutral-500 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Organizer</p>
                        <p className="text-neutral-600">{event.organizer}</p>
                      </div>
                    </div>

                    {event.prize_pool && (
                      <div className="flex items-center">
                        <CurrencyRupeeIcon className="h-5 w-5 text-neutral-500 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-900">Prize Pool</p>
                          <p className="text-neutral-600">{event.prize_pool}</p>
                        </div>
                      </div>
                    )}

                    {registrationDeadline && (
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-neutral-500 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-900">Registration Deadline</p>
                          <p className={`${isRegistrationOpen ? 'text-neutral-600' : 'text-error-600'}`}>
                            {formatDate(event.registration_deadline!)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <TagIcon className="h-5 w-5 text-neutral-500 mr-2" />
                      <p className="font-medium text-neutral-900">Tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility */}
                {event.eligibility && (
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <InformationCircleIcon className="h-5 w-5 text-neutral-500 mr-2" />
                      <p className="font-medium text-neutral-900">Eligibility</p>
                    </div>
                    <p className="text-neutral-600">{event.eligibility}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="lg:ml-8 mt-6 lg:mt-0">
                <div className="space-y-3">
                  {isUpcoming && isRegistrationOpen && event.event_link ? (
                    <Button 
                      size="lg"
                      onClick={() => window.open(event.event_link, '_blank')}
                      className="w-full lg:w-auto"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                      Register for Event
                    </Button>
                  ) : isUpcoming && !isRegistrationOpen ? (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto"
                    >
                      Registration Closed
                    </Button>
                  ) : isPast ? (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto"
                    >
                      Event Ended
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto"
                    >
                      Registration Not Available
                    </Button>
                  )}

                  <Link href="/events">
                    <Button 
                      variant="secondary" 
                      size="lg"
                      className="w-full lg:w-auto"
                    >
                      Browse More Events
                    </Button>
                  </Link>
                </div>

                {/* Event Status Info */}
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Event Status</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-neutral-600">
                      Status: <span className={isUpcoming ? 'text-success-600' : 'text-neutral-500'}>
                        {isUpcoming ? 'Upcoming' : 'Past Event'}
                      </span>
                    </p>
                    {registrationDeadline && (
                      <p className="text-neutral-600">
                        Registration: <span className={isRegistrationOpen ? 'text-success-600' : 'text-error-600'}>
                          {isRegistrationOpen ? 'Open' : 'Closed'}
                        </span>
                      </p>
                    )}
                    <p className="text-neutral-600">
                      Required Tier: <span className="text-primary-600">
                        {getSubscriptionTierName(event.required_tier)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          {(event.prize_pool || event.eligibility) && (
            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                {event.prize_pool && (
                  <div>
                    <h3 className="font-medium text-neutral-900 mb-1">Prize Pool</h3>
                    <p className="text-neutral-600">{event.prize_pool}</p>
                  </div>
                )}
                {event.eligibility && (
                  <div>
                    <h3 className="font-medium text-neutral-900 mb-1">Eligibility Criteria</h3>
                    <p className="text-neutral-600">{event.eligibility}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}