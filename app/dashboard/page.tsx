'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { 
  CalendarDaysIcon, 
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimit, getEventLimitDescription } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ReferralCard from '@/components/referral/ReferralCard'
import RollerLoader from '@/components/ui/RollerLoader'

export default function DashboardPage() {
  const { profile, user, refreshProfile, loading } = useAuth()

  // Auto-refresh profile every 15 seconds to catch admin tier changes
  useEffect(() => {
    if (profile) {
      const interval = setInterval(() => {
        refreshProfile()
      }, 15000) // 15 seconds

      return () => clearInterval(interval)
    }
  }, [profile, refreshProfile])

  // Refresh on window focus to catch changes when switching tabs
  useEffect(() => {
    const handleFocus = () => {
      if (profile) {
        refreshProfile()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [profile, refreshProfile])

  // Show loading state while auth is loading or profile is being created
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center funky-events-background">
        <RollerLoader />
      </div>
    )
  }

  // If still no profile after loading, show error state
  if (!loading && user && !profile) {
    return (
      <div className="min-h-screen p-6 funky-events-background">
        <div className="max-w-7xl mx-auto text-center mt-20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Setting up your account...
          </h2>
          <p className="text-gray-400 mb-6">
            We're creating your profile. This should only take a moment.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="white-btn"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Subscription Tier',
      value: getSubscriptionTierName(profile?.subscription_tier || 'free'),
      icon: StarIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    }
  ]

  return (
    <div className="min-h-screen funky-events-background">
      {/* Header */}
      <header className="shadow-sm border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-cyan-400 font-medium">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@hatch.in' || 
                user?.email === 'lochan@hatch.in') && (
                <>
                  <Link href="/admin/events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Users
                  </Link>
                  <Link href="/admin/payments" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-gray-300 hover:text-cyan-400">
                Events
              </Link>
              <Link href="/calendar" className="text-gray-300 hover:text-cyan-400">
                Calendar
              </Link>
              <Link href="/subscription" className="text-gray-300 hover:text-cyan-400">
                Subscription
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-cyan-400">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="funky-welcome-card">
            <div className="funky-welcome-card-pattern"></div>
            <div className="funky-welcome-text">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-lg font-medium opacity-80">
                You have access to {getEventLimitDescription(profile?.subscription_tier || 'free')}
              </p>
            </div>
            <div className="funky-welcome-avatar">
              <span className="text-4xl font-bold text-white">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="w-full flex justify-center">
            {stats.map((stat, index) => (
              <div key={index} className="funky-tier-card">
                <div className="funky-tier-card-header">
                  Subscription Tier
                </div>
                <div className="funky-tier-card-body">
                  <div className="funky-tier-icon">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="funky-tier-text">
                    <div className="funky-tier-value">{stat.value}</div>
                    <div className="funky-tier-label">Current Plan</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Browse Events - Centered */}
          <div className="funky-browse-card">
            <div className="funky-browse-card-header">
              Discover Events
            </div>
            <div className="funky-browse-card-body">
              <p className="text-gray-700 mb-4 font-medium">
                Browse and register for events happening in your community
              </p>
              <Link href="/events">
                <button className="funky-dashboard-button">
                  Browse Events
                </button>
              </Link>
            </div>
          </div>

          {/* Subscription Status */}
          {profile?.subscription_tier === 'free' && (
            <div className="funky-upgrade-card">
              <div className="funky-upgrade-card-body">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Upgrade Your Experience
                  </h3>
                  <p className="text-gray-600 font-medium">
                    Get access to more events and premium features
                  </p>
                </div>
                <Link href="/subscription/upgrade">
                  <button className="funky-dashboard-button" style={{ width: 'auto', minWidth: '120px' }}>
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Referral Card */}
          <ReferralCard />

          {/* Recent Activity */}
          <div className="funky-activity-card">
            <div className="funky-activity-card-header">
              Recent Activity
            </div>
            <div className="funky-activity-card-body">
              <div className="text-center py-8">
                <p className="text-gray-700 font-semibold mb-2">No events attended yet</p>
                <p className="text-sm text-gray-600 font-medium">Start by browsing available events</p>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="funky-profile-card">
            <div className="funky-profile-card-header">
              Complete Your Profile
            </div>
            <div className="funky-profile-card-body">
              <div className="space-y-3">
                <div className="profile-completion-item">
                  <span className="text-gray-700 font-semibold">Basic Information</span>
                  <span className="text-green-600 font-bold">✓ Complete</span>
                </div>
                <div className="profile-completion-item">
                  <span className="text-gray-700 font-semibold">Bio & Skills</span>
                  {profile?.bio && profile?.skills ? (
                    <span className="text-green-600 font-bold">✓ Complete</span>
                  ) : (
                    <Link href="/profile" className="text-purple-600 hover:text-purple-800 text-sm font-bold underline">
                      Add Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}