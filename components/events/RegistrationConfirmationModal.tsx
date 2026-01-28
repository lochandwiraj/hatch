'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="funky-modal-card">
        <div className="funky-modal-header">
          <h2 className="funky-modal-title">
            Registration Confirmation
          </h2>
          <button
            onClick={onClose}
            className="funky-modal-close-button"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="funky-modal-body">
          {/* Event Info */}
          <div className="funky-event-info-card">
            <h3 className="funky-event-title">{event.title}</h3>
            <div className="funky-event-details">
              <div className="funky-event-detail-item">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              {event.event_time && (
                <div className="funky-event-detail-item">
                  <ClockIcon className="h-4 w-4" />
                  <span>at {event.event_time}</span>
                </div>
              )}
              <div className="funky-event-detail-item">
                <span>📍</span>
                <span>{event.mode}</span>
              </div>
              <div className="funky-event-detail-item">
                <span>👥</span>
                <span>{event.organizer}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="funky-confirmation-section">
            <div className="funky-confirmation-icon">
              <CheckCircleIcon className="h-12 w-12" />
            </div>
            <h3 className="funky-confirmation-title">
              Did you register for this event?
            </h3>
            <p className="funky-confirmation-text">
              If you successfully registered, we'll add it to your calendar so you don't miss it!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="funky-modal-actions">
            <button
              onClick={handleNotRegistered}
              disabled={saving}
              className="funky-modal-button secondary"
            >
              No, I didn't register
            </button>
            <button
              onClick={handleConfirmRegistration}
              disabled={saving}
              className="funky-modal-button primary"
            >
              {saving ? 'Adding...' : 'Yes, add to calendar'}
            </button>
          </div>

          {/* Help Text */}
          <p className="funky-modal-help-text">
            You can always manage your registered events from the Calendar page
          </p>
        </div>
      </div>
    </div>
  )
}