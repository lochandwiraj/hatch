'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { 
  CalendarDaysIcon, 
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getWeeklyEventLimit } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ReferralCard from '@/components/referral/ReferralCard'

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
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-neutral-600">Setting up your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // If still no profile after loading, show error state
  if (!loading && user && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto text-center mt-20">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Setting up your account...
          </h2>
          <p className="text-neutral-600 mb-6">
            We're creating your profile. This should only take a moment.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-primary-600 font-medium">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@hatch.in' || 
                user?.email === 'lochan@hatch.in') && (
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
              <Link href="/events" className="text-neutral-600 hover:text-primary-600">
                Events
              </Link>
              <Link href="/subscription" className="text-neutral-600 hover:text-primary-600">
                Subscription
              </Link>
              <Link href="/profile" className="text-neutral-600 hover:text-primary-600">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-primary rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-neutral-200 text-lg">
                  You get {getWeeklyEventLimit(profile?.subscription_tier || 'free')} curated events this week
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor} mr-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Browse Events - Centered */}
          <div className="max-w-md mx-auto">
            <div className="card">
              <div className="flex items-center mb-4">
                <CalendarDaysIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-xl font-semibold">Discover Events</h3>
              </div>
              <p className="text-neutral-600 mb-4">
                Browse and register for events happening in your community
              </p>
              <Link href="/events">
                <Button className="w-full">Browse Events</Button>
              </Link>
            </div>
          </div>

          {/* Subscription Status */}
          {profile?.subscription_tier === 'free' && (
            <div className="bg-gradient-secondary rounded-xl p-6 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-primary-800 mb-2">
                    Upgrade Your Experience
                  </h3>
                  <p className="text-primary-600">
                    Get access to 10 curated events/week and premium features
                  </p>
                </div>
                <Link href="/subscription/upgrade">
                  <Button>Upgrade Now</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Referral Card */}
          <ReferralCard />

          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Recent Activity</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">No events attended yet</p>
                <p className="text-sm text-neutral-400">Start by browsing available events</p>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Complete Your Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Basic Information</span>
                <span className="text-success-600 font-medium">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Bio & Skills</span>
                {profile?.bio && profile?.skills ? (
                  <span className="text-success-600 font-medium">✓ Complete</span>
                ) : (
                  <Link href="/profile" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Add Details
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}