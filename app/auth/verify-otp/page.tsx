'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('reset_email')
    if (!storedEmail) {
      toast.error('Please start the password reset process again')
      router.push('/auth/forgot-password')
      return
    }
    setEmail(storedEmail)

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
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
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'recovery'
      })

      if (error) throw error

      if (data.user) {
        toast.success('OTP verified successfully!')
        // Store session for password reset
        sessionStorage.setItem('reset_session', data.session?.access_token || '')
        router.push('/auth/reset-password')
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
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

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      console.error('Error resending OTP:', error)
      toast.error('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div data-auth-page className="h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <div className="wrapper">
        <div className="flip-card__inner" style={{ transform: 'none' }}>
          {/* Verify OTP Form */}
          <div className="flip-card__front" style={{ transform: 'none', height: 'auto', padding: '30px 20px' }}>
            <div className="title">Verify OTP</div>
            <div className="text-center mb-6">
              <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-var(--main-color)" />
              <p className="text-sm text-var(--font-color-sub) mb-2">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-var(--input-focus)">{email}</p>
            </div>
            
            <form className="flip-card__form" onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-10 h-10 text-center text-lg font-bold border-2 border-var(--main-color) rounded bg-var(--bg-color) text-var(--font-color) focus:border-var(--input-focus) focus:outline-none"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        margin: '0 2px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flip-card__btn"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="text-center mt-4 space-y-2">
              <div>
                {countdown > 0 ? (
                  <p className="text-xs text-var(--font-color-sub)">
                    Resend OTP in {countdown} seconds
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-xs text-var(--input-focus) hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
              
              <Link 
                href="/auth/forgot-password" 
                className="inline-flex items-center text-var(--input-focus) hover:underline text-xs"
              >
                <ArrowLeftIcon className="h-3 w-3 mr-1" />
                Change Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}