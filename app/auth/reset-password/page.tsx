'use client'

import { useState, useEffect } from 'react'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

const validatePassword = (password: string) => {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/\d/.test(password)) return 'Password must contain at least one number'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character'
  return null
}

const getStrength = (p: string) => {
  const score = requirements.filter(r => r.test(p)).length
  if (score <= 2) return { label: 'Weak', color: 'bg-signal', width: 'w-1/3' }
  if (score <= 3) return { label: 'Fair', color: 'bg-deadline', width: 'w-2/3' }
  return { label: 'Strong', color: 'bg-verified', width: 'w-full' }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Session expired. Please start the password reset process again.')
        router.push('/auth/forgot-password')
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validatePassword(password)
    if (err) { toast.error(err); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated successfully!')
      sessionStorage.removeItem('reset_email')
      sessionStorage.removeItem('reset_session')
      await supabase.auth.signOut()
      router.push('/auth')
    } catch {
      toast.error('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password ? getStrength(password) : null
  const canSubmit = !loading && password && confirmPassword && password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-title text-type-primary hover:opacity-80 transition-opacity"><Hatch /></Link>
          <p className="text-ui text-type-muted mt-2">Create a new password</p>
        </div>
        <div className="bg-ink-raised border border-rule-strong p-6">
          <h1 className="text-body font-medium text-type-primary mb-1">Reset password</h1>
          <p className="text-ui text-type-muted mb-6">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-ui-s text-type-secondary mb-2">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-ink-raised border border-rule-strong px-3 py-3 pr-12 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border-signal focus:border focus:border-signal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-type-muted hover:text-type-primary"
                >
                  {showPassword ? <Glyph name="eye-off" className="w-4 h-4" /> : <Glyph name="eye" className="w-4 h-4" />}
                </button>
              </div>

              {strength && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-ui-s text-type-muted">Strength</span>
                    <span className="text-ui-s text-type-muted">{strength.label}</span>
                  </div>
                  <div className="h-1 bg-ink-raised overflow-hidden">
                    <div className={`h-full  ${strength.color} ${strength.width}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-ui-s text-type-secondary mb-2">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-ink-raised border border-rule-strong px-3 py-3 pr-12 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border-signal focus:border focus:border-signal"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-type-muted hover:text-type-primary"
                >
                  {showConfirm ? <Glyph name="eye-off" className="w-4 h-4" /> : <Glyph name="eye" className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-ui-s text-signal mt-1">Passwords do not match</p>
              )}
            </div>

            {password && (
              <div className="bg-ink-raised border border-rule-strong p-3">
                <p className="text-ui-s text-type-muted mb-2">Requirements</p>
                <ul className="space-y-1">
                  {requirements.map(req => (
                    <li key={req.label} className={`flex items-center gap-2 text-ui-s  ${req.test(password) ? 'text-verified' : 'text-type-muted'}`}>
                      <span>{req.test(password) ? '■' : '□'}</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-signal hover:bg-signal disabled:opacity-50 disabled:cursor-not-allowed text-ink text-ui font-medium py-3"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth" className="inline-flex items-center gap-2 text-ui text-type-secondary hover:text-type-primary">
              <Glyph name="arrow-left" className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
