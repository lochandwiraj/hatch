'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

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

    if (strength <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' }
    if (strength <= 3) return { label: 'Medium', color: '#eab308', width: '66%' }
    return { label: 'Strong', color: '#22c55e', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <ProtectedRoute requireAuth={false}>
      <div data-auth-page className="h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div className="wrapper">
          <div className="flip-card__inner" style={{ height: 'auto', minHeight: '500px' }}>
            {/* Reset Password Form */}
            <div className="flip-card__front" style={{ height: 'auto', minHeight: '500px', padding: '30px' }}>
              <div className="title">Reset Password</div>
              <form className="flip-card__form" onSubmit={handleSubmit} style={{ gap: '15px' }}>
                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    className="flip-card__input"
                    name="password"
                    placeholder="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <EyeIcon style={{ width: '16px', height: '16px' }} />
                    )}
                  </button>
                </div>

                {password && (
                  <div style={{ width: '250px', marginTop: '5px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '11px', 
                      color: '#666', 
                      marginBottom: '4px' 
                    }}>
                      <span>Password Strength</span>
                      <span>{passwordStrength.label}</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#e5e5e5', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          backgroundColor: passwordStrength.color,
                          width: passwordStrength.width,
                          transition: 'all 0.3s ease',
                          borderRadius: '2px'
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div style={{ position: 'relative', width: '250px' }}>
                  <input
                    className="flip-card__input"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <EyeIcon style={{ width: '16px', height: '16px' }} />
                    )}
                  </button>
                </div>

                {confirmPassword && password !== confirmPassword && (
                  <p style={{ fontSize: '11px', color: '#ef4444', margin: '0', width: '250px' }}>
                    Passwords do not match
                  </p>
                )}

                <div style={{ 
                  width: '250px', 
                  padding: '15px', 
                  backgroundColor: '#f8f8f8', 
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  marginTop: '10px'
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#323232', margin: '0 0 8px 0' }}>
                    Password Requirements:
                  </h4>
                  <ul style={{ fontSize: '10px', color: '#666', margin: '0', padding: '0', listStyle: 'none' }}>
                    <li style={{ color: password.length >= 8 ? '#22c55e' : '#666', marginBottom: '2px' }}>
                      • At least 8 characters long
                    </li>
                    <li style={{ color: /[A-Z]/.test(password) ? '#22c55e' : '#666', marginBottom: '2px' }}>
                      • One uppercase letter
                    </li>
                    <li style={{ color: /[a-z]/.test(password) ? '#22c55e' : '#666', marginBottom: '2px' }}>
                      • One lowercase letter
                    </li>
                    <li style={{ color: /\d/.test(password) ? '#22c55e' : '#666', marginBottom: '2px' }}>
                      • One number
                    </li>
                    <li style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#22c55e' : '#666' }}>
                      • One special character
                    </li>
                  </ul>
                </div>

                <button 
                  className="flip-card__btn" 
                  type="submit" 
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  style={{ 
                    opacity: (loading || !password || !confirmPassword || password !== confirmPassword) ? 0.6 : 1,
                    cursor: (loading || !password || !confirmPassword || password !== confirmPassword) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <Link 
                  href="/auth" 
                  style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    textDecoration: 'none',
                    marginTop: '10px'
                  }}
                >
                  Back to Sign In
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}