'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { signIn, signUp, checkUsernameAvailability } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField, GoogleButton, AuthTabs } from '@/components/auth/AuthControls'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

type Tab = 'login' | 'signup'

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    college: '',
    graduation_year: 0,
  })
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameTimeout, setUsernameTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const currentYear = new Date().getFullYear()

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSignupData((prev) => ({ ...prev, [name]: name === 'graduation_year' ? parseInt(value) : value }))
    if (name !== 'username') return

    setUsernameStatus('idle')
    if (usernameTimeout) clearTimeout(usernameTimeout)
    if (value.length < 3) return
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setUsernameStatus('taken')
      return
    }
    setUsernameStatus('checking')
    // 400ms, per the spec. The answer lands as a mono line under the field.
    setUsernameTimeout(
      setTimeout(async () => {
        try {
          setUsernameStatus((await checkUsernameAvailability(value)) ? 'available' : 'taken')
        } catch {
          setUsernameStatus('taken')
        }
      }, 400)
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(loginData.email, loginData.password)
      toast.success('Welcome back')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupData.password !== signupData.confirmPassword) return toast.error('Passwords do not match')
    if (signupData.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (signupData.username.length < 3) return toast.error('Username must be at least 3 characters')
    if (usernameStatus === 'taken') return toast.error('Please choose a different username')
    if (usernameStatus === 'checking') return toast.error('Please wait for the username check')
    setLoading(true)
    try {
      await signUp(signupData.email, signupData.password, {
        username: signupData.username,
        full_name: signupData.full_name,
        college: signupData.college,
        graduation_year: signupData.graduation_year,
      })
      toast.success('Account created. Check your email to verify it.')
      setSignupData({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        full_name: '',
        college: '',
        graduation_year: 0,
      })
      setTab('login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) toast.error(error.message)
    } catch {
      toast.error('Failed to sign in with Google')
    }
  }

  /** Availability, as a mono line under the field. Never a toast. */
  const usernameNote = () => {
    switch (usernameStatus) {
      case 'checking':
        return <span className="text-type-muted">checking</span>
      case 'available':
        return <span className="text-verified">available</span>
      case 'taken':
        return (
          <span className="text-signal">
            {signupData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(signupData.username)
              ? '3-20 chars, letters numbers underscore'
              : 'taken'}
          </span>
        )
      default:
        return null
    }
  }

  const years = Array.from({ length: 11 }, (_, i) => currentYear + i).map((y) => ({
    value: String(y),
    label: String(y),
  }))

  return (
    <ProtectedRoute requireAuth={false}>
      <AuthShell
        title={tab === 'login' ? 'Sign in' : 'Create your account'}
        intro={
          tab === 'login'
            ? 'Pick up where you left off.'
            : 'Free to start. Five events a month, no card needed.'
        }
        footer={
          tab === 'login' ? (
            <p className="font-sans text-ui-s text-type-secondary">
              No account yet?{' '}
              <button type="button" onClick={() => setTab('signup')} className="text-signal rule-underline">
                Create one
              </button>
            </p>
          ) : (
            <p className="font-sans text-ui-s text-type-secondary">
              Already registered?{' '}
              <button type="button" onClick={() => setTab('login')} className="text-signal rule-underline">
                Sign in
              </button>
            </p>
          )
        }
      >
        <AuthTabs value={tab} onChange={setTab} />

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={loginData.email}
              onChange={handleLoginChange}
              placeholder="you@college.edu"
            />

            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              required
              value={loginData.password}
              onChange={handleLoginChange}
            />

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="font-sans text-ui-s text-signal rule-underline">
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>

            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-rule" />
              <span data-mono className="text-mono text-type-muted">
                or
              </span>
              <span className="h-px flex-1 bg-rule" />
            </div>

            <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />
          </form>
        ) : (
          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={signupData.email}
              onChange={handleSignupChange}
              placeholder="you@college.edu"
            />

            <div>
              <Field
                label="Username"
                name="username"
                required
                value={signupData.username}
                onChange={handleSignupChange}
                placeholder="how others will find you"
              />
              <p data-mono className="mt-1 text-mono">
                {usernameNote()}
              </p>
            </div>

            <Field
              label="Full name"
              name="full_name"
              autoComplete="name"
              required
              value={signupData.full_name}
              onChange={handleSignupChange}
              placeholder="Your name"
            />

            <Field
              label="College"
              name="college"
              required
              value={signupData.college}
              onChange={handleSignupChange}
              placeholder="Where you study"
            />

            <Select
              label="Graduation year"
              name="graduation_year"
              required
              value={signupData.graduation_year ? String(signupData.graduation_year) : ''}
              onChange={handleSignupChange}
              options={[{ value: '', label: 'Select a year' }, ...years]}
            />

            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              required
              value={signupData.password}
              onChange={handleSignupChange}
              hint="At least 6 characters."
            />

            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={signupData.confirmPassword}
              onChange={handleSignupChange}
              error={
                signupData.confirmPassword && signupData.confirmPassword !== signupData.password
                  ? 'These do not match'
                  : null
              }
            />

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>

            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-rule" />
              <span data-mono className="text-mono text-type-muted">
                or
              </span>
              <span className="h-px flex-1 bg-rule" />
            </div>

            <GoogleButton onClick={handleGoogleSignIn} disabled={loading} />

            <p className="font-serif text-ui-s text-type-muted">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-signal rule-underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-signal rule-underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}
      </AuthShell>
    </ProtectedRoute>
  )
}
