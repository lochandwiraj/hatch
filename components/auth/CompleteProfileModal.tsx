'use client'

import { useState } from 'react'
import { Overlay } from '@/components/ui/Overlay'
import { Hatch } from '@/components/brand/Hatch'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function CompleteProfileModal() {
  const { user, profile, refreshProfile } = useAuth()
  const [college, setCollege] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // The modal had no open state and no way out, so Escape had nothing to do.
  // It can now be dismissed for the session; it returns on the next load until
  // the profile is actually completed.
  const [dismissed, setDismissed] = useState(false)

  const currentYear = new Date().getFullYear()

  // Show only when logged in and college is missing (Google sign-up users)
  if (!user || !profile || profile.college || dismissed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!college.trim()) { toast.error('Please enter your college name'); return }
    const year = parseInt(graduationYear)
    if (!year || year < currentYear || year > currentYear + 10) {
      toast.error(`Enter a valid graduation year (${currentYear}–${currentYear + 10})`)
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ college: college.trim(), graduation_year: year })
        .eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profile completed!')
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Overlay open onClose={() => setDismissed(true)} align="bottom" className="w-full lg:max-w-md">
      <div
        className="w-full max-w-sm p-6"
        style={{
          background: 'var(--ink-raised)',
          border: '1px solid var(--rule)',
          }}
      >
        <div className="mb-6">
          <div className="w-12 h-12 flex items-center justify-center mb-4" style={{ border: '1px solid var(--signal)' }}>
            <svg className="w-6 h-6 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-ui-s text-signal uppercase tracking-widest font-medium mb-2">One last step</p>
          <h2 className="text-body-l font-semibold text-type-primary">Complete your profile</h2>
          <p className="text-ui text-type-muted mt-1">
            We need a couple more details to personalise your <Hatch /> experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-ui-s font-medium text-type-secondary mb-2">
              College / University <span className="text-signal">*</span>
            </label>
            <input
              type="text"
              value={college}
              onChange={e => setCollege(e.target.value)}
              placeholder="Your college name"
              required
              autoFocus
              className="w-full px-4 py-3 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border focus:border-signal"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}
            />
          </div>

          <div>
            <label className="block text-ui-s font-medium text-type-secondary mb-2">
              Graduation Year <span className="text-signal">*</span>
            </label>
            <input
              type="number"
              value={graduationYear}
              onChange={e => setGraduationYear(e.target.value)}
              placeholder={`e.g. ${currentYear + 1}`}
              min={currentYear}
              max={currentYear + 10}
              required
              onKeyDown={e => { if (!/[0-9]|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }}
              className="w-full px-4 py-3 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border focus:border-signal"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-type-primary text-ui font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--ink-raised)',
              }}
          >
            {submitting ? 'Saving...' : 'Complete profile'}
          </button>
        </form>

        <p className="text-ui-s text-type-muted text-center mt-4">
          Signed in as <span className="text-type-muted">{user.email}</span>
        </p>
      </div>
        </Overlay>
  )
}
