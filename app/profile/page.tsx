'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { 
  UserIcon,
  AcademicCapIcon,
  StarIcon,
  PencilIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimit } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AttendanceStats {
  total_registered: number
  total_attended: number
  attendance_rate: number
}

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const router = useRouter()

  // Load attendance statistics
  useEffect(() => {
    if (profile && user) {
      loadAttendanceStats()
    }
  }, [profile, user])

  const loadAttendanceStats = async () => {
    if (!user) return
    
    try {
      setLoadingStats(true)
      const { data, error } = await supabase
        .rpc('get_user_attendance_stats', { user_uuid: user.id })

      if (error) throw error
      
      if (data && data.length > 0) {
        setAttendanceStats(data[0])
      } else {
        setAttendanceStats({ total_registered: 0, total_attended: 0, attendance_rate: 0 })
      }
    } catch (error: any) {
      console.error('Error loading attendance stats:', error)
      setAttendanceStats({ total_registered: 0, total_attended: 0, attendance_rate: 0 })
    } finally {
      setLoadingStats(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleChangePassword = () => {
    router.push('/auth/forgot-password')
  }

  const handleEditBio = () => {
    setBioText(profile?.bio || '')
    setSkillsText(profile?.skills?.join(', ') || '')
    setEditingBio(true)
  }

  const handleSaveBio = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const skillsArray = skillsText
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          bio: bioText.trim() || null,
          skills: skillsArray.length > 0 ? skillsArray : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Bio & Skills updated successfully!')
      setEditingBio(false)
      refreshProfile()
    } catch (error: any) {
      toast.error('Failed to update bio & skills: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingBio(false)
    setBioText('')
    setSkillsText('')
  }

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
              <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600">
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
              <Link href="/profile" className="text-primary-600 font-medium">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-gradient-primary h-32"></div>
            <div className="relative px-6 pb-6">
              <div className="flex items-end -mt-16 mb-4">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-primary-600">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-6 pb-2">
                  <h1 className="text-2xl font-bold text-neutral-900">{profile.full_name}</h1>
                  <p className="text-neutral-600">@{profile.username}</p>
                  <div className="flex items-center mt-2">
                    <StarIcon className="h-4 w-4 text-primary-600 mr-1" />
                    <span className="text-sm font-medium text-primary-600">
                      {getSubscriptionTierName(profile.subscription_tier)} Member
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {loadingStats ? '...' : attendanceStats?.total_attended || 0}
                    </div>
                    <div className="text-sm text-neutral-600">Events Attended</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {loadingStats ? '...' : attendanceStats?.total_registered || 0}
                    </div>
                    <div className="text-sm text-neutral-600">Events Registered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">{getEventLimit(profile.subscription_tier) === -1 ? '∞' : getEventLimit(profile.subscription_tier)}</div>
                    <div className="text-sm text-neutral-600">Event Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {loadingStats ? '...' : `${attendanceStats?.attendance_rate || 0}%`}
                    </div>
                    <div className="text-sm text-neutral-600">Attendance Rate</div>
                  </div>
                </div>
                
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-neutral-900">Personal Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <p className="text-neutral-900">{profile.full_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <p className="text-neutral-900">{user?.email || 'Not available'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Username
                  </label>
                  <p className="text-neutral-900">@{profile.username}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-neutral-900">Academic Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    College/Organization
                  </label>
                  <p className="text-neutral-900">{profile.college}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Graduation Year
                  </label>
                  <p className="text-neutral-900">{profile.graduation_year}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-neutral-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center mb-4">
              <TrophyIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900">Attendance History</h2>
            </div>
            
            {loadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-neutral-200 rounded-lg"></div>
                ))}
              </div>
            ) : attendanceStats && attendanceStats.total_attended > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-success-700">
                      {attendanceStats.total_attended}
                    </div>
                    <div className="text-sm text-success-600">Events Completed</div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary-700">
                      {attendanceStats.total_registered}
                    </div>
                    <div className="text-sm text-primary-600">Total Registered</div>
                  </div>
                  <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent-700">
                      {attendanceStats.attendance_rate}%
                    </div>
                    <div className="text-sm text-accent-600">Success Rate</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link href="/calendar">
                    <Button variant="secondary">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      View Calendar
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">
                  No events attended yet. Start by registering for events!
                </p>
                <Link href="/events">
                  <Button>
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Browse Events
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Bio and Skills */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Bio & Skills</h2>
              {!editingBio && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditBio}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            
            {editingBio ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Tell us about yourself... (e.g., your interests, goals, what you're passionate about)"
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g., React, Python, UI/UX Design, Machine Learning, Public Speaking"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Add any skills, technologies, or areas of expertise you have
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveBio}
                    loading={saving}
                    disabled={saving}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {profile.bio || profile.skills ? (
                  <div className="space-y-4">
                    {profile.bio && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Bio
                        </label>
                        <p className="text-neutral-900 whitespace-pre-wrap">{profile.bio}</p>
                      </div>
                    )}
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-4">
                      Add your bio and skills to help others connect with you
                    </p>
                    <Button variant="secondary" onClick={handleEditBio}>
                      Add Bio & Skills
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subscription Status */}
          <div className="bg-gradient-secondary rounded-xl p-6 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-primary-800 mb-2">
                  Subscription Status
                </h3>
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-success-600 mr-2" />
                  <span className="text-primary-700">
                    {getSubscriptionTierName(profile.subscription_tier)} Plan Active
                  </span>
                </div>
                <p className="text-primary-600 text-sm">
                  Access to {getEventLimit(profile.subscription_tier) === -1 ? 'all hackathons & events' : `${getEventLimit(profile.subscription_tier)} curated events`}
                </p>
              </div>
              
              {profile.subscription_tier === 'free' && (
                <Link href="/subscription/upgrade">
                  <Button>Upgrade Plan</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Account Actions</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-200">
                <div>
                  <h3 className="font-medium text-neutral-900">Change Password</h3>
                  <p className="text-sm text-neutral-600">Update your account password</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-neutral-200">
                <div>
                  <h3 className="font-medium text-neutral-900">Download Data</h3>
                  <p className="text-sm text-neutral-600">Export your account data</p>
                </div>
                <Button variant="secondary" size="sm">
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-red-600">Sign Out</h3>
                  <p className="text-sm text-neutral-600">Sign out of your account</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}