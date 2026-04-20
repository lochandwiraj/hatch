'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { formatDateShort, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'

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

interface EventCardProps {
  event: Event
  userTier?: string
  showActions?: boolean
}

const tierBadge = {
  free: { bg: 'rgba(113,113,122,0.18)', color: '#d4d4d8', border: 'rgba(113,113,122,0.3)', dot: '#71717a' },
  basic_99: { bg: 'rgba(56,189,248,0.15)', color: '#7dd3fc', border: 'rgba(56,189,248,0.3)', dot: '#38bdf8' },
  premium_149: { bg: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: 'rgba(52,211,153,0.3)', dot: '#34d399' },
}

export function getCategoryGradient(category: string): string {
  const cat = category.toLowerCase()
  if (cat.includes('hack')) return 'linear-gradient(135deg, #5b21b6 0%, #1d4ed8 100%)'
  if (cat.includes('design') || cat.includes('ui') || cat.includes('ux') || cat.includes('creative'))
    return 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)'
  if (cat.includes('workshop') || cat.includes('tech') || cat.includes('code') || cat.includes('dev') || cat.includes('web'))
    return 'linear-gradient(135deg, #0369a1 0%, #4f46e5 100%)'
  if (cat.includes('business') || cat.includes('case') || cat.includes('finance') || cat.includes('startup') || cat.includes('entrepreneur'))
    return 'linear-gradient(135deg, #b45309 0%, #dc2626 100%)'
  if (cat.includes('quiz') || cat.includes('competitive') || cat.includes('competition') || cat.includes('olympiad'))
    return 'linear-gradient(135deg, #065f46 0%, #1d4ed8 100%)'
  if (cat.includes('sport') || cat.includes('athletic') || cat.includes('game'))
    return 'linear-gradient(135deg, #c2410c 0%, #dc2626 100%)'
  if (cat.includes('art') || cat.includes('cultur') || cat.includes('music') || cat.includes('film'))
    return 'linear-gradient(135deg, #9f1239 0%, #7c3aed 100%)'
  if (cat.includes('science') || cat.includes('research') || cat.includes('innov') || cat.includes('ai') || cat.includes('ml'))
    return 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)'
  if (cat.includes('social') || cat.includes('volunteer') || cat.includes('ngo'))
    return 'linear-gradient(135deg, #15803d 0%, #0ea5e9 100%)'
  return 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)'
}

export default function EventCard({ event, userTier = 'free', showActions = true }: EventCardProps) {
  const eventDateTime = event.event_time
    ? new Date(`${event.event_date.split('T')[0]}T${event.event_time}`)
    : new Date(event.event_date)

  const isUpcoming = eventDateTime > new Date()
  const isPast = eventDateTime < new Date()
  const canAccess = isEventAccessible(event.required_tier, userTier)
  const badge = tierBadge[event.required_tier]
  const gradient = getCategoryGradient(event.category)

  const dateDay = eventDateTime.getDate()
  const dateMonth = eventDateTime.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const dateYear = eventDateTime.getFullYear()

  const handleRegisterClick = () => {
    sessionStorage.setItem('global_registration_return', JSON.stringify({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.event_date,
      eventTime: event.event_time,
      organizer: event.organizer,
      mode: event.mode,
      timestamp: Date.now(),
    }))
    window.open(event.event_link, '_blank')
  }

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
      className="group flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(11,10,19,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)'
      }}
    >
      {/* ── Date Hero Header ── */}
      <div className="relative h-44 overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: gradient }}>
        {/* Date typography */}
        <div className="relative z-10 flex flex-col items-center leading-none select-none"
          style={{ transform: 'translateY(-2px)' }}>
          <span className="text-white/60 font-bold tracking-[0.25em] mb-1"
            style={{ fontSize: '0.65rem' }}>
            {dateMonth}
          </span>
          <span className="font-qepho text-white leading-none"
            style={{ fontSize: '5.5rem', lineHeight: 1, textShadow: '0 2px 24px rgba(0,0,0,0.3)' }}>
            {dateDay}
          </span>
          <span className="text-white/35 font-medium tracking-widest mt-1"
            style={{ fontSize: '0.6rem' }}>
            {dateYear}
          </span>
        </div>

        {/* Radial vignette to frame the date */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Category badge — top-left */}
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {event.category}
          </span>
        </div>

        {/* Prize — top-right */}
        {event.prize_pool && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(52,211,153,0.25)', color: '#6ee7b7', backdropFilter: 'blur(8px)', border: '1px solid rgba(52,211,153,0.35)' }}>
              🏆 {event.prize_pool}
            </span>
          </div>
        )}

        {/* Status badges — bottom-right */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {event.is_early_access && isUpcoming && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.5)', color: '#e9d5ff', backdropFilter: 'blur(8px)', border: '1px solid rgba(167,139,250,0.3)' }}>
              Early access
            </span>
          )}
          {isPast && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
              Ended
            </span>
          )}
        </div>
      </div>

      {/* ── Card Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Organizer row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
              style={{ background: gradient }}>
              {event.organizer.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-400 truncate font-medium">{event.organizer}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
            style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
            <span className="w-1 h-1 rounded-full" style={{ background: badge.dot }} />
            {getSubscriptionTierName(event.required_tier)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">{event.title}</h3>

        {/* Date + Mode */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {formatDateShort(event.event_date)}
            {event.event_time && ` · ${event.event_time}`}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {event.mode}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-white/[0.05] mt-auto">
            <Link href={`/events/${event.id}`}
              className="flex-1 text-center text-xs font-medium py-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              Details
            </Link>
            {canAccess && isUpcoming && event.status === 'published' && event.event_link && (
              <button onClick={handleRegisterClick}
                className="flex-1 text-xs font-semibold py-2 rounded-xl text-white transition-all duration-200"
                style={{ background: gradient, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                Register ↗
              </button>
            )}
            {!canAccess && (
              <Link href="/subscription/upgrade"
                className="flex-1 text-center text-xs font-semibold py-2 rounded-xl text-emerald-300 transition-all duration-200"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                Unlock
              </Link>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
