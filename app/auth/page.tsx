'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { signIn, signUp, checkUsernameAvailability } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type Tab = 'login' | 'signup'

const inputStyle = {
  background: 'rgba(3,3,8,0.9)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all duration-200'

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const router = useRouter()

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({
    email: '', password: '', confirmPassword: '',
    username: '', full_name: '', college: '',
    graduation_year: 0,
  })
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSignupData(prev => ({ ...prev, [name]: name === 'graduation_year' ? parseInt(value) : value }))
    if (name === 'username') {
      setUsernameStatus('idle')
      if (usernameTimeout) clearTimeout(usernameTimeout)
      if (value.length >= 3) {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) { setUsernameStatus('taken'); return }
        setUsernameStatus('checking')
        const t = setTimeout(async () => {
          try {
            const ok = await checkUsernameAvailability(value)
            setUsernameStatus(ok ? 'available' : 'taken')
          } catch { setUsernameStatus('taken') }
        }, 500)
        setUsernameTimeout(t)
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in')
    } finally { setLoading(false) }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupData.password !== signupData.confirmPassword) return toast.error('Passwords do not match')
    if (signupData.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (signupData.username.length < 3) return toast.error('Username must be at least 3 characters')
    if (usernameStatus === 'taken') return toast.error('Please choose a different username')
    if (usernameStatus === 'checking') return toast.error('Please wait for username validation')
    setLoading(true)
    try {
      await signUp(signupData.email, signupData.password, {
        username: signupData.username, full_name: signupData.full_name,
        college: signupData.college, graduation_year: signupData.graduation_year,
      })
      toast.success('Account created! Check your email to verify.')
      setSignupData({ email: '', password: '', confirmPassword: '', username: '', full_name: '', college: '', graduation_year: 0 })
      setTab('login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally { setLoading(false) }
  }

  const currentYear = new Date().getFullYear()

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

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white transition-all duration-200 hover:bg-white/[0.06] active:scale-[0.98]"
      style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  )

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full orb-drift-1"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 65%)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full orb-drift-2"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="font-qepho text-2xl text-white hover:opacity-80 transition-opacity">
              HATCH
            </Link>
            <p className="text-sm text-zinc-500 mt-2">
              {tab === 'login' ? 'Welcome back' : 'Join thousands of students'}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(10,10,18,0.9)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(3,3,8,0.8)' }}>
              {(['login', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-sm py-2 rounded-lg transition-all duration-200 font-medium ${
                    tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  style={tab === t ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.25)' } : {}}
                >
                  {t === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                    <input name="email" type="email" required value={loginData.email}
                      onChange={handleLoginChange} placeholder="yourmail@gmail.com"
                      className={`${inputCls} focus:border-violet-500/50 focus:ring-violet-500/20`}
                      style={inputStyle} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-400">Password</label>
                      <Link href="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input name="password" type={showPwd ? 'text' : 'password'} required
                        value={loginData.password} onChange={handleLoginChange} placeholder="••••••••"
                        className={`${inputCls} pr-10 focus:border-violet-500/50 focus:ring-violet-500/20`}
                        style={inputStyle} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
                    style={{ background: loading ? 'rgba(124,58,237,0.6)' : 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.3)' }}>
                    {loading ? 'Signing in...' : 'Sign in'}
                  </motion.button>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-xs text-zinc-600">or</span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                  </div>
                  <GoogleButton />
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  onSubmit={handleSignup}
                  className="space-y-3.5"
                >
                  <GoogleButton />
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-xs text-zinc-600">or sign up with email</span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                  </div>
                  {[
                    { name: 'email', label: 'Email', type: 'email', placeholder: 'yourmail@gmail.com' },
                    { name: 'full_name', label: 'Full name', type: 'text', placeholder: 'Your full name' },
                    { name: 'college', label: 'College', type: 'text', placeholder: 'Your college name' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{f.label}</label>
                      <input name={f.name} type={f.type} required
                        value={(signupData as any)[f.name]} onChange={handleSignupChange}
                        placeholder={f.placeholder}
                        className={`${inputCls} focus:border-violet-500/50 focus:ring-violet-500/20`}
                        style={inputStyle} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Username</label>
                    <div className="relative">
                      <input name="username" type="text" required value={signupData.username}
                        onChange={handleSignupChange} placeholder="your_username"
                        className={`${inputCls} pr-10 focus:border-violet-500/50 focus:ring-violet-500/20`}
                        style={inputStyle} />
                      {usernameStatus !== 'idle' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && <div className="w-3.5 h-3.5 border border-zinc-500 border-t-transparent rounded-full animate-spin" />}
                          {usernameStatus === 'available' && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
                          {usernameStatus === 'taken' && <XCircleIcon className="w-4 h-4 text-red-400" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Graduation year</label>
                    <input
                      name="graduation_year"
                      type="number"
                      required
                      min={currentYear}
                      max={currentYear + 10}
                      value={signupData.graduation_year || ''}
                      onChange={handleSignupChange}
                      placeholder="Year of graduation e.g. 2027"
                      onKeyDown={e => { if (!/[0-9]|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }}
                      className={`${inputCls} focus:border-violet-500/50 focus:ring-violet-500/20`}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input name="password" type={showPwd ? 'text' : 'password'} required
                        value={signupData.password} onChange={handleSignupChange}
                        placeholder="At least 6 characters"
                        className={`${inputCls} pr-10 focus:border-violet-500/50 focus:ring-violet-500/20`}
                        style={inputStyle} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm password</label>
                    <div className="relative">
                      <input name="confirmPassword" type={showConfirmPwd ? 'text' : 'password'} required
                        value={signupData.confirmPassword} onChange={handleSignupChange} placeholder="••••••••"
                        className={`${inputCls} pr-10 focus:border-violet-500/50 focus:ring-violet-500/20`}
                        style={inputStyle} />
                      <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showConfirmPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button type="submit"
                    disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-1"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            By continuing you agree to our{' '}
            <a href="/terms" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}
