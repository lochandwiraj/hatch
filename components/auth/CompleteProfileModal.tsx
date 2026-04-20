'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function CompleteProfileModal() {
  const { user, profile, refreshProfile } = useAuth()
  const [college, setCollege] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()

  // Show only when logged in and college is missing (Google sign-up users)
  if (!user || !profile || profile.college) return null

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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-1.5">One last step</p>
          <h2 className="text-lg font-semibold text-white">Complete your profile</h2>
          <p className="text-sm text-zinc-500 mt-1">
            We need a couple more details to personalise your HATCH experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              College / University <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={college}
              onChange={e => setCollege(e.target.value)}
              placeholder="Your college name"
              required
              autoFocus
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
              style={{ background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Graduation Year <span className="text-red-400">*</span>
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
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
              style={{ background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(124,58,237,0.3)',
            }}
          >
            {submitting ? 'Saving...' : 'Complete profile'}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-4">
          Signed in as <span className="text-zinc-500">{user.email}</span>
        </p>
      </div>
    </div>
  )
}
