'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import RegistrationConfirmationModal from './RegistrationConfirmationModal'

interface RegistrationData {
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string | null
  organizer: string
  mode: string
  timestamp: number
}

export default function GlobalRegistrationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (user && !checkingRef.current) {
      checkForRegistrationReturn()
    }
  }, [user])

  // Check for registration return every few seconds when window is focused
  useEffect(() => {
    const handleFocus = () => {
      if (user && !checkingRef.current) {
        setTimeout(() => checkForRegistrationReturn(), 1000)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const checkForRegistrationReturn = async () => {
    if (!user || checkingRef.current) return

    checkingRef.current = true

    try {
      const registrationReturn = sessionStorage.getItem('global_registration_return')
      if (registrationReturn) {
        const data: RegistrationData = JSON.parse(registrationReturn)
        
        // Check if this registration check is recent (within last 5 minutes)
        const now = Date.now()
        if (now - data.timestamp < 5 * 60 * 1000) {
          sessionStorage.removeItem('global_registration_return')
          
          // Prevent duplicate modals
          const modalShowing = sessionStorage.getItem('registrationModalShowing')
          if (modalShowing !== 'true') {
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
    } finally {
      checkingRef.current = false
    }
  }

  const handleModalClose = () => {
    setShowRegistrationModal(false)
    setRegistrationData(null)
    sessionStorage.removeItem('registrationModalShowing')
  }

  return (
    <>
      {children}
      
      {registrationData && (
        <RegistrationConfirmationModal
          isOpen={showRegistrationModal}
          onClose={handleModalClose}
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