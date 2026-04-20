'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import RegistrationConfirmationModal from '@/components/events/RegistrationConfirmationModal'
import { motion } from 'motion/react'
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  CurrencyRupeeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate, formatTime, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'
import { getCategoryGradient } from '@/components/events/EventCard'

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

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }
const CARD_INNER = { background: 'rgba(5,5,10,0.6)', border: '1px solid rgba(255,255,255,0.05)' }

const tierBadge = {
  free: { bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.2)', dot: '#71717a' },
  basic_99: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)', dot: '#38bdf8' },
  premium_149: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)', dot: '#34d399' },
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

  useEffect(() => { if (eventId && profile) loadEvent() }, [eventId, profile])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).eq('status', 'published').single()
      if (error) {
        if (error.code === 'PGRST116') setNotFound(true)
        else throw error
        return
      }
      if (!isEventAccessible(data.required_tier, profile?.subscription_tier ?? 'free')) {
        toast.error('Upgrade your subscription to view this event')
        router.push('/subscription/upgrade')
        return
      }
      setEvent(data)
    } catch {
      toast.error('Failed to load event details')
      setNotFound(true)
    } finally { setLoading(false) }
  }

  const handleRegisterClick = () => {
    if (!event?.event_link) return
    window.open(event.event_link, '_blank')
    setTimeout(() => setShowRegistrationModal(true), 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <p className="text-white font-semibold mb-2">Event not found</p>
          <p className="text-sm text-zinc-500 mb-6">This event doesn't exist or is no longer available.</p>
          <Link href="/events" className="text-sm text-white font-medium px-4 py-2 rounded-xl transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            Back to events
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
  const badge = tierBadge[event.required_tier]
  const gradient = getCategoryGradient(event.category)

  const metaItems = [
    { icon: CalendarDaysIcon, label: 'Date', value: formatDate(event.event_date) },
    { icon: ClockIcon, label: 'Time', value: formatTime(event.event_date) },
    { icon: MapPinIcon, label: 'Mode', value: event.mode },
    { icon: UserGroupIcon, label: 'Organizer', value: event.organizer },
    ...(registrationDeadline ? [{ icon: ClockIcon, label: 'Deadline', value: formatDate(event.registration_deadline!) }] : []),
    ...(event.prize_pool ? [{ icon: CurrencyRupeeIcon, label: 'Prize pool', value: event.prize_pool }] : []),
  ]

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero image / gradient banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full overflow-hidden"
        style={{ height: 260, background: gradient }}
      >
        {event.poster_image_url ? (
          <img src={event.poster_image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center leading-none select-none">
              <span className="text-white/50 font-bold tracking-[0.3em] mb-1" style={{ fontSize: '0.75rem' }}>
                {new Date(event.event_date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
              </span>
              <span className="font-qepho text-white" style={{ fontSize: '7rem', lineHeight: 1, textShadow: '0 4px 32px rgba(0,0,0,0.25)' }}>
                {new Date(event.event_date).getDate()}
              </span>
              <span className="text-white/30 font-medium tracking-widest mt-1" style={{ fontSize: '0.65rem' }}>
                {new Date(event.event_date).getFullYear()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 100%)' }} />

        {/* Back button — floats on image */}
        <div className="absolute top-5 left-5">
          <Link href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Events
          </Link>
        </div>

        {/* Prize badge on image */}
        {event.prize_pool && (
          <div className="absolute top-5 right-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.25)', color: '#6ee7b7', backdropFilter: 'blur(8px)', border: '1px solid rgba(52,211,153,0.35)' }}>
              🏆 {event.prize_pool}
            </span>
          </div>
        )}

        {/* Category + status at bottom of image */}
        <div className="absolute bottom-5 left-5 flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {event.category}
          </span>
          {event.is_early_access && isUpcoming && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.5)', color: '#e9d5ff', backdropFilter: 'blur(8px)', border: '1px solid rgba(167,139,250,0.3)' }}>
              Early access
            </span>
          )}
          {isPast && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
              Ended
            </span>
          )}
        </div>
      </motion.div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="rounded-2xl p-6 mb-4"
          style={CARD}
        >
          {/* Tier badge */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border"
              style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
              <span className="w-1 h-1 rounded-full" style={{ background: badge.dot }} />
              {getSubscriptionTierName(event.required_tier)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-white mb-2 leading-snug tracking-tight">{event.title}</h1>

          {/* Organizer row */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold"
              style={{ background: gradient }}>
              {event.organizer.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-zinc-400">{event.organizer}</span>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {metaItems.map(item => (
              <div key={item.label} className="rounded-xl p-3" style={CARD_INNER}>
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-xs text-zinc-600">{item.label}</span>
                </div>
                <p className="text-sm text-white font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
            style={{ background: 'rgba(5,5,10,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUpcoming ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-sm text-zinc-400">
              {isUpcoming ? 'Upcoming event' : 'Past event'}&nbsp;&nbsp;·&nbsp;&nbsp;
              Registration {isRegistrationOpen ? 'open' : 'closed'}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest mb-2">About</p>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Eligibility */}
          {event.eligibility && (
            <div className="mb-6 p-4 rounded-xl" style={CARD_INNER}>
              <div className="flex items-center gap-1.5 mb-2">
                <InformationCircleIcon className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-xs text-zinc-600 font-medium">Eligibility</span>
              </div>
              <p className="text-sm text-zinc-400">{event.eligibility}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <TagIcon className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-xs text-zinc-600 font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 text-zinc-500 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isUpcoming && isRegistrationOpen && event.event_link ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleRegisterClick}
                className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200"
                style={{ background: gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Register now
              </motion.button>
            ) : (
              <button disabled
                className="flex-1 text-sm py-3 rounded-xl cursor-not-allowed text-zinc-600"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {isPast ? 'Event ended' : 'Registration closed'}
              </button>
            )}
            <Link href="/events"
              className="px-4 py-3 text-sm text-zinc-400 hover:text-white rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Browse
            </Link>
          </div>
        </motion.div>
      </main>

      <RegistrationConfirmationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        event={event}
      />
    </div>
  )
}
