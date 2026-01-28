'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon
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
  category: string
}

interface DailyAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onConfirm: () => void
}

export default function DailyAttendanceModal({ 
  isOpen, 
  onClose, 
  event,
  onConfirm
}: DailyAttendanceModalProps) {
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)

  if (!isOpen || !event) return null

  const handleAttendanceConfirm = async () => {
    if (!user) {
      toast.error('Please log in to confirm attendance')
      return
    }

    setConfirming(true)
    try {
      // Use the database function to mark manual attendance
      const { data, error } = await supabase
        .rpc('mark_manual_attendance', { 
          user_uuid: user.id, 
          event_uuid: event.id 
        })

      if (error) throw error

      if (data) {
        toast.success('Attendance confirmed! Your stats have been updated.')
      } else {
        toast.success('Attendance already recorded!')
      }

      onConfirm()
      onClose()
    } catch (error: any) {
      console.error('Error confirming attendance:', error)
      toast.error('Failed to confirm attendance')
    } finally {
      setConfirming(false)
    }
  }

  const handleDidNotAttend = async () => {
    if (!user) return

    try {
      // Mark this event as attendance-confirmed (but no attendance record)
      const { error } = await supabase
        .from('attendance_confirmations')
        .insert({
          user_id: user.id,
          event_id: event.id,
          confirmed_at: new Date().toISOString()
        })

      if (error && error.code !== '23505') {
        console.error('Error marking attendance confirmation:', error)
      }

      toast.success('Thanks for letting us know!')
      onClose()
    } catch (error: any) {
      console.error('Error handling did not attend:', error)
    }
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
            Attendance Confirmation
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
                <UserGroupIcon className="h-4 w-4" />
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
              Did you attend this event?
            </h3>
            <p className="funky-confirmation-text">
              If you attended, we'll update your attendance stats and recent activity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="funky-modal-actions">
            <button
              onClick={handleDidNotAttend}
              disabled={confirming}
              className="funky-modal-button secondary"
            >
              No, I didn't attend
            </button>
            <button
              onClick={handleAttendanceConfirm}
              disabled={confirming}
              className="funky-modal-button primary"
            >
              {confirming ? 'Confirming...' : 'Yes, I attended'}
            </button>
          </div>

          {/* Help Text */}
          <p className="funky-modal-help-text">
            This helps us track your event participation and update your profile stats
          </p>
        </div>
      </div>
    </div>
  )
}