'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import DailyAttendanceModal from './DailyAttendanceModal'

interface EventNeedingConfirmation {
  event_id: string
  title: string
  description: string
  event_date: string
  event_time: string | null
  organizer: string
  mode: string
  category: string
  registered_at: string
}

export default function AttendanceConfirmationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [eventNeedingConfirmation, setEventNeedingConfirmation] = useState<EventNeedingConfirmation | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [hasCheckedToday, setHasCheckedToday] = useState(false)

  useEffect(() => {
    if (user && profile && !hasCheckedToday) {
      checkForEventsNeedingConfirmation()
    }
  }, [user, profile, hasCheckedToday])

  const checkForEventsNeedingConfirmation = async () => {
    if (!user) return

    try {
      // Check if we've already checked today (to avoid spam)
      const today = new Date().toDateString()
      const lastCheck = localStorage.getItem('lastAttendanceCheck')
      
      if (lastCheck === today) {
        setHasCheckedToday(true)
        return
      }

      const { data, error } = await supabase
        .rpc('get_events_needing_attendance_confirmation', { user_uuid: user.id })

      if (error) throw error

      if (data && data.length > 0) {
        const event = data[0]
        setEventNeedingConfirmation({
          event_id: event.event_id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          event_time: event.event_time,
          organizer: event.organizer,
          mode: event.mode,
          category: event.category,
          registered_at: event.registered_at
        })
        
        // Show modal after a short delay to let page load
        setTimeout(() => {
          setShowConfirmationModal(true)
        }, 2000)
      }

      // Mark that we've checked today
      localStorage.setItem('lastAttendanceCheck', today)
      setHasCheckedToday(true)

    } catch (error: any) {
      console.error('Error checking for events needing confirmation:', error)
      setHasCheckedToday(true)
    }
  }

  const handleConfirmationComplete = () => {
    setShowConfirmationModal(false)
    setEventNeedingConfirmation(null)
    
    // Refresh the page data to show updated stats
    window.location.reload()
  }

  const handleModalClose = async () => {
    if (!user || !eventNeedingConfirmation) return

    try {
      // Mark as confirmed (but no attendance) so modal doesn't show again
      await supabase
        .from('attendance_confirmations')
        .insert({
          user_id: user.id,
          event_id: eventNeedingConfirmation.event_id,
          confirmed_at: new Date().toISOString()
        })
    } catch (error: any) {
      console.error('Error marking confirmation:', error)
    }

    setShowConfirmationModal(false)
    setEventNeedingConfirmation(null)
  }

  return (
    <>
      {children}
      
      {eventNeedingConfirmation && (
        <DailyAttendanceModal
          isOpen={showConfirmationModal}
          onClose={handleModalClose}
          event={{
            id: eventNeedingConfirmation.event_id,
            title: eventNeedingConfirmation.title,
            description: eventNeedingConfirmation.description,
            event_date: eventNeedingConfirmation.event_date,
            event_time: eventNeedingConfirmation.event_time,
            organizer: eventNeedingConfirmation.organizer,
            mode: eventNeedingConfirmation.mode,
            category: eventNeedingConfirmation.category
          }}
          onConfirm={handleConfirmationComplete}
        />
      )}
    </>
  )
}