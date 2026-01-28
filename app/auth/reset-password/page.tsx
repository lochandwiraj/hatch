'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has valid session from OTP verification
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Session expired. Please start the password reset process again.')
        router.push('/auth/forgot-password')
      }
    }

    checkSession()
  }, [router])

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long'
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number'
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      
      // Clear session storage
      sessionStorage.removeItem('reset_email')
      sessionStorage.removeItem('reset_session')
      
      // Sign out to ensure clean state
      await supabase.auth.signOut()
      
      // Redirect to login
      router.push('/auth')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' }
    if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' }
    return { label: 'Strong', color: 'bg-green-500', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Create New Password</h2>
          <p className="text-neutral-200">
            Enter your new password below
          </p>
        </div>
        
        <div className="backdrop-blur-glass rounded-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-300 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Password Strength</span>
                    <span>{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-300 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Password Requirements:</h4>
              <ul className="text-xs text-neutral-300 space-y-1">
                <li className={password.length >= 8 ? 'text-green-400' : ''}>
                  • At least 8 characters long
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>
                  • One lowercase letter
                </li>
                <li className={/\d/.test(password) ? 'text-green-400' : ''}>
                  • One number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-400' : ''}>
                  • One special character
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!password || !confirmPassword || password !== confirmPassword}
              className="w-full bg-white text-primary-600 hover:bg-neutral-100"
            >
              Update Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth" 
              className="text-accent-300 hover:text-accent-200 text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}