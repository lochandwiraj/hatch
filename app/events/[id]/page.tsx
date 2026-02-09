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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center funky-card bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-purple-300 p-8 max-w-md mx-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">Event Not Found</h1>
          <p className="text-neutral-700 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
          <Link href="/events">
            <Button className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Back to Events
            </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b-4 border-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text hover:scale-110 transition-transform">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600 hover:scale-105 transition-transform">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@eventscout.in' || 
                user?.email === 'lochan@eventscout.in') && (
                <>
                  <Link href="/admin/events" className="bg-gradient-to-r from-purple-100 to-pink-100 text-primary-700 hover:from-purple-200 hover:to-pink-200 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 border-purple-300 shadow-md hover:shadow-lg hover:scale-105">
                    📅 Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-gradient-to-r from-purple-100 to-pink-100 text-primary-700 hover:from-purple-200 hover:to-pink-200 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 border-purple-300 shadow-md hover:shadow-lg hover:scale-105">
                    🔧 Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-gradient-to-r from-purple-100 to-pink-100 text-primary-700 hover:from-purple-200 hover:to-pink-200 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 border-purple-300 shadow-md hover:shadow-lg hover:scale-105">
                    👥 Users
                  </Link>
                  <Link href="/admin/payments" className="bg-gradient-to-r from-purple-100 to-pink-100 text-primary-700 hover:from-purple-200 hover:to-pink-200 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 border-purple-300 shadow-md hover:shadow-lg hover:scale-105">
                    💳 Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-primary-600 font-medium hover:scale-105 transition-transform">
                Events
              </Link>
              <Link href="/subscription" className="text-neutral-600 hover:text-primary-600 hover:scale-105 transition-transform">
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
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold hover:scale-105 transition-transform bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg border-2 border-purple-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Events
          </Link>

          {/* Event Header */}
          <div className="funky-card bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-transparent hover:border-purple-300 transition-all duration-300 p-6">
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

                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  {event.title}
                </h1>

                <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
                  {event.description}
                </p>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border-2 border-purple-200 hover:shadow-md transition-shadow">
                      <CalendarDaysIcon className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Event Date</p>
                        <p className="text-neutral-600">{formatDate(event.event_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border-2 border-blue-200 hover:shadow-md transition-shadow">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Time</p>
                        <p className="text-neutral-600">{formatTime(event.event_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border-2 border-pink-200 hover:shadow-md transition-shadow">
                      <MapPinIcon className="h-5 w-5 text-pink-600 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Mode</p>
                        <p className="text-neutral-600">{event.mode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border-2 border-purple-200 hover:shadow-md transition-shadow">
                      <UserGroupIcon className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-neutral-900">Organizer</p>
                        <p className="text-neutral-600">{event.organizer}</p>
                      </div>
                    </div>

                    {event.prize_pool && (
                      <div className="flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border-2 border-yellow-200 hover:shadow-md transition-shadow">
                        <CurrencyRupeeIcon className="h-5 w-5 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-900">Prize Pool</p>
                          <p className="text-neutral-600">{event.prize_pool}</p>
                        </div>
                      </div>
                    )}

                    {registrationDeadline && (
                      <div className="flex items-center bg-gradient-to-r from-pink-50 to-red-50 p-3 rounded-lg border-2 border-pink-200 hover:shadow-md transition-shadow">
                        <ClockIcon className="h-5 w-5 text-pink-600 mr-3" />
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
                    <div className="flex items-center mb-3">
                      <TagIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <p className="font-medium text-neutral-900">Tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border-2 border-purple-200 hover:shadow-md transition-shadow">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility */}
                {event.eligibility && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="font-medium text-neutral-900">Eligibility</p>
                    </div>
                    <p className="text-neutral-600 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">{event.eligibility}</p>
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
                      className="w-full lg:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                      Register for Event
                    </Button>
                  ) : isUpcoming && !isRegistrationOpen ? (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto opacity-60"
                    >
                      Registration Closed
                    </Button>
                  ) : isPast ? (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto opacity-60"
                    >
                      Event Ended
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      variant="secondary"
                      disabled
                      className="w-full lg:w-auto opacity-60"
                    >
                      Registration Not Available
                    </Button>
                  )}

                  <Link href="/events">
                    <Button 
                      variant="secondary" 
                      size="lg"
                      className="w-full lg:w-auto bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-semibold border-2 border-purple-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Browse More Events
                    </Button>
                  </Link>
                </div>

                {/* Event Status Info */}
                <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl border-2 border-purple-200 shadow-md">
                  <h3 className="font-bold text-neutral-900 mb-3 text-lg">Event Status</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-neutral-700 font-medium">
                      Status: <span className={`${isUpcoming ? 'text-green-600' : 'text-neutral-500'} font-bold`}>
                        {isUpcoming ? '✨ Upcoming' : '📅 Past Event'}
                      </span>
                    </p>
                    {registrationDeadline && (
                      <p className="text-neutral-700 font-medium">
                        Registration: <span className={`${isRegistrationOpen ? 'text-green-600' : 'text-red-600'} font-bold`}>
                          {isRegistrationOpen ? '✅ Open' : '❌ Closed'}
                        </span>
                      </p>
                    )}
                    <p className="text-neutral-700 font-medium">
                      Required Tier: <span className="text-purple-600 font-bold">
                        {getSubscriptionTierName(event.required_tier)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(event.prize_pool || event.eligibility) && (
            <div className="funky-card bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-transparent hover:border-pink-300 transition-all duration-300 p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">Additional Information</h2>
              <div className="space-y-4">
                {event.prize_pool && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
                    <h3 className="font-bold text-neutral-900 mb-2 flex items-center">
                      <CurrencyRupeeIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      Prize Pool
                    </h3>
                    <p className="text-neutral-700 font-medium">{event.prize_pool}</p>
                  </div>
                )}
                {event.eligibility && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                    <h3 className="font-bold text-neutral-900 mb-2 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Eligibility Criteria
                    </h3>
                    <p className="text-neutral-700 font-medium">{event.eligibility}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}