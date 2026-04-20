'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, checkUsernameAvailability } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    college: '',
    graduation_year: 0
  })
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'graduation_year' ? parseInt(value) : value
    }))

    // Handle username validation with debouncing
    if (name === 'username') {
      setUsernameStatus('idle')
      
      // Clear existing timeout
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout)
      }

      // Only check if username has at least 3 characters and valid format
      if (value.length >= 3) {
        // Check format first
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
        if (!usernameRegex.test(value)) {
          setUsernameStatus('taken') // Use 'taken' to show error state
          return
        }

        setUsernameStatus('checking')
        
        // Set new timeout for username check
        const timeout = setTimeout(async () => {
          try {
            const isAvailable = await checkUsernameAvailability(value)
            setUsernameStatus(isAvailable ? 'available' : 'taken')
          } catch (error: any) {
            console.error('Username check error:', error)
            setUsernameStatus('taken')
          }
        }, 500) // 500ms delay
        
        setUsernameCheckTimeout(timeout)
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout)
      }
    }
  }, [usernameCheckTimeout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    if (usernameStatus === 'taken') {
      toast.error('Please choose a different username')
      return
    }

    if (usernameStatus === 'checking') {
      toast.error('Please wait for username validation to complete')
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.full_name,
        college: formData.college,
        graduation_year: formData.graduation_year
      })
      
      toast.success('Account created successfully! Please check your email to verify your account.')
      router.push('/auth')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'available':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'taken':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getUsernameMessage = () => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    
    switch (usernameStatus) {
      case 'checking':
        return <span className="text-yellow-600 text-sm">Checking availability...</span>
      case 'available':
        return <span className="text-green-600 text-sm">Username is available!</span>
      case 'taken':
        if (formData.username.length > 0 && !usernameRegex.test(formData.username)) {
          return <span className="text-red-600 text-sm">Username must be 3-20 characters (letters, numbers, underscore only)</span>
        }
        return <span className="text-red-600 text-sm">Username is already taken</span>
      default:
        return formData.username.length > 0 && formData.username.length < 3 ? 
          <span className="text-neutral-400 text-sm">Username must be at least 3 characters</span> : null
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Join <span className="font-qepho">HATCH</span></h2>
            <p className="text-neutral-200">Create your account and start discovering events</p>
          </div>
          
          <div className="backdrop-blur-glass rounded-xl p-8 border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent ${
                        usernameStatus === 'taken' ? 'border-red-400' : 
                        usernameStatus === 'available' ? 'border-green-400' : ''
                      }`}
                      placeholder="Choose a username"
                      minLength={3}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getUsernameIcon()}
                    </div>
                  </div>
                  {getUsernameMessage()}
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-white mb-2">
                    College/Organization
                  </label>
                  <input
                    id="college"
                    name="college"
                    type="text"
                    required
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your college or organization"
                  />
                </div>

                <div>
                  <label htmlFor="graduation_year" className="block text-sm font-medium text-white mb-2">
                    Graduation Year
                  </label>
                  <input
                    id="graduation_year"
                    name="graduation_year"
                    type="number"
                    required
                    min={currentYear}
                    max={currentYear + 10}
                    value={formData.graduation_year || ''}
                    onChange={handleChange}
                    placeholder="Year of graduation e.g. 2027"
                    onKeyDown={e => { if (!/[0-9]|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                className="w-full bg-white text-primary-600 hover:bg-neutral-100"
              >
                Create Account
              </Button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-neutral-400">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/dashboard` },
                  })
                  if (error) toast.error(error.message)
                }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all duration-200 border border-white/30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-neutral-300">
                Already have an account?{' '}
                <Link href="/auth" className="text-accent-300 hover:text-accent-200 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}