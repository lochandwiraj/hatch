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
  category: string
}

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
      const { data, error } = await supabase.rpc('mark_manual_attendance', {
        user_uuid: user.id,
        event_uuid: event.id,
      })
      if (error) throw error
      toast.success(data ? 'Attendance confirmed! Stats updated.' : 'Attendance already recorded!')
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
      const { error } = await supabase.from('attendance_confirmations').insert({
        user_id: user.id,
        event_id: event.id,
        confirmed_at: new Date().toISOString(),
      })
      if (error && error.code !== '23505') console.error('Error:', error)
      toast.success('Thanks for letting us know!')
      onClose()
    } catch (err) {
      console.error('Error:', err)
    }
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
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Attendance</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Did you attend this event?</h2>
            <p className="text-xs text-zinc-500">We'll update your attendance stats and activity.</p>
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
              onClick={handleDidNotAttend}
              disabled={confirming}
              className="flex-1 text-sm text-zinc-400 hover:text-white py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.05]"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              No, I didn't
            </button>
            <button
              onClick={handleAttend}
              disabled={confirming}
              className="flex-1 text-sm font-medium text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
            >
              {confirming ? 'Confirming...' : 'Yes, I attended'}
            </button>
          </div>

          <p className="text-xs text-zinc-600 text-center">
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
    </div>
  )
}
