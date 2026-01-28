'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import DailyAttendanceModal from './DailyAttendanceModal'
import RegistrationConfirmationModal from './RegistrationConfirmationModal'

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

interface RegistrationData {
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string | null
  organizer: string
  mode: string
  timestamp: number
}

export default function AttendanceConfirmationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [eventNeedingConfirmation, setEventNeedingConfirmation] = useState<EventNeedingConfirmation | null>(null)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [hasCheckedToday, setHasCheckedToday] = useState(false)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (user && profile && !hasCheckedToday && !checkingRef.current) {
      checkForEventsNeedingConfirmation()
    }
  }, [user, profile, hasCheckedToday])

  // Check for registration return when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && !checkingRef.current) {
        setTimeout(() => checkForRegistrationReturn(), 1000)
      }
    }

    window.addEventListener('focus', handleFocus)
    checkForRegistrationReturn() // Check immediately on mount
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const checkForEventsNeedingConfirmation = async () => {
    if (!user || checkingRef.current) return

    checkingRef.current = true

    try {
      // Check if we've already checked today (to avoid spam)
      const today = new Date().toDateString()
      const lastCheck = localStorage.getItem('lastAttendanceCheck')
      
      if (lastCheck === today) {
        setHasCheckedToday(true)
        checkingRef.current = false
        return
      }

      // Check if any modal is already showing to prevent duplicates
      const attendanceModalShowing = localStorage.getItem('attendanceModalShowing')
      const registrationModalShowing = sessionStorage.getItem('registrationModalShowing')
      
      if (attendanceModalShowing === 'true' || registrationModalShowing === 'true') {
        setHasCheckedToday(true)
        checkingRef.current = false
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
        
        // Mark modal as showing to prevent duplicates
        localStorage.setItem('attendanceModalShowing', 'true')
        
        // Show modal after a short delay to let page load
        setTimeout(() => {
          setShowAttendanceModal(true)
        }, 2000)
      }

      // Mark that we've checked today
      localStorage.setItem('lastAttendanceCheck', today)
      setHasCheckedToday(true)

    } catch (error: any) {
      console.error('Error checking for events needing confirmation:', error)
      setHasCheckedToday(true)
    } finally {
      checkingRef.current = false
    }
  }

  const checkForRegistrationReturn = async () => {
    if (!user || checkingRef.current) return

    try {
      const registrationReturn = sessionStorage.getItem('global_registration_return')
      if (registrationReturn) {
        const data: RegistrationData = JSON.parse(registrationReturn)
        
        // Check if this registration check is recent (within last 5 minutes)
        const now = Date.now()
        if (now - data.timestamp < 5 * 60 * 1000) {
          sessionStorage.removeItem('global_registration_return')
          
          // Prevent duplicate modals and conflicts with attendance modal
          const registrationModalShowing = sessionStorage.getItem('registrationModalShowing')
          const attendanceModalShowing = localStorage.getItem('attendanceModalShowing')
          
          if (registrationModalShowing !== 'true' && attendanceModalShowing !== 'true') {
            setRegistrationData(data)
            sessionStorage.setItem('registrationModalShowing', 'true')
            
            // Show modal after a short delay
            setTimeout(() => {
              setShowRegistrationModal(true)
            }, 1500)
          }
        } else {
          // Clean up old registration data
          sessionStorage.removeItem('global_registration_return')
        }
      }
    } catch (error) {
      console.error('Error checking registration return:', error)
      sessionStorage.removeItem('global_registration_return')
    }
  }

  const handleAttendanceConfirmationComplete = () => {
    setShowAttendanceModal(false)
    setEventNeedingConfirmation(null)
    localStorage.removeItem('attendanceModalShowing')
    
    // Refresh the page data to show updated stats
    window.location.reload()
  }

  const handleAttendanceModalClose = async () => {
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

    setShowAttendanceModal(false)
    setEventNeedingConfirmation(null)
    localStorage.removeItem('attendanceModalShowing')
  }

  const handleRegistrationModalClose = () => {
    setShowRegistrationModal(false)
    setRegistrationData(null)
    sessionStorage.removeItem('registrationModalShowing')
  }

  return (
    <>
      {children}
      
      {/* Attendance Confirmation Modal */}
      {eventNeedingConfirmation && (
        <DailyAttendanceModal
          isOpen={showAttendanceModal}
          onClose={handleAttendanceModalClose}
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
          onConfirm={handleAttendanceConfirmationComplete}
        />
      )}

      {/* Registration Confirmation Modal */}
      {registrationData && (
        <RegistrationConfirmationModal
          isOpen={showRegistrationModal}
          onClose={handleRegistrationModalClose}
          event={{
            id: registrationData.eventId,
            title: registrationData.eventTitle,
            description: '',
            event_date: registrationData.eventDate,
            event_time: registrationData.eventTime,
            organizer: registrationData.organizer,
            mode: registrationData.mode
          }}
        />
      )}
    </>
  )
}