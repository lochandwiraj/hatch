'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { formatDateShort, formatTime, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'

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

// Color schemes for different events
const colorSchemes = [
  {
    primary: '#ff3e00',
    primaryHover: '#ff6d43',
    secondary: '#4d61ff',
    secondaryHover: '#5e70ff',
    accent: '#00e0b0',
    text: '#050505',
    bg: '#ffffff',
    shadowColor: '#000000',
    patternColor: '#cfcfcf'
  },
  {
    primary: '#ff6b35',
    primaryHover: '#ff8c42',
    secondary: '#7209b7',
    secondaryHover: '#8e2de2',
    accent: '#f72585',
    text: '#2d3436',
    bg: '#ffffff',
    shadowColor: '#000000',
    patternColor: '#ddd'
  },
  {
    primary: '#06ffa5',
    primaryHover: '#40ffb3',
    secondary: '#ff006e',
    secondaryHover: '#ff1744',
    accent: '#8338ec',
    text: '#2d3436',
    bg: '#ffffff',
    shadowColor: '#000000',
    patternColor: '#e0e0e0'
  },
  {
    primary: '#ffbe0b',
    primaryHover: '#ffd60a',
    secondary: '#fb8500',
    secondaryHover: '#ffaa00',
    accent: '#8ecae6',
    text: '#2d3436',
    bg: '#ffffff',
    shadowColor: '#000000',
    patternColor: '#f0f0f0'
  },
  {
    primary: '#7209b7',
    primaryHover: '#8e2de2',
    secondary: '#f72585',
    secondaryHover: '#ff1744',
    accent: '#06ffa5',
    text: '#2d3436',
    bg: '#ffffff',
    shadowColor: '#000000',
    patternColor: '#e8e8e8'
  }
]

export default function EventCard({ event, userTier = 'free', showActions = true }: EventCardProps) {
  // Get consistent color scheme based on event ID
  const colorIndex = parseInt(event.id.slice(-1), 16) % colorSchemes.length
  const colors = colorSchemes[colorIndex]
  
  // Create proper datetime from date and time
  const eventDateTime = event.event_time 
    ? new Date(`${event.event_date.split('T')[0]}T${event.event_time}`)
    : new Date(event.event_date)
  
  const isUpcoming = eventDateTime > new Date()
  const isPast = eventDateTime < new Date()
  const canAccess = isEventAccessible(event.required_tier, userTier)

  const handleRegisterClick = () => {
    // Store registration intent globally instead of per-card
    sessionStorage.setItem('global_registration_return', JSON.stringify({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.event_date,
      eventTime: event.event_time,
      organizer: event.organizer,
      mode: event.mode,
      timestamp: Date.now()
    }))
    window.open(event.event_link, '_blank')
  }

  const cardStyle = {
    '--primary': colors.primary,
    '--primary-hover': colors.primaryHover,
    '--secondary': colors.secondary,
    '--secondary-hover': colors.secondaryHover,
    '--accent': colors.accent,
    '--text': colors.text,
    '--bg': colors.bg,
    '--shadow-color': colors.shadowColor,
    '--pattern-color': colors.patternColor
  } as React.CSSProperties

  return (
    <div className="event-card" style={cardStyle}>
      <div className="event-card-pattern-grid"></div>
      <div className="event-card-overlay-dots"></div>
      
      <div className="event-card-title-area">
        <div className="flex-1">
          <h3 className="text-sm font-bold leading-tight">{event.title}</h3>
        </div>
        <div className="event-card-tag">
          {getSubscriptionTierName(event.required_tier)}
        </div>
      </div>

      <div className="event-card-body">
        <div className="event-card-description">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description}
        </div>

        <div className="event-feature-grid">
          <div className="event-feature-item">
            <div className="event-feature-icon">
              <CalendarDaysIcon className="w-4 h-4 text-white" />
            </div>
            <div className="event-feature-text">
              {formatDateShort(event.event_date)}
              {event.event_time && ` at ${event.event_time}`}
            </div>
          </div>

          <div className="event-feature-item">
            <div className="event-feature-icon">
              <MapPinIcon className="w-4 h-4 text-white" />
            </div>
            <div className="event-feature-text">{event.mode}</div>
          </div>

          <div className="event-feature-item">
            <div className="event-feature-icon">
              <UserGroupIcon className="w-4 h-4 text-white" />
            </div>
            <div className="event-feature-text">{event.organizer}</div>
          </div>

          {event.prize_pool && (
            <div className="event-feature-item">
              <div className="event-feature-icon">
                <span className="text-white text-sm">🏆</span>
              </div>
              <div className="event-feature-text">{event.prize_pool}</div>
            </div>
          )}
        </div>

        {showActions && (
          <div className="event-card-actions">
            <Link href={`/events/${event.id}`} className="event-card-button">
              Details
            </Link>
            
            {canAccess && isUpcoming && event.status === 'published' && event.event_link && (
              <button className="event-card-button" onClick={handleRegisterClick}>
                Register
              </button>
            )}
            
            {!canAccess && (
              <Link href="/subscription/upgrade" className="event-card-button">
                Upgrade
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="event-accent-shape"></div>
    </div>
  )
}