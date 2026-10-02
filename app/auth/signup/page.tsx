'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { signUp, checkUsernameAvailability } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField, GoogleButton } from '@/components/auth/AuthControls'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    college: '',
    graduation_year: 0,
  })
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameTimeout, setUsernameTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const currentYear = new Date().getFullYear()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === 'graduation_year' ? parseInt(value) : value }))
    if (name !== 'username') return

    setUsernameStatus('idle')
    if (usernameTimeout) clearTimeout(usernameTimeout)
    if (value.length < 3) return
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setUsernameStatus('taken')
      return
    }
    setUsernameStatus('checking')
    // 400ms. The result is a mono line under the field, never a toast.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match')
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (formData.username.length < 3) return toast.error('Username must be at least 3 characters')
    if (usernameStatus === 'taken') return toast.error('Please choose a different username')
    if (usernameStatus === 'checking') return toast.error('Please wait for the username check')

    setLoading(true)
    try {
      await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.full_name,
        college: formData.college,
        graduation_year: formData.graduation_year,
      })
      toast.success('Account created. Check your email to verify it.')
      router.push('/auth')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
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

  const usernameNote = () => {
    switch (usernameStatus) {
      case 'checking':
        return <span className="text-type-muted">checking</span>
      case 'available':
        return <span className="text-verified">available</span>
      case 'taken':
        return (
          <span className="text-signal">
            {formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
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
        title="Create your account"
        intro="Free to start. Five events a month, no card needed."
        footer={
          <p className="font-sans text-ui-s text-type-secondary">
            Already registered?{' '}
            <Link href="/auth/login" className="text-signal rule-underline">
              Sign in
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@college.edu"
          />

          <div>
            <Field
              label="Username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
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
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Your name"
          />

          <Field
            label="College"
            name="college"
            required
            value={formData.college}
            onChange={handleChange}
            placeholder="Where you study"
          />

          <Select
            label="Graduation year"
            name="graduation_year"
            required
            value={formData.graduation_year ? String(formData.graduation_year) : ''}
            onChange={handleChange}
            options={[{ value: '', label: 'Select a year' }, ...years]}
          />

          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            hint="At least 6 characters."
          />

          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            error={
              formData.confirmPassword && formData.confirmPassword !== formData.password
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

          <GoogleButton onClick={handleGoogle} disabled={loading} />

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
      </AuthShell>
    </ProtectedRoute>
  )
}
