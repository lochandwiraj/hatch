'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, checkUsernameAvailability } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    college: '',
    graduation_year: new Date().getFullYear()
  })

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSignupData(prev => ({
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(loginData.email, loginData.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (signupData.username.length < 3) {
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
      await signUp(signupData.email, signupData.password, {
        username: signupData.username,
        full_name: signupData.full_name,
        college: signupData.college,
        graduation_year: signupData.graduation_year
      })
      
      toast.success('Account created successfully! Please check your email to verify your account.')
      
      // Reset signup form
      setSignupData({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        full_name: '',
        college: '',
        graduation_year: new Date().getFullYear()
      })
      
      // Flip to login side
      const toggleElement = document.getElementById('toggle') as HTMLInputElement
      if (toggleElement) {
        toggleElement.checked = false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'available':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'taken':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)

  return (
    <ProtectedRoute requireAuth={false}>
      <div data-auth-page className="h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <div className="wrapper">
          <div className="switch">
            <input type="checkbox" className="toggle" id="toggle" />
            <label className="slider" htmlFor="toggle"></label>
            <div className="card-side"></div>
            
            <div className="flip-card__inner">
              {/* Login Form (Front) */}
              <div className="flip-card__front">
                <div className="title">Log in</div>
                <form className="flip-card__form" onSubmit={handleLogin}>
                  <input
                    className="flip-card__input"
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                  />
                  <input
                    className="flip-card__input"
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                  />
                  <button className="flip-card__btn" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Let\'s go!'}
                  </button>
                </form>
              </div>
              
              {/* Signup Form (Back) */}
              <div className="flip-card__back">
                <div className="title">Sign up</div>
                <form className="flip-card__form" onSubmit={handleSignup}>
                  <input
                    className="flip-card__input"
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                  />
                  <div style={{ position: 'relative', width: '250px' }}>
                    <input
                      className="flip-card__input"
                      name="username"
                      placeholder="Username"
                      type="text"
                      value={signupData.username}
                      onChange={handleSignupChange}
                      required
                      style={{ paddingRight: '30px' }}
                    />
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {getUsernameIcon()}
                    </div>
                  </div>
                  <input
                    className="flip-card__input"
                    name="full_name"
                    placeholder="Full Name"
                    type="text"
                    value={signupData.full_name}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    className="flip-card__input"
                    name="college"
                    placeholder="College"
                    type="text"
                    value={signupData.college}
                    onChange={handleSignupChange}
                    required
                  />
                  <select
                    className="flip-card__input"
                    name="graduation_year"
                    value={signupData.graduation_year}
                    onChange={handleSignupChange}
                    required
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <input
                    className="flip-card__input"
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    className="flip-card__input"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                  />
                  <button 
                    className="flip-card__btn" 
                    type="submit" 
                    disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  >
                    {loading ? 'Creating...' : 'Confirm!'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}