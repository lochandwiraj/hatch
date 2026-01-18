'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getSubscriptionTierPrice, getWeeklyEventLimit } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ReferralCard from '@/components/referral/ReferralCard'

export default function DashboardPage() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <MainLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  const stats = [
    {
      name: 'Events Attended',
      value: profile.events_attended,
      icon: TrophyIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100'
    },
    {
      name: 'Subscription Tier',
      value: getSubscriptionTierName(profile.subscription_tier),
      icon: StarIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    },
    {
      name: 'Member Since',
      value: new Date(profile.created_at).getFullYear(),
      icon: ClockIcon,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100'
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {profile.full_name.split(' ')[0]}! 👋
              </h1>
              <p className="text-neutral-200 text-lg">
                You get {getWeeklyEventLimit(profile.subscription_tier)} curated events this week
              </p>
              <p className="text-neutral-300 text-sm mt-1">
                {profile.subscription_tier === 'free' 
                  ? 'Upgrade to Explorer for 10 events/week' 
                  : profile.subscription_tier === 'explorer_99'
                    ? 'Upgrade to Professional for 15 events/week + early access'
                    : 'You have access to all premium features!'
                }
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browse Events */}
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

          {/* Attendance */}
          <div className="card">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-8 w-8 text-accent-600 mr-3" />
              <h3 className="text-xl font-semibold">Track Attendance</h3>
            </div>
            <p className="text-neutral-600 mb-4">
              View your attendance history and confirm event participation
            </p>
            <Link href="/attendance">
              <Button variant="secondary" className="w-full">View Attendance</Button>
            </Link>
          </div>
        </div>

        {/* Subscription Status */}
        {profile.subscription_tier === 'free' && (
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
            <Link href="/attendance/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {profile.events_attended === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">No events attended yet</p>
                <p className="text-sm text-neutral-400">Start by browsing available events</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-success-500 mx-auto mb-4" />
                <p className="text-neutral-700 font-medium">
                  You've attended {profile.events_attended} event{profile.events_attended !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-neutral-500">Keep up the great engagement</p>
              </div>
            )}
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
              {profile.bio && profile.skills ? (
                <span className="text-success-600 font-medium">✓ Complete</span>
              ) : (
                <Link href="/profile/edit" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Add Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}