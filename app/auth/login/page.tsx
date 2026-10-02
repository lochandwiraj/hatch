'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField, GoogleButton } from '@/components/auth/AuthControls'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in')
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

  return (
    <ProtectedRoute requireAuth={false}>
      <AuthShell
        title="Sign in"
        intro="Pick up where you left off."
        footer={
          <p className="font-sans text-ui-s text-type-secondary">
            No account yet?{' '}
            <Link href="/auth/signup" className="text-signal rule-underline">
              Create one
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
          />

          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          <GoogleButton onClick={handleGoogle} disabled={loading} />
        </form>
      </AuthShell>
    </ProtectedRoute>
  )
}
