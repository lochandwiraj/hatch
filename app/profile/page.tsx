'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { motion, AnimatePresence } from 'motion/react'
import {
  PencilIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CheckIcon,
  TrophyIcon,
  AcademicCapIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimit } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { generateAttendanceReport } from '@/lib/pdfGenerator'

interface AttendanceStats {
  total_registered: number
  total_attended: number
  attendance_rate: number
}

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }
const INPUT_STYLE = { background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }
const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all duration-200'

const tierMap = {
  free: { color: 'text-zinc-400', dot: 'bg-zinc-500', glow: 'rgba(113,113,122,0.15)' },
  basic_99: { color: 'text-sky-400', dot: 'bg-sky-400', glow: 'rgba(56,189,248,0.15)' },
  premium_149: { color: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'rgba(52,211,153,0.15)' },
}

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    full_name: '', college: '', graduation_year: new Date().getFullYear(),
    bio: '', skills: '',
  })
  const router = useRouter()

  useEffect(() => {
    if (profile && user) {
      loadAttendanceStats()
      setEditFormData({
        full_name: profile.full_name ?? '',
        college: profile.college ?? '',
        graduation_year: profile.graduation_year ?? new Date().getFullYear(),
        bio: profile.bio ?? '',
        skills: profile.skills?.join(', ') ?? '',
      })
    }
  }, [profile, user])

  const loadAttendanceStats = async () => {
    if (!user) return
    try {
      setLoadingStats(true)
      const { data, error } = await supabase.rpc('get_user_attendance_stats', { user_uuid: user.id })
      if (error) throw error
      setAttendanceStats(data?.[0] ?? { total_registered: 0, total_attended: 0, attendance_rate: 0 })
    } catch {
      setAttendanceStats({ total_registered: 0, total_attended: 0, attendance_rate: 0 })
    } finally { setLoadingStats(false) }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const skillsArray = editFormData.skills.split(',').map(s => s.trim()).filter(Boolean)
      const { error } = await supabase.from('user_profiles').update({
        full_name: editFormData.full_name.trim(),
        college: editFormData.college.trim() || null,
        graduation_year: editFormData.graduation_year,
        bio: editFormData.bio.trim() || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      if (error) throw error
      toast.success('Profile updated!')
      setShowEditModal(false)
      refreshProfile()
    } catch (err: any) {
      toast.error('Failed to update profile: ' + err.message)
    } finally { setSaving(false) }
  }

  const handleDownloadData = async () => {
    if (!user || !profile) return
    setDownloadingPDF(true)
    try {
      toast.loading('Generating report...', { id: 'pdf' })
      const { data: attendedEvents, error } = await supabase.from('user_attendance_with_events').select('*')
        .eq('user_id', user.id).order('event_date', { ascending: true })
      if (error) throw error
      await generateAttendanceReport(
        { full_name: profile.full_name, username: profile.username, email: user.email ?? '', college: profile.college ?? 'Not specified', graduation_year: profile.graduation_year?.toString() ?? '', subscription_tier: profile.subscription_tier, created_at: profile.created_at },
        attendedEvents ?? [],
        attendanceStats ?? { total_registered: 0, total_attended: 0, attendance_rate: 0 }
      )
      toast.success('Report downloaded!', { id: 'pdf' })
    } catch { toast.error('Failed to generate report', { id: 'pdf' }) }
    finally { setDownloadingPDF(false) }
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const tier = (profile.subscription_tier ?? 'free') as keyof typeof tierMap
  const { color: tierColor, dot: tierDot, glow: tierGlow } = tierMap[tier] ?? tierMap.free
  const tierLabel = getSubscriptionTierName(tier)
  const limit = getEventLimit(tier)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="rounded-2xl p-6 mb-4"
          style={{ ...CARD, boxShadow: `0 0 32px ${tierGlow}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                <span className="text-white text-2xl font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
                <p className="text-sm text-zinc-500">@{profile.username}</p>
                <div className={`flex items-center gap-1.5 mt-1 ${tierColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${tierDot}`} />
                  <p className="text-xs font-semibold">{tierLabel}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <PencilIcon className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
            {[
              { label: 'Attended', value: loadingStats ? '—' : attendanceStats?.total_attended ?? 0, color: 'text-emerald-400' },
              { label: 'Registered', value: loadingStats ? '—' : attendanceStats?.total_registered ?? 0, color: 'text-sky-400' },
              { label: 'Rate', value: loadingStats ? '—' : `${attendanceStats?.attendance_rate ?? 0}%`, color: 'text-violet-400' },
              { label: 'Access', value: limit === -1 ? 'All' : limit, color: tierColor },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[
            {
              title: 'Personal', icon: UserCircleIcon,
              items: [
                { label: 'Full name', value: profile.full_name },
                { label: 'Email', value: user?.email },
                { label: 'Username', value: `@${profile.username}` },
              ]
            },
            {
              title: 'Academic', icon: AcademicCapIcon,
              items: [
                { label: 'College', value: profile.college || '—' },
                { label: 'Graduation year', value: profile.graduation_year || '—' },
                { label: 'Member since', value: new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
              ]
            },
          ].map(section => (
            <div key={section.title} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="w-4 h-4 text-zinc-600" />
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-zinc-600 mb-0.5">{item.label}</p>
                    <p className="text-sm text-white font-medium">{String(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bio & Skills */}
        <div className="rounded-2xl p-5 mb-4" style={CARD}>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Bio & Skills</h2>
          {profile.bio || (profile.skills && profile.skills.length > 0) ? (
            <div className="space-y-4">
              {profile.bio && (
                <div>
                  <p className="text-xs text-zinc-600 mb-2">Bio</p>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-600 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map(skill => (
                      <span key={skill} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-500 mb-3">Add your bio and skills to stand out.</p>
              <button onClick={() => setShowEditModal(true)}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium">
                Add bio & skills →
              </button>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="rounded-2xl p-5 mb-4" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-zinc-600" />
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event activity</h2>
            </div>
            <Link href="/calendar" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
              View calendar →
            </Link>
          </div>
          {loadingStats ? (
            <div className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ) : attendanceStats && attendanceStats.total_attended > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Events completed', value: attendanceStats.total_attended, color: 'text-emerald-400' },
                { label: 'Total registered', value: attendanceStats.total_registered, color: 'text-sky-400' },
                { label: 'Completion rate', value: `${attendanceStats.attendance_rate}%`, color: 'text-violet-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(5,5,10,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              No events attended yet.{' '}
              <Link href="/events" className="text-violet-400 hover:text-violet-300 font-medium">Browse events →</Link>
            </p>
          )}
        </div>

        {/* Account actions */}
        <div className="rounded-2xl p-5" style={CARD}>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-0.5">
            {[
              {
                label: 'Download attendance report',
                desc: 'Export your event history as PDF',
                action: handleDownloadData,
                loading: downloadingPDF,
                btnLabel: downloadingPDF ? 'Generating...' : 'Download PDF',
                icon: ArrowDownTrayIcon,
              },
              {
                label: 'Change password',
                desc: 'Update your account password',
                action: () => router.push('/auth/forgot-password'),
                btnLabel: 'Change',
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{item.desc}</p>
                </div>
                <button onClick={item.action} disabled={item.loading}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {item.icon && <item.icon className="w-3.5 h-3.5" />}
                  {item.btnLabel}
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm text-red-400 font-medium">Sign out</p>
                <p className="text-xs text-zinc-600 mt-0.5">Sign out of your account</p>
              </div>
              <button onClick={async () => { await signOut(); router.push('/auth') }}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ background: 'rgba(10,10,18,0.98)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                <h2 className="text-base font-bold text-white">Edit profile</h2>
                <button onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Username (read-only)</label>
                  <input value={`@${profile.username}`} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} style={INPUT_STYLE} />
                </div>
                {[
                  { key: 'full_name', label: 'Full name', placeholder: 'Your full name', type: 'text' },
                  { key: 'college', label: 'College', placeholder: 'Your college name', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{f.label}</label>
                    <input type={f.type} value={(editFormData as any)[f.key]}
                      onChange={e => setEditFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className={inputCls} style={INPUT_STYLE} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Graduation year</label>
                  <input type="number" value={editFormData.graduation_year}
                    onChange={e => setEditFormData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    min="1950" max="2050" className={inputCls} style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio</label>
                  <textarea value={editFormData.bio}
                    onChange={e => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..." rows={3}
                    className={`${inputCls} resize-none`} style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Skills <span className="text-zinc-600">(comma separated)</span></label>
                  <input type="text" value={editFormData.skills}
                    onChange={e => setEditFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="React, Python, UI/UX Design..." className={inputCls} style={INPUT_STYLE} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEditModal(false)} disabled={saving}
                    className="flex-1 text-sm py-2.5 rounded-xl text-zinc-400 transition-colors disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving || !editFormData.full_name.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
