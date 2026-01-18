'use client'

import Link from 'next/link'
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDateShort, formatTime, getSubscriptionTierName, isEventAccessible } from '@/lib/utils'

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

interface EventCardProps {
  event: Event
  userTier?: string
  showActions?: boolean
}

export default function EventCard({ event, userTier = 'free', showActions = true }: EventCardProps) {
  const eventDate = new Date(event.event_date)
  const isUpcoming = eventDate > new Date()
  const isPast = eventDate < new Date()
  const canAccess = isEventAccessible(event.required_tier, userTier)
  const isFull = event.max_attendees && event.current_attendees >= event.max_attendees

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free': return 'success'
      case 'basic_99': return 'primary'
      case 'premium_149': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <Card className={`${!canAccess ? 'opacity-75' : ''} ${isPast ? 'bg-neutral-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex space-x-2">
          <Badge variant={getTierBadgeVariant(event.required_tier)}>
            {getSubscriptionTierName(event.required_tier)}
          </Badge>
          {event.status !== 'published' && (
            <Badge variant={getStatusBadgeVariant(event.status)}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          )}
          {isFull && (
            <Badge variant="error">Full</Badge>
          )}
          {isPast && (
            <Badge variant="default">Past Event</Badge>
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 mb-2 line-clamp-2">
        {event.title}
      </h3>
      
      <p className="text-neutral-600 mb-4 line-clamp-3">
        {event.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-neutral-600">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          <span>{formatDateShort(event.event_date)}</span>
        </div>
        
        <div className="flex items-center text-sm text-neutral-600">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span>{formatTime(event.event_date)}</span>
        </div>
        
        <div className="flex items-center text-sm text-neutral-600">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-neutral-600">
          <UserGroupIcon className="h-4 w-4 mr-2" />
          <span>
            {event.current_attendees}
            {event.max_attendees && ` / ${event.max_attendees}`} attendees
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-2">
          <Link href={`/events/${event.id}`} className="flex-1">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
            >
              View Details
            </Button>
          </Link>
          
          {canAccess && isUpcoming && !isFull && event.status === 'published' && (
            <Link href={`/events/${event.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                Register
              </Button>
            </Link>
          )}
          
          {!canAccess && (
            <Link href="/subscription/upgrade" className="flex-1">
              <Button size="sm" className="w-full">
                Upgrade to Access
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  )
}