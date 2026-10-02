'use client'

import { useState, useEffect, useRef } from 'react'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_email')
    if (!storedEmail) {
      toast.error('Please start the password reset process again')
      router.push('/auth/forgot-password')
      return
    }
    setEmail(storedEmail)

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'recovery',
      })
      if (error) throw error
      if (data.user) {
        toast.success('OTP verified successfully!')
        sessionStorage.setItem('reset_session', data.session?.access_token || '')
        router.push('/auth/reset-password')
      }
    } catch {
      toast.error('Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      toast.success('New OTP sent to your email!')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      toast.error('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-title text-type-primary hover:opacity-80 transition-opacity"><Hatch /></Link>
          <p className="text-ui text-type-muted mt-2">Verify your identity</p>
        </div>
        <div className="bg-ink-raised border border-rule-strong p-6">
          <h1 className="text-body font-medium text-type-primary mb-1">Enter OTP</h1>
          <p className="text-ui text-type-muted mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-ui font-medium text-type-primary mb-6">{email}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-body-l font-semibold bg-ink-raised border border-rule-strong text-type-primary focus:outline-none focus:border-signal focus:border focus:border-signal"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal hover:bg-signal disabled:opacity-50 text-ink text-ui font-medium py-3"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            {countdown > 0 ? (
              <p className="text-ui-s text-type-muted">Resend OTP in {countdown}s</p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-ui-s text-signal hover:text-signal disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
            <div>
              <Link href="/auth/forgot-password" className="inline-flex items-center gap-2 text-ui text-type-secondary hover:text-type-primary">
                <Glyph name="arrow-left" className="w-4 h-4" />
                Change email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
