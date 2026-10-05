'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import { AttendanceMeter } from '@/components/subscription/AttendanceMeter'
import { normalizeUserTier, tierName } from '@/lib/tier'
import { isAdminEmail } from '@/lib/admin'
import { homePathForRole } from '@/lib/landing'

/**
 * The bar.
 *
 * It used to be nine links of equal weight in one row — five for the student,
 * four for the admin — separated by a hairline, with the current page marked by
 * a 2px underline that read as an afterthought. At 1440 it was a crowd, and the
 * admin links looked like main navigation rather than a second set of keys.
 *
 * Now the current section is marked the way the calendar marks today: a 2px
 * signal rule along the top edge of the bar, flush to it, so the mark belongs
 * to the bar rather than floating under a word. The admin set sits behind its
 * own mono `admin` label and is drawn quieter, so it reads as what it is.
 *
 * The height stays 16 (64px). Several screens pin sticky columns to `top-24`
 * and the toaster clears the header at 80px; growing the bar would have pushed
 * both out of line.
 */

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

// A college signs in to monitor its own students; the student surfaces are
// not theirs and would only confuse the screen.
const collegeLinks = [
  { href: '/college', label: 'Overview' },
  { href: '/college/students', label: 'Students' },
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

  const isAdmin = Boolean(user && isAdminEmail(user.email))
  // The role on the profile, which is what the database enforces. A college
  // account is not an administrator and must not see the admin set.
  const role = (profile as { role?: string } | null)?.role ?? 'student'
  const isCollege = role === 'college'
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

  // A route change should never leave a panel open over the new page.
  useEffect(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setMenuOpen(false)
    setMobileOpen(false)
    router.push('/auth')
    await signOut()
  }

  /** Marks the current section along the top edge, as the calendar marks today. */
  const navItem = (href: string, label: string, quiet = false) => {
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex h-16 items-center font-sans text-ui-s ${
          active
            ? 'text-type-primary'
            : quiet
              ? 'text-type-muted hover:text-type-primary'
              : 'text-type-secondary hover:text-type-primary'
        }`}
      >
        {active ? (
          <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-signal" />
        ) : null}
        {label}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ink">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 lg:px-12">
        <Link href={user ? homePathForRole(role) : '/'} className="flex shrink-0 items-center">
          <Hatch className="text-[22px] leading-none text-type-primary" />
        </Link>

        {/* Laptop navigation */}
        {user ? (
          <nav className="hidden min-w-0 flex-1 items-center gap-6 lg:flex" aria-label="Main">
            <span aria-hidden className="h-6 w-px shrink-0 bg-rule" />

            {isCollege
              ? collegeLinks.map(({ href, label }) => navItem(href, label))
              : navLinks.map(({ href, label }) => navItem(href, label))}

            {isAdmin ? (
              <span className="flex items-center gap-4">
                <span aria-hidden className="h-6 w-px shrink-0 bg-rule" />
                <span data-mono className="shrink-0 text-mono text-type-muted">
                  admin
                </span>
                {adminLinks.map(({ href, label }) => navItem(href, label, true))}
                {navItem('/college', 'College', true)}
              </span>
            ) : null}
          </nav>
        ) : (
          <span className="hidden flex-1 lg:block" />
        )}

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              {/* A college account has no monthly event cap of its own. */}
              {isCollege ? null : (
                <AttendanceMeter
                  tier={tier}
                  used={profile?.events_attended_this_month ?? 0}
                  variant="compact"
                  className="hidden md:flex"
                />
              )}

              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex min-h-touch items-center gap-2 border border-rule px-3 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal"
                >
                  <Glyph name="user" size={16} />
                  <span>{profile?.username ?? 'Account'}</span>
                  <Glyph name="chevron" size={16} />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-64 border border-rule-strong bg-ink"
                  >
                    {/* Who you are and what you are on, before the links. */}
                    <div className="border-b border-rule px-4 py-3">
                      <p className="font-sans text-label uppercase text-type-muted">Signed in as</p>
                      <p data-mono className="mt-1 truncate text-mono text-type-primary">
                        @{profile?.username ?? 'account'}
                      </p>
                      <p className="mt-2 flex items-baseline justify-between gap-3">
                        <span className="font-sans text-label uppercase text-type-muted">Plan</span>
                        <span className="font-sans text-ui-s text-type-primary">{tierName(tier)}</span>
                      </p>
                    </div>

                    {accountLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        className="flex min-h-touch items-center justify-between border-b border-rule px-4 py-3 font-sans text-ui-s text-type-secondary hover:text-signal"
                      >
                        {label}
                        <Glyph name="arrow-right" size={14} />
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
            className="flex h-touch w-touch items-center justify-center border border-rule text-type-primary hover:border-signal hover:text-signal lg:hidden"
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
            {(user
              ? navLinks
              : [
                  { href: '/', label: 'Home' },
                  { href: '/events', label: 'Events' },
                  { href: '/pricing', label: 'Pricing' },
                ]
            ).map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className={`flex min-h-touch items-center gap-4 border-b border-rule px-4 py-4 font-display text-title uppercase ${
                  pathname === href ? 'text-signal' : 'text-type-primary'
                }`}
              >
                <span data-mono className="text-mono text-type-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {label}
              </Link>
            ))}

            {isAdmin ? (
              <>
                <p
                  data-mono
                  className="border-b border-rule bg-ink-sunken px-4 py-2 text-mono text-type-muted"
                >
                  admin
                </p>
                {adminLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={pathname === href ? 'page' : undefined}
                    className={`flex min-h-touch items-center border-b border-rule px-4 py-4 font-sans text-ui ${
                      pathname === href ? 'text-signal' : 'text-type-secondary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </>
            ) : null}

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
                className="flex min-h-touch w-full items-center justify-center border border-signal px-4 py-3 font-sans text-ui text-signal hover:bg-signal hover:text-ink"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui text-ink"
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
