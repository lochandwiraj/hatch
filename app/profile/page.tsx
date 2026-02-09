'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  UserIcon,
  AcademicCapIcon,
  StarIcon,
  PencilIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimit } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { generateAttendanceReport } from '@/lib/pdfGenerator'
import RollerLoader from '@/components/ui/RollerLoader'

interface AttendanceStats {
  total_registered: number
  total_attended: number
  attendance_rate: number
}

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    college: '',
    graduation_year: new Date().getFullYear(),
    bio: '',
    skills: ''
  })
  const router = useRouter()

  // Load attendance statistics
  useEffect(() => {
    if (profile && user) {
      loadAttendanceStats()
      // Initialize edit form data when profile loads
      setEditFormData({
        full_name: profile.full_name || '',
        college: profile.college || '',
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || ''
      })
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
      <div className="min-h-screen flex items-center justify-center funky-events-background">
        <RollerLoader />
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
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

  const handleOpenEditModal = () => {
    if (profile) {
      setEditFormData({
        full_name: profile.full_name || '',
        college: profile.college || '',
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || ''
      })
      setShowEditModal(true)
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    // Reset form data to original values
    if (profile) {
      setEditFormData({
        full_name: profile.full_name || '',
        college: profile.college || '',
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || ''
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const skillsArray = editFormData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editFormData.full_name.trim(),
          college: editFormData.college.trim() || null,
          graduation_year: editFormData.graduation_year,
          bio: editFormData.bio.trim() || null,
          skills: skillsArray.length > 0 ? skillsArray : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      setShowEditModal(false)
      refreshProfile()
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadData = async () => {
    if (!user || !profile) {
      toast.error('Please log in to download your data')
      return
    }

    setDownloadingPDF(true)
    try {
      toast.loading('Generating your attendance report...', { id: 'pdf-generation' })

      // Get all attended events for the user with tier information
      const { data: attendedEvents, error } = await supabase
        .from('user_attendance_with_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true })

      if (error) throw error

      // Get current attendance stats
      const currentStats = attendanceStats || { total_registered: 0, total_attended: 0, attendance_rate: 0 }

      // Generate PDF
      generateAttendanceReport(
        {
          full_name: profile.full_name,
          username: profile.username,
          email: user.email || 'Not available',
          college: profile.college || 'Not specified',
          graduation_year: profile.graduation_year?.toString() || 'Not specified',
          subscription_tier: profile.subscription_tier,
          created_at: profile.created_at
        },
        attendedEvents || [],
        currentStats
      )

      toast.success('📄 Your attendance report has been downloaded!', { id: 'pdf-generation' })
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate attendance report', { id: 'pdf-generation' })
    } finally {
      setDownloadingPDF(false)
    }
  }

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
              <Link href="/dashboard" className="text-gray-300 hover:text-cyan-400">
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
                  <Link href="/admin/payments" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-gray-300 hover:text-cyan-400">
                Events
              </Link>
              <Link href="/subscription" className="text-gray-300 hover:text-cyan-400">
                Subscription
              </Link>
              <Link href="/profile" className="text-cyan-400 font-medium">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="funky-profile-header-card">
            <div className="funky-profile-gradient-header"></div>
            <div className="relative px-6 pb-6">
              <div className="flex items-end -mt-16 mb-8">
                <div className="funky-profile-avatar">
                  <span className="text-4xl font-bold text-gray-800">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-6 pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                  <p className="text-gray-600 font-medium">@{profile.username}</p>
                  <div className="flex items-center mt-2">
                    <StarIcon className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm font-bold text-purple-600">
                      {getSubscriptionTierName(profile.subscription_tier)} Member
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 3-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column - Stats */}
                <div className="funky-stats-grid">
                  <div className="funky-stat-item">
                    <div className="funky-stat-number">
                      {loadingStats ? '...' : attendanceStats?.total_attended || 0}
                    </div>
                    <div className="funky-stat-label">Events Attended</div>
                  </div>
                  <div className="funky-stat-item">
                    <div className="funky-stat-number">
                      {loadingStats ? '...' : attendanceStats?.total_registered || 0}
                    </div>
                    <div className="funky-stat-label">Events Registered</div>
                  </div>
                  <div className="funky-stat-item">
                    <div className="funky-stat-number">{getEventLimit(profile.subscription_tier) === -1 ? '∞' : getEventLimit(profile.subscription_tier)}</div>
                    <div className="funky-stat-label">Event Access</div>
                  </div>
                  <div className="funky-stat-item">
                    <div className="funky-stat-number">
                      {loadingStats ? '...' : `${attendanceStats?.attendance_rate || 0}%`}
                    </div>
                    <div className="funky-stat-label">Attendance Rate</div>
                  </div>
                </div>

                {/* Middle Column - Personal & Academic Info Combined */}
                <div className="space-y-4">
                  {/* Personal Information */}
                  <div className="funky-info-card-compact">
                    <div className="funky-info-card-header-compact">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Personal Information
                    </div>
                    <div className="funky-info-card-body-compact">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Full Name
                          </label>
                          <p className="text-gray-900 font-medium text-sm">{profile.full_name}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Email
                          </label>
                          <p className="text-gray-900 font-medium text-sm">{user?.email || 'Not available'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Username
                          </label>
                          <p className="text-gray-900 font-medium text-sm">@{profile.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="funky-info-card-compact">
                    <div className="funky-info-card-header-compact">
                      <AcademicCapIcon className="h-5 w-5 mr-2" />
                      Academic Information
                    </div>
                    <div className="funky-info-card-body-compact">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            College/Organization
                          </label>
                          <p className="text-gray-900 font-medium text-sm">{profile.college}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Graduation Year
                          </label>
                          <p className="text-gray-900 font-medium text-sm">{profile.graduation_year}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Member Since
                          </label>
                          <p className="text-gray-900 font-medium text-sm">
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
                </div>

                {/* Right Column - Edit Profile Button */}
                <div className="flex justify-center lg:justify-end" style={{ position: 'relative', zIndex: 100 }}>
                  <button
                    onClick={() => {
                      console.log('Button clicked!')
                      setShowEditModal(true)
                    }}
                    className="funky-profile-button"
                    style={{ cursor: 'pointer', position: 'relative', zIndex: 100 }}
                    type="button"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="funky-profile-activity-card">
            <div className="funky-profile-activity-header">
              <CalendarDaysIcon className="h-6 w-6 mr-2" />
              Recent Activity
            </div>
            <div className="funky-profile-activity-body">
              {loadingStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-gray-300 rounded-lg border-2 border-black"></div>
                  ))}
                </div>
              ) : attendanceStats && attendanceStats.total_attended > 0 ? (
                <div className="space-y-4">
                  <div className="funky-stats-grid">
                    <div className="funky-stat-item" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }}>
                      <div className="funky-stat-number" style={{ color: '#15803d' }}>
                        {attendanceStats.total_attended}
                      </div>
                      <div className="funky-stat-label" style={{ color: '#15803d' }}>Events Completed</div>
                    </div>
                    <div className="funky-stat-item" style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6' }}>
                      <div className="funky-stat-number" style={{ color: '#7c3aed' }}>
                        {attendanceStats.total_registered}
                      </div>
                      <div className="funky-stat-label" style={{ color: '#7c3aed' }}>Total Registered</div>
                    </div>
                    <div className="funky-stat-item" style={{ background: 'rgba(236, 72, 153, 0.1)', borderColor: '#ec4899' }}>
                      <div className="funky-stat-number" style={{ color: '#db2777' }}>
                        {attendanceStats.attendance_rate}%
                      </div>
                      <div className="funky-stat-label" style={{ color: '#db2777' }}>Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Link href="/calendar">
                      <button className="funky-profile-button">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        View Calendar
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-bold mb-4">
                    No events attended yet. Start by registering for events!
                  </p>
                  <Link href="/events">
                    <button className="funky-profile-button">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Browse Events
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bio and Skills */}
          <div className="funky-bio-card">
            <div className="funky-bio-header">
              <h2>Bio & Skills</h2>
              {!editingBio && (
                <button
                  onClick={handleEditBio}
                  className="funky-profile-button"
                  style={{ fontSize: '0.8em', padding: '0.4em 0.8em' }}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            <div className="funky-bio-body">
              {editingBio ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Tell us about yourself... (e.g., your interests, goals, what you're passionate about)"
                      rows={4}
                      className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      placeholder="e.g., React, Python, UI/UX Design, Machine Learning, Public Speaking"
                      className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                    />
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Add any skills, technologies, or areas of expertise you have
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveBio}
                      disabled={saving}
                      className="funky-profile-button"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="funky-profile-button"
                      style={{ background: '#6b7280' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {profile.bio || profile.skills ? (
                    <div className="space-y-4">
                      {profile.bio && (
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-2">
                            Bio
                          </label>
                          <p className="text-gray-900 whitespace-pre-wrap font-medium">{profile.bio}</p>
                        </div>
                      )}
                      
                      {profile.skills && profile.skills.length > 0 && (
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-2">
                            Skills
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-cyan-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full border-2 border-gray-800"
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
                      <p className="text-gray-700 font-bold mb-4">
                        Add your bio and skills to help others connect with you
                      </p>
                      <button onClick={handleEditBio} className="funky-profile-button">
                        Add Bio & Skills
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Subscription Status */}
          <div className="funky-subscription-status-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Subscription Status
                </h3>
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span className="font-bold">
                    {getSubscriptionTierName(profile.subscription_tier)} Plan Active
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  Access to {getEventLimit(profile.subscription_tier) === -1 ? 'all hackathons & events' : `${getEventLimit(profile.subscription_tier)} curated events`}
                </p>
              </div>
              
              {profile.subscription_tier === 'free' && (
                <Link href="/subscription/upgrade">
                  <button className="funky-profile-button">Upgrade Plan</button>
                </Link>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="funky-account-actions-card">
            <div className="funky-account-actions-header">
              <h2>Account Actions</h2>
            </div>
            <div className="funky-account-actions-body">
              <div className="space-y-4">
                <div className="funky-action-item">
                  <div>
                    <h3 className="font-medium text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                  <button 
                    className="funky-profile-button"
                    onClick={handleChangePassword}
                    style={{ fontSize: '0.8em', padding: '0.6em 1em' }}
                  >
                    Change Password
                  </button>
                </div>
                
                <div className="funky-action-item">
                  <div>
                    <h3 className="font-medium text-gray-900">Download Data</h3>
                    <p className="text-sm text-gray-600">Export your attendance report as PDF</p>
                  </div>
                  <button 
                    className="funky-profile-button"
                    onClick={handleDownloadData}
                    disabled={downloadingPDF}
                    style={{ fontSize: '0.8em', padding: '0.6em 1em' }}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    {downloadingPDF ? 'Downloading...' : 'Download'}
                  </button>
                </div>
                
                <div className="funky-action-item">
                  <div>
                    <h3 className="font-medium text-red-600">Sign Out</h3>
                    <p className="text-sm text-gray-600">Sign out of your account</p>
                  </div>
                  <button 
                    className="funky-profile-button danger"
                    onClick={handleSignOut}
                    style={{ fontSize: '0.8em', padding: '0.6em 1em' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseEditModal()
            }
          }}
        >
          <div 
            className="funky-modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="funky-modal-header">
              <h2 className="funky-modal-title">
                Edit Profile
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="funky-modal-close-button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="funky-modal-body">
              <div className="space-y-4">
                {/* Username (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Username (Read-only)
                  </label>
                  <input
                    type="text"
                    value={`@${profile?.username || ''}`}
                    disabled
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-medium cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    Username cannot be changed
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                    required
                  />
                </div>

                {/* College/Organization */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    College/Organization
                  </label>
                  <input
                    type="text"
                    value={editFormData.college}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, college: e.target.value }))}
                    placeholder="Enter your college or organization"
                    className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  />
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={editFormData.graduation_year}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    min="1950"
                    max="2050"
                    className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself... (e.g., your interests, goals, what you're passionate about)"
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.skills}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g., React, Python, UI/UX Design, Machine Learning, Public Speaking"
                    className="w-full px-3 py-2 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  />
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    Add any skills, technologies, or areas of expertise you have
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="funky-modal-actions mt-6">
                <button
                  onClick={handleCloseEditModal}
                  disabled={saving}
                  className="funky-modal-button secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editFormData.full_name.trim()}
                  className="funky-modal-button primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Help Text */}
              <p className="funky-modal-help-text mt-4">
                Your profile information helps others connect with you and showcases your expertise
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}