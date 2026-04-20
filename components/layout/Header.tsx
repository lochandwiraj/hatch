'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'motion/react'
import { getSubscriptionTierName } from '@/lib/utils'

const ADMIN_EMAILS = [
  'dwiraj06@gmail.com',
  'pokkalilochan@gmail.com',
  'dwiraj@hatch.in',
  'lochan@hatch.in',
]

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/events', label: 'Events' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/subscription', label: 'Subscription' },
  { href: '/profile', label: 'Profile' },
]

const adminLinks = [
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/manage-events', label: 'Manage' },
  { href: '/admin/manage-users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
]

const tierConfig = {
  free: { color: 'text-zinc-400', dot: 'bg-zinc-500' },
  basic_99: { color: 'text-sky-400', dot: 'bg-sky-400' },
  premium_149: { color: 'text-emerald-400', dot: 'bg-emerald-400' },
}

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? '')
  const tier = (profile?.subscription_tier ?? 'free') as keyof typeof tierConfig
  const { color: tierColor, dot: tierDot } = tierConfig[tier] ?? tierConfig.free

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    router.push('/auth')
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Glass bar */}
      <div
        style={{
          background: 'rgba(5,5,8,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link
              href={user ? '/dashboard' : '/'}
              className="font-qepho text-white text-xl hover:opacity-80 transition-opacity"
            >
              HATCH
            </Link>

            {/* Desktop nav */}
            {user && (
              <nav className="hidden md:flex items-center gap-0.5">
                {navLinks.map(({ href, label }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        active
                          ? 'text-white bg-white/[0.08]'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {label}
                    </Link>
                  )
                })}
                {isAdmin && (
                  <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-white/[0.07]">
                    {adminLinks.map(({ href, label }) => {
                      const active = pathname === href
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            active
                              ? 'text-violet-300 bg-violet-500/10'
                              : 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/10'
                          }`}
                        >
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user && profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all duration-200"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                    >
                      <span className="text-white text-xs font-semibold">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm text-white leading-none font-medium">
                        {profile.full_name.split(' ')[0]}
                      </p>
                      <div className={`flex items-center gap-1 mt-0.5 ${tierColor}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${tierDot}`} />
                        <p className="text-xs leading-none">
                          {getSubscriptionTierName(profile.subscription_tier)}
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={`hidden md:block w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute right-0 mt-2 w-48 rounded-xl py-1 overflow-hidden"
                        style={{
                          background: 'rgba(13,13,20,0.98)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          Profile
                        </Link>
                        <div className="my-1 border-t border-white/[0.07]" />
                        <p className="px-3 py-1 text-xs text-zinc-600 uppercase tracking-widest">Info</p>
                        {[
                          { href: '/about', label: 'About', Icon: InformationCircleIcon },
                          { href: '/contact', label: 'Contact', Icon: EnvelopeIcon },
                          { href: '/terms', label: 'Terms', Icon: DocumentTextIcon },
                          { href: '/privacy', label: 'Privacy', Icon: ShieldCheckIcon },
                        ].map(({ href, label, Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </Link>
                        ))}
                        <div className="my-1 border-t border-white/[0.07]" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/auth" className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                    Sign in
                  </Link>
                  <Link
                    href="/auth"
                    className="px-3.5 py-1.5 text-sm text-white rounded-lg transition-all duration-200 font-medium"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                  >
                    Get started
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="md:hidden overflow-hidden"
            style={{
              background: 'rgba(5,5,8,0.97)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="px-4 py-3 space-y-0.5">
              {user ? (
                <>
                  {navLinks.map(({ href, label }, i) => (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === href
                            ? 'text-white bg-white/[0.08]'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  ))}
                  {isAdmin && (
                    <>
                      <div className="pt-2 pb-1">
                        <p className="px-3 text-xs text-zinc-600 uppercase tracking-wider font-medium">Admin</p>
                      </div>
                      {adminLinks.map(({ href, label }, i) => (
                        <motion.div
                          key={href}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navLinks.length + i) * 0.05, duration: 0.2 }}
                        >
                          <Link
                            href={href}
                            className="block px-3 py-2 rounded-lg text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                          >
                            {label}
                          </Link>
                        </motion.div>
                      ))}
                    </>
                  )}
                  <div className="pt-2 border-t border-white/[0.07] mt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 py-2">
                  <Link href="/auth" className="px-3 py-2 text-sm text-zinc-400">Sign in</Link>
                  <Link
                    href="/auth"
                    className="px-3 py-2 text-sm text-white rounded-lg text-center font-medium"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
