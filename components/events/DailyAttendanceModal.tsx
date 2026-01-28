'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
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
        toast.success('🎉 Attendance confirmed! Your stats have been updated.')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Attendance Confirmation
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
                <UserGroupIcon className="h-4 w-4 mr-2" />
                <span>{event.organizer}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="text-center mb-6">
            <CheckCircleIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Did you attend this event?
            </h3>
            <p className="text-neutral-600 text-sm">
              If you attended, we'll update your attendance stats and recent activity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleDidNotAttend}
              className="flex-1"
              disabled={confirming}
            >
              No, I didn't attend
            </Button>
            <Button
              onClick={handleAttendanceConfirm}
              loading={confirming}
              className="flex-1"
            >
              Yes, I attended
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-neutral-500 text-center mt-4">
            This helps us track your event participation and update your profile stats
          </p>
        </div>
      </div>
    </div>
  )
}