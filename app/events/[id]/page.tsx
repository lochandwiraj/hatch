'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import RegistrationConfirmationModal from '@/components/events/RegistrationConfirmationModal'
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
  event_time: string | null
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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

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

  const handleRegisterClick = () => {
    if (event?.event_link) {
      // Open registration link in new tab
      window.open(event.event_link, '_blank')
      // Show confirmation modal after a short delay
      setTimeout(() => {
        setShowRegistrationModal(true)
      }, 500)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-white border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-xl font-black text-white uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl border-8 border-purple-600 shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] p-8 max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-black text-purple-600 mb-4 uppercase">Not Found</h1>
          <p className="text-black font-bold mb-6">This event doesn't exist or is no longer available.</p>
          <Link href="/events">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase">
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-900 hover:text-primary-600 font-semibold">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@eventscout.in' || 
                user?.email === 'lochan@eventscout.in') && (
                <>
                  <Link href="/admin/events" className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded text-sm font-bold transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    📅 Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded text-sm font-bold transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    🔧 Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded text-sm font-bold transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    👥 Users
                  </Link>
                  <Link href="/admin/payments" className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded text-sm font-bold transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    💳 Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-primary-600 font-bold">
                Events
              </Link>
              <Link href="/subscription" className="text-neutral-900 hover:text-primary-600 font-semibold">
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
            className="inline-flex items-center text-white font-bold hover:scale-105 transition-transform bg-purple-600 px-6 py-3 rounded border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Events
          </Link>

          {/* Event Header */}
          <div className="bg-white rounded-xl border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
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

            {/* Title */}
            <h1 className="text-4xl font-black text-purple-600 mb-6 uppercase tracking-tight">
              {event.title}
            </h1>

            {/* Description - Full Width Paragraph */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border-4 border-black">
              <p className="text-lg text-neutral-900 leading-relaxed font-medium whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Event Details Grid - Organized 2x3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center bg-purple-600 text-white p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CalendarDaysIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase">Event Date</p>
                  <p className="font-bold text-lg">{formatDate(event.event_date)}</p>
                </div>
              </div>

              <div className="flex items-center bg-cyan-400 text-black p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ClockIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase">Time</p>
                  <p className="font-bold text-lg">{formatTime(event.event_date)}</p>
                </div>
              </div>

              <div className="flex items-center bg-pink-500 text-white p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <MapPinIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase">Mode</p>
                  <p className="font-bold text-lg">{event.mode}</p>
                </div>
              </div>

              <div className="flex items-center bg-orange-500 text-white p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <UserGroupIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase">Organizer</p>
                  <p className="font-bold text-lg">{event.organizer}</p>
                </div>
              </div>

              {registrationDeadline && (
                <div className="flex items-center bg-red-500 text-white p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <ClockIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                  <div>
                    <p className="font-black text-sm uppercase">Registration Deadline</p>
                    <p className="font-bold text-lg">
                      {formatDate(event.registration_deadline!)}
                    </p>
                  </div>
                </div>
              )}

              {event.prize_pool && (
                <div className="flex items-center bg-yellow-400 text-black p-5 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CurrencyRupeeIcon className="h-8 w-8 mr-4 flex-shrink-0" />
                  <div>
                    <p className="font-black text-sm uppercase">Prize Pool</p>
                    <p className="font-bold text-lg">{event.prize_pool}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <TagIcon className="h-6 w-6 text-black mr-2" />
                  <p className="font-black text-black uppercase text-lg">Tags</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="bg-white text-black px-4 py-2 rounded font-bold text-sm border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {event.eligibility && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <InformationCircleIcon className="h-6 w-6 text-black mr-2" />
                  <p className="font-black text-black uppercase text-lg">Eligibility</p>
                </div>
                <p className="text-neutral-900 font-semibold bg-cyan-100 p-4 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">{event.eligibility}</p>
              </div>
            )}

            {/* Event Status Info */}
            <div className="mb-8 p-6 bg-cyan-400 rounded border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-black mb-4 text-xl uppercase">Event Status</h3>
              <div className="space-y-3 text-base">
                <p className="text-black font-bold">
                  Status: <span className={`${isUpcoming ? 'text-green-700' : 'text-neutral-700'} font-black`}>
                    {isUpcoming ? '✨ UPCOMING' : '📅 PAST'}
                  </span>
                </p>
                {registrationDeadline && (
                  <p className="text-black font-bold">
                    Registration: <span className={`${isRegistrationOpen ? 'text-green-700' : 'text-red-700'} font-black`}>
                      {isRegistrationOpen ? '✅ OPEN' : '❌ CLOSED'}
                    </span>
                  </p>
                )}
                <p className="text-black font-bold">
                  Tier: <span className="text-purple-700 font-black">
                    {getSubscriptionTierName(event.required_tier).toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons - At the Bottom */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isUpcoming && isRegistrationOpen && event.event_link ? (
                <Button 
                  size="lg"
                  onClick={handleRegisterClick}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                >
                  <ArrowTopRightOnSquareIcon className="h-6 w-6 mr-2" />
                  Register Now
                </Button>
              ) : isUpcoming && !isRegistrationOpen ? (
                <Button 
                  size="lg"
                  variant="secondary"
                  disabled
                  className="flex-1 opacity-60 font-bold border-4 border-black uppercase"
                >
                  Registration Closed
                </Button>
              ) : isPast ? (
                <Button 
                  size="lg"
                  variant="secondary"
                  disabled
                  className="flex-1 opacity-60 font-bold border-4 border-black uppercase"
                >
                  Event Ended
                </Button>
              ) : (
                <Button 
                  size="lg"
                  variant="secondary"
                  disabled
                  className="flex-1 opacity-60 font-bold border-4 border-black uppercase"
                >
                  Not Available
                </Button>
              )}

              <Link href="/events" className="flex-1">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                >
                  Browse Events
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Information */}
          {(event.prize_pool || event.eligibility) && (
            <div className="bg-white rounded-xl border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-black text-purple-600 mb-6 uppercase">Additional Info</h2>
              <div className="space-y-4">
                {event.prize_pool && (
                  <div className="bg-yellow-400 p-6 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-black mb-3 flex items-center text-lg uppercase">
                      <CurrencyRupeeIcon className="h-6 w-6 mr-2" />
                      Prize Pool
                    </h3>
                    <p className="text-black font-bold text-xl">{event.prize_pool}</p>
                  </div>
                )}
                {event.eligibility && (
                  <div className="bg-cyan-400 p-6 rounded border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-black mb-3 flex items-center text-lg uppercase">
                      <InformationCircleIcon className="h-6 w-6 mr-2" />
                      Eligibility
                    </h3>
                    <p className="text-black font-bold">{event.eligibility}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      <RegistrationConfirmationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        event={event}
      />
    </div>
  )
}