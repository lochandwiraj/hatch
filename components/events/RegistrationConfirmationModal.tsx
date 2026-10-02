'use client'

import { useState } from 'react'
import { Overlay } from '@/components/ui/Overlay'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
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

export default function RegistrationConfirmationModal({ isOpen, onClose, event }: RegistrationConfirmationModalProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  if (!isOpen || !event) return null

  const handleConfirm = async () => {
    if (!user) { toast.error('Please log in to register for events'); return }
    setSaving(true)
    try {
      // Ask the database whether this user still has room this month before
      // registering. The cap lives in user_profiles and is reset against
      // last_attendance_reset, so only the server can answer this correctly.
      const { data: allowed, error: capError } = await supabase.rpc('can_attend_event', {
        user_uuid: user.id,
      })
      if (capError) throw capError
      if (allowed === false) {
        toast.error('You have used every event on your tier this month')
        setSaving(false)
        onClose()
        return
      }

      // Registration goes through the RPC, not a raw insert. The function owns
      // the duplicate check and whatever else the database enforces, and
      // reimplementing that on the client is how the two drift apart.
      const { error } = await supabase.rpc('register_for_event', {
        user_uuid: user.id,
        event_uuid: event.id,
      })
      if (error) {
        if (error.code === '23505') toast.success('You are already registered for this event')
        else throw error
      } else {
        toast.success('Event added to your calendar')
      }
      onClose()
    } catch {
      toast.error('Failed to add event to calendar')
    } finally {
      setSaving(false)
    }
  }

  const handleDecline = () => {
    toast.success('No problem! You can register anytime from the events page.')
    onClose()
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Overlay open={isOpen} onClose={onClose} align="bottom" className="w-full lg:max-w-md">
      <div
        className="w-full max-w-md"
        style={{
          background: 'var(--ink-raised)',
          border: '1px solid var(--rule)',
          animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-rule-strong">
          <p className="text-ui-s text-type-muted uppercase tracking-widest font-medium">Registration</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-type-muted hover:text-type-primary hover:bg-ink-raised"
          >
            <Glyph name="cross" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Question */}
          <div>
            <h2 className="text-body font-semibold text-type-primary mb-1">Did you register for this event?</h2>
            <p className="text-ui-s text-type-muted">We'll add it to your calendar so you don't miss it.</p>
          </div>

          {/* Event card */}
          <div
            className="p-4 space-y-3"
            style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}
          >
            <p className="text-ui font-medium text-type-primary leading-snug">{event.title}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Glyph name="calendar" className="w-4 h-4 text-type-muted shrink-0" />
                <span className="text-ui-s text-type-secondary">{formattedDate}</span>
              </div>
              {event.event_time && (
                <div className="flex items-center gap-2">
                  <Glyph name="clock" className="w-4 h-4 text-type-muted shrink-0" />
                  <span className="text-ui-s text-type-secondary">at {event.event_time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Glyph name="pin" className="w-4 h-4 text-type-muted shrink-0" />
                <span className="text-ui-s text-type-secondary">{event.mode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Glyph name="users" className="w-4 h-4 text-type-muted shrink-0" />
                <span className="text-ui-s text-type-secondary">{event.organizer}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDecline}
              disabled={saving}
              className="flex-1 text-ui text-type-secondary hover:text-type-primary py-3 hover:bg-ink-raised"
              style={{ border: '1px solid var(--rule)' }}
            >
              No, I didn't
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 text-ui font-medium text-type-primary py-3 active:scale-[0.98]"
              style={{ background: 'var(--ink-raised)', }}
            >
              {saving ? 'Adding...' : 'Yes, add to calendar'}
            </button>
          </div>

          <p className="text-ui-s text-type-muted text-center">
            Manage registered events from your Calendar page
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </Overlay>
  )
}
