'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send OTP directly - Supabase will handle if user exists or not
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('User not found') || error.message.includes('not found')) {
          toast.error('No account found with this email address')
        } else {
          throw error
        }
        setLoading(false)
        return
      }

      toast.success('OTP sent to your email!')
      // Store email in sessionStorage for the next step
      sessionStorage.setItem('reset_email', email)
      router.push('/auth/verify-otp')
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-auth-page className="h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <div className="wrapper">
        <div className="flip-card__inner" style={{ transform: 'none' }}>
          {/* Forgot Password Form */}
          <div className="flip-card__front" style={{ transform: 'none' }}>
            <div className="title">Forgot Password?</div>
            <div className="text-center mb-6">
              <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-var(--main-color)" />
              <p className="text-sm text-var(--font-color-sub)">
                Enter your email address and we'll send you an OTP to reset your password
              </p>
            </div>
            
            <form className="flip-card__form" onSubmit={handleSubmit}>
              <input
                className="flip-card__input"
                name="email"
                placeholder="Enter your registered email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="flip-card__btn"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>

            <div className="text-center mt-4">
              <Link 
                href="/auth" 
                className="inline-flex items-center text-var(--input-focus) hover:underline text-sm"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}