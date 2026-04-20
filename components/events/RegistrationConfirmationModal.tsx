'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { XMarkIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline'
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
      const { error } = await supabase.from('user_registrations').insert({
        user_id: user.id,
        event_id: event.id,
        registration_status: 'registered',
      })
      if (error) {
        if (error.code === '23505') toast.success('You are already registered for this event!')
        else throw error
      } else {
        toast.success('Event added to your calendar!')
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Registration</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Question */}
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Did you register for this event?</h2>
            <p className="text-xs text-zinc-500">We'll add it to your calendar so you don't miss it.</p>
          </div>

          {/* Event card */}
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-sm font-medium text-white leading-snug">{event.title}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-400">{formattedDate}</span>
              </div>
              {event.event_time && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className="text-xs text-zinc-400">at {event.event_time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-400">{event.mode}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-400">{event.organizer}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDecline}
              disabled={saving}
              className="flex-1 text-sm text-zinc-400 hover:text-white py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.05]"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              No, I didn't
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 text-sm font-medium text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
            >
              {saving ? 'Adding...' : 'Yes, add to calendar'}
            </button>
          </div>

          <p className="text-xs text-zinc-600 text-center">
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
    </div>
  )
}
