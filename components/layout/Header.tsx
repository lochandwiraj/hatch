'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import { AttendanceMeter } from '@/components/subscription/AttendanceMeter'
import { normalizeUserTier, tierName } from '@/lib/tier'

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

const accountLinks = [
  { href: '/profile', label: 'Profile' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = Boolean(user && ADMIN_EMAILS.includes(user.email ?? ''))
  const tier = normalizeUserTier(profile?.subscription_tier)

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // The full-screen panel owns the viewport while it is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    setMobileOpen(false)
    router.push('/auth')
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ink">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-12">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center">
          <Hatch className="text-[22px] leading-none text-type-primary" />
        </Link>

        {/* Laptop navigation */}
        {user ? (
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`border-b-2 py-1 font-sans text-ui-s ${
 active
 ? 'border-signal text-type-primary'
 : 'border-transparent text-type-secondary hover:text-type-primary'
 }`}
                >
                  {label}
                </Link>
              )
            })}

            {isAdmin ? (
              <span className="flex items-center gap-6 border-l border-rule pl-6">
                {adminLinks.map(({ href, label }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`border-b-2 py-1 font-sans text-ui-s ${
 active
 ? 'border-signal text-type-primary'
 : 'border-transparent text-type-muted hover:text-type-primary'
 }`}
                    >
                      {label}
                    </Link>
                  )
                })}
              </span>
            ) : null}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <AttendanceMeter
                tier={tier}
                used={profile?.events_attended_this_month ?? 0}
                variant="compact"
                className="hidden md:flex"
              />

              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex min-h-touch items-center gap-2 border border-rule px-3 py-2 font-sans text-ui-s text-type-primary hover:border-rule-strong"
                >
                  <Glyph name="user" size={16} />
                  <span>{profile?.username ?? 'Account'}</span>
                  <Glyph name="chevron" size={16} />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-64 border border-rule bg-ink-raised"
                  >
                    <p className="border-b border-rule px-4 py-3">
                      <span className="font-sans text-label uppercase text-type-muted">Tier</span>
                      <br />
                      <span className="font-sans text-ui-s text-type-primary">{tierName(tier)}</span>
                    </p>
                    {accountLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        className="flex min-h-touch items-center border-b border-rule px-4 py-3 font-sans text-ui-s text-type-secondary hover:text-signal"
                      >
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex min-h-touch w-full items-center px-4 py-3 text-left font-sans text-ui-s text-signal hover:bg-signal hover:text-ink"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/auth"
                className="flex min-h-touch items-center px-3 font-sans text-ui-s text-type-secondary hover:text-type-primary"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="flex min-h-touch items-center border border-signal bg-signal px-4 font-sans text-ui-s text-ink hover:bg-ink hover:text-signal"
              >
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex h-touch w-touch items-center justify-center border border-rule text-type-primary lg:hidden"
          >
            <Glyph name={mobileOpen ? 'cross' : 'filter'} size={20} />
          </button>
        </div>
      </div>

      {/* Phone: a full-screen panel, not a dropdown. */}
      {mobileOpen ? (
        <div className="fixed inset-0 top-16 z-50 overflow-y-auto border-t border-rule bg-ink lg:hidden">
          {user ? (
            <div className="border-b border-rule px-4 py-6">
              <AttendanceMeter
                tier={tier}
                used={profile?.events_attended_this_month ?? 0}
                variant="full"
              />
            </div>
          ) : null}

          <nav aria-label="Mobile">
            {(user ? navLinks : [{ href: '/', label: 'Home' }, { href: '/events', label: 'Events' }, { href: '/pricing', label: 'Pricing' }]).map(
              ({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  className={`flex min-h-touch items-center justify-between border-b border-rule px-4 py-4 font-display text-title uppercase ${
 pathname === href ? 'text-signal' : 'text-type-primary'
 }`}
                >
                  {label}
                  <span data-mono className="text-mono text-type-muted">
                    {href}
                  </span>
                </Link>
              )
            )}

            {isAdmin
              ? adminLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex min-h-touch items-center justify-between border-b border-rule px-4 py-4 font-sans text-ui text-type-muted"
                  >
                    {label}
                    <span data-mono className="text-mono">
                      admin
                    </span>
                  </Link>
                ))
              : null}

            {accountLinks.slice(1).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-touch items-center border-b border-rule px-4 py-3 font-sans text-ui-s text-type-secondary"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="px-4 py-6">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-touch w-full items-center justify-center border border-signal px-4 py-3 font-sans text-ui text-signal active:bg-signal active:text-ink"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui text-ink active:bg-ink active:text-signal"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
