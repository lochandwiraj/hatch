'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, checkUsernameAvailability } from '@/lib/auth'
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
    graduation_year: new Date().getFullYear()
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
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Join HATCH</h2>
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
                  <select
                    id="graduation_year"
                    name="graduation_year"
                    required
                    value={formData.graduation_year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year} className="bg-primary-800">
                        {year}
                      </option>
                    ))}
                  </select>
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