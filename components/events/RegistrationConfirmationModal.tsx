'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { 
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  event_time: string | null
  organizer: string
  mode: string
}

interface RegistrationConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
}

export default function RegistrationConfirmationModal({ 
  isOpen, 
  onClose, 
  event 
}: RegistrationConfirmationModalProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  if (!isOpen || !event) return null

  const handleConfirmRegistration = async () => {
    if (!user) {
      toast.error('Please log in to register for events')
      return
    }

    setSaving(true)
    try {
      // Add registration to database
      const { error } = await supabase
        .from('user_registrations')
        .insert({
          user_id: user.id,
          event_id: event.id,
          registration_status: 'registered'
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.success('You are already registered for this event!')
        } else {
          throw error
        }
      } else {
        toast.success('Event added to your calendar!')
      }

      onClose()
    } catch (error: any) {
      console.error('Error confirming registration:', error)
      toast.error('Failed to add event to calendar')
    } finally {
      setSaving(false)
    }
  }

  const handleNotRegistered = () => {
    toast.success('No problem! You can register anytime from the events page.')
    onClose()
  }

  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Registration Confirmation
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Event Info */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-neutral-900 mb-2">{event.title}</h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                <span>{formattedDate}</span>
              </div>
              {event.event_time && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>at {event.event_time}</span>
                </div>
              )}
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <span>{event.mode}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👥</span>
                <span>{event.organizer}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="text-center mb-6">
            <CheckCircleIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Did you register for this event?
            </h3>
            <p className="text-neutral-600 text-sm">
              If you successfully registered, we'll add it to your calendar so you don't miss it!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleNotRegistered}
              className="flex-1"
              disabled={saving}
            >
              No, I didn't register
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              loading={saving}
              className="flex-1"
            >
              Yes, add to calendar
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-neutral-500 text-center mt-4">
            You can always manage your registered events from the Calendar page
          </p>
        </div>
      </div>
    </div>
  )
}