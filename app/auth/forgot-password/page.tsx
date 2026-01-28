'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
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
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Forgot Password?</h2>
          <p className="text-neutral-200">
            Enter your email address and we'll send you an OTP to reset your password
          </p>
        </div>
        
        <div className="backdrop-blur-glass rounded-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                placeholder="Enter your registered email"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-white text-primary-600 hover:bg-neutral-100"
            >
              Send OTP
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth" 
              className="inline-flex items-center text-accent-300 hover:text-accent-200 text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}