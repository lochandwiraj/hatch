'use client'

import { useState } from 'react'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        if (error.message.includes('not found')) toast.error('No account found with this email')
        else throw error
        return
      }
      toast.success('OTP sent to your email!')
      sessionStorage.setItem('reset_email', email)
      router.push('/auth/verify-otp')
    } catch { toast.error('Failed to send OTP. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      <div
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-title text-type-primary hover:opacity-80 transition-opacity"><Hatch /></Link>
          <p className="text-ui text-type-muted mt-2">Reset your password</p>
        </div>

        <div className="p-6" style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)', }}>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-6"
            style={{ border: '1px solid var(--signal)' }}>
            <Glyph name="mail" className="w-6 h-6 text-signal" />
          </div>
          <h1 className="text-body-l font-bold text-type-primary text-center mb-1">Forgot password?</h1>
          <p className="text-ui text-type-muted text-center mb-6">Enter your email and we'll send you an OTP to reset it.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-password-email-address" className="block text-ui-s font-medium text-type-secondary mb-2">Email address</label>
              <input id="forgot-password-email-address" type="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="yourmail@gmail.com"
                className="w-full px-4 py-3 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border focus:border-signal"
                style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }} />
            </div>
            <button type="submit" disabled={loading} className="w-full text-type-primary text-ui font-semibold py-3 disabled:opacity-50"
              style={{ background: 'var(--ink-raised)', }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>

          <div className="mt-6 text-center">
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
