'use client'

import { useState } from 'react'
import { Overlay } from '@/components/ui/Overlay'
import type { Tables } from '@/lib/supabase'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

type Event = Tables<'events'>

interface DailyAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onConfirm: () => void
}

export default function DailyAttendanceModal({ isOpen, onClose, event, onConfirm }: DailyAttendanceModalProps) {
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)

  if (!isOpen || !event) return null

  const handleAttend = async () => {
    if (!user) { toast.error('Please log in to confirm attendance'); return }
    setConfirming(true)
    try {
      const { data, error } = await supabase.rpc('confirm_attendance', {
        did_attend: true,
        user_uuid: user.id,
        event_uuid: event.id,
      })
      if (error) throw error
      toast.success(data ? 'Attendance confirmed' : 'Attendance already recorded')
      onConfirm()
      onClose()
    } catch {
      toast.error('Failed to confirm attendance')
    } finally {
      setConfirming(false)
    }
  }

  const handleDidNotAttend = async () => {
    if (!user) return
    try {
      const { error } = await supabase.rpc('confirm_attendance', {
        did_attend: false,
        user_uuid: user.id,
        event_uuid: event.id,
      })
      if (error && error.code !== '23505') console.error('Error:', error)
      toast.success('Thanks for letting us know')
      onClose()
    } catch (err) {
      console.error('Error:', err)
    }
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
          <p className="text-ui-s text-type-muted uppercase tracking-widest font-medium">Attendance</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-type-muted hover:text-type-primary hover:bg-ink-raised"
          >
            <Glyph name="cross" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-body font-semibold text-type-primary mb-1">Did you attend this event?</h2>
            <p className="text-ui-s text-type-muted">We'll update your attendance stats and activity.</p>
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
              onClick={handleDidNotAttend}
              disabled={confirming}
              className="flex-1 text-ui text-type-secondary hover:text-type-primary py-3 hover:bg-ink-raised"
              style={{ border: '1px solid var(--rule)' }}
            >
              No, I didn't
            </button>
            <button
              onClick={handleAttend}
              disabled={confirming}
              className="flex-1 text-ui font-medium text-type-primary py-3 active:scale-[0.98]"
              style={{ background: 'var(--ink-raised)', }}
            >
              {confirming ? 'Confirming...' : 'Yes, I attended'}
            </button>
          </div>

          <p className="text-ui-s text-type-muted text-center">
            This helps track your event participation and profile stats
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
