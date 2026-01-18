'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface AttendancePrompt {
  prompt_id: string
  event_id: string
  event_title: string
  event_date: string
  prompt_date: string
}

interface AttendanceConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  prompts: AttendancePrompt[]
  onConfirm: () => void
  onAttendanceResponse: (eventId: string, attended: boolean) => void
}

export default function AttendanceConfirmationModal({ 
  isOpen, 
  onClose, 
  prompts, 
  onConfirm,
  onAttendanceResponse 
}: AttendanceConfirmationModalProps) {
  const { user } = useAuth()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAttendanceConfirmation = async (eventId: string, attended: boolean) => {
    if (!user) return

    setProcessing(eventId)

    try {
      await onAttendanceResponse(eventId, attended)
      onConfirm() // Refresh the prompts list
      
    } catch (error: any) {
      console.error('Error confirming attendance:', error)
    } finally {
      setProcessing(null)
    }
  }

  if (!isOpen || prompts.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Event Attendance Confirmation
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-neutral-600">
              Please confirm your attendance for the following events:
            </p>
          </div>

          <div className="space-y-4">
            {prompts.map((prompt) => (
              <Card key={prompt.prompt_id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {prompt.event_title}
                    </h3>
                    <div className="flex items-center text-sm text-neutral-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>Event Date: {formatDate(prompt.event_date)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAttendanceConfirmation(prompt.event_id, false)}
                      loading={processing === prompt.event_id}
                      disabled={processing !== null}
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Didn't Attend
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAttendanceConfirmation(prompt.event_id, true)}
                      loading={processing === prompt.event_id}
                      disabled={processing !== null}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Yes, I Attended
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Why confirm attendance?</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Build your event portfolio and track your learning journey</li>
              <li>Get personalized event recommendations based on your interests</li>
              <li>Unlock achievement badges and showcase your participation</li>
              <li>Help us improve event curation for the community</li>
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={onClose}>
              I'll Confirm Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}