'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  CalendarDaysIcon,
  TrophyIcon,
  PencilIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, formatDateShort } from '@/lib/utils'
import Link from 'next/link'

export default function ProfilePage() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded-xl"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
            <p className="text-neutral-600 mt-1">
              Manage your personal information and preferences
            </p>
          </div>
          <Link href="/profile/edit">
            <Button className="mt-4 sm:mt-0">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-4 sm:mb-0 sm:mr-6">
              <span className="text-3xl font-bold text-white">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">{profile.full_name}</h2>
                  <p className="text-neutral-600">@{profile.username}</p>
                  <p className="text-neutral-500">{profile.email}</p>
                </div>
                
                <div className="mt-4 sm:mt-0">
                  <Badge 
                    variant={profile.subscription_tier === 'free' ? 'default' : 'primary'}
                    size="lg"
                  >
                    <StarIcon className="h-4 w-4 mr-1" />
                    {getSubscriptionTierName(profile.subscription_tier)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <TrophyIcon className="h-12 w-12 text-success-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {profile.events_attended}
            </div>
            <p className="text-neutral-600">Events Attended</p>
          </Card>
          
          <Card className="text-center">
            <CalendarDaysIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {new Date().getFullYear() - new Date(profile.created_at).getFullYear() || 'New'}
            </div>
            <p className="text-neutral-600">Years on Hatch</p>
          </Card>
          
          <Card className="text-center">
            <AcademicCapIcon className="h-12 w-12 text-accent-600 mx-auto mb-4" />
            <div className="text-3xl font-bold text-neutral-900 mb-2">
              {profile.graduation_year}
            </div>
            <p className="text-neutral-600">Graduation Year</p>
          </Card>
        </div>

        {/* Personal Information */}
        <Card>
          <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <p className="text-neutral-900">{profile.full_name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Username
              </label>
              <p className="text-neutral-900">@{profile.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <p className="text-neutral-900">{profile.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                College/Organization
              </label>
              <p className="text-neutral-900">{profile.college}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Graduation Year
              </label>
              <p className="text-neutral-900">{profile.graduation_year}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Member Since
              </label>
              <p className="text-neutral-900">{formatDateShort(profile.created_at)}</p>
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Bio</h3>
          {profile.bio ? (
            <p className="text-neutral-700 leading-relaxed">{profile.bio}</p>
          ) : (
            <div className="text-center py-8">
              <UserCircleIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No bio added yet</p>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  Add Bio
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Skills */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Skills</h3>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No skills added yet</p>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  Add Skills
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Account Actions */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Account Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/profile/edit">
              <Button variant="outline">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                Account Settings
              </Button>
            </Link>
            {profile.subscription_tier === 'free' && (
              <Link href="/subscription/upgrade">
                <Button>
                  <StarIcon className="h-4 w-4 mr-2" />
                  Upgrade Subscription
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}