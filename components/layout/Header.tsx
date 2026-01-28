'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName } from '@/lib/utils'

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    // Navigate immediately for faster UX
    router.push('/auth')
    // Then perform signout (this will be fast due to AuthProvider optimization)
    await signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold gradient-text">HATCH</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@HATCH.in' || 
                user?.email === 'lochan@HATCH.in') && (
                <>
                  <Link href="/admin/events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    📅 Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    🔧 Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    👥 Users
                  </Link>
                  <Link href="/admin/payments" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    💳 Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Events
              </Link>
              <Link href="/subscription" className="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Subscription
              </Link>
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 p-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-neutral-900">{profile.full_name}</p>
                      <p className="text-xs text-neutral-500">{getSubscriptionTierName(profile.subscription_tier)}</p>
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-neutral-200">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && user && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-neutral-200">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@HATCH.in' || 
                user?.email === 'lochan@HATCH.in') && (
                <>
                  <Link
                    href="/admin/events"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 border border-primary-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📅 Admin Events
                  </Link>
                  <Link
                    href="/admin/manage-events"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 border border-primary-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔧 Manage Events
                  </Link>
                  <Link
                    href="/admin/manage-users"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 border border-primary-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👥 Manage Users
                  </Link>
                  <Link
                    href="/admin/payments"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 border border-primary-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    💳 Admin Payments
                  </Link>
                </>
              )}
              <Link
                href="/events"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/subscription"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Subscription
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}