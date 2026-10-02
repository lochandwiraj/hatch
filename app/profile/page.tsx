'use client'

import { useState, useEffect } from 'react'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { getSubscriptionTierName, getEventLimit } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AttendanceStats {
  total_registered: number
  total_attended: number
  attendance_rate: number
}

const CARD = { background: 'var(--ink-raised)', border: '1px solid var(--rule)' }
const INPUT_STYLE = { background: 'var(--ink-raised)', border: '1px solid var(--rule)' }
const inputCls = 'w-full  px-4 py-3 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border focus:border-signal  '

const tierMap = {
  free: { color: 'text-type-secondary', dot: 'bg-ink-raised', glow: 'var(--rule)' },
  basic_99: { color: 'text-type-secondary', dot: 'bg-ink-raised', glow: 'var(--rule)' },
  premium_149: { color: 'text-verified', dot: 'bg-verified', glow: 'var(--verified)' },
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
      await (await import('@/lib/pdfGenerator')).generateAttendanceReport(
        { full_name: profile.full_name ?? '', username: profile.username ?? '', email: user.email ?? '', college: profile.college ?? 'Not specified', graduation_year: profile.graduation_year?.toString() ?? '', subscription_tier: profile.subscription_tier ?? 'free', created_at: profile.created_at ?? '' },
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
        <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
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
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">

        {/* Profile header card */}
        <div
          className="p-6 mb-4"
          style={{ ...CARD, }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--ink-raised)', }}>
                <span className="text-type-primary text-title font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-title font-extrabold text-type-primary tracking-tight">{profile.full_name}</h1>
                <p className="text-ui text-type-muted">@{profile.username}</p>
                <div className={`flex items-center gap-2 mt-1 ${tierColor}`}>
                  <div className={`w-2 h-2 ${tierDot}`} />
                  <p className="text-ui-s font-semibold">{tierLabel}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 text-ui text-type-secondary hover:text-type-primary px-3 py-2"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
              <Glyph name="pencil" className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-rule-strong">
            {[
              { label: 'Attended', value: loadingStats ? '' : attendanceStats?.total_attended ?? 0, color: 'text-type-primary' },
              { label: 'Registered', value: loadingStats ? '' : attendanceStats?.total_registered ?? 0, color: 'text-type-primary' },
              { label: 'Rate', value: loadingStats ? '' : `${attendanceStats?.attendance_rate ?? 0}%`, color: 'text-type-secondary' },
              { label: 'Access', value: limit === -1 ? 'All' : limit, color: 'text-signal' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-title font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-ui-s text-type-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[
            {
              title: 'Personal', icon: "user",
              items: [
                { label: 'Full name', value: profile.full_name },
                { label: 'Email', value: user?.email },
                { label: 'Username', value: `@${profile.username}` },
              ]
            },
            {
              title: 'Academic', icon: "cap",
              items: [
                { label: 'College', value: profile.college || '' },
                { label: 'Graduation year', value: profile.graduation_year || '' },
                { label: 'Member since', value: new Date(profile.created_at ?? '').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
              ]
            },
          ].map(section => (
            <div key={section.title} className="p-6" style={CARD}>
              <div className="flex items-center gap-2 mb-4">
                <Glyph name={section.icon} className="w-4 h-4 text-type-muted" />
                <h2 className="text-ui-s font-semibold text-type-muted uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map(item => (
                  <div key={item.label}>
                    <p className="text-ui-s text-type-muted mb-1">{item.label}</p>
                    <p className="text-ui text-type-primary font-medium">{String(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bio & Skills */}
        <div className="p-6 mb-4" style={CARD}>
          <h2 className="text-ui-s font-semibold text-type-muted uppercase tracking-wider mb-4">Bio & Skills</h2>
          {profile.bio || (profile.skills && profile.skills.length > 0) ? (
            <div className="space-y-4">
              {profile.bio && (
                <div>
                  <p className="text-ui-s text-type-muted mb-2">Bio</p>
                  <p className="text-ui text-type-primary leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-ui-s text-type-muted mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <span key={skill} className="text-ui-s px-3 py-1 font-medium"
                        style={{ border: '1px solid var(--rule-strong)', color: 'var(--type-primary)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline justify-between gap-4 py-2">
              <p className="font-serif text-ui-s text-type-secondary">
                Add your bio and skills so recruiters see more than a name.
              </p>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex min-h-touch items-center border border-rule-strong px-4 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal"
              >
                Add bio and skills
              </button>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="p-6 mb-4" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Glyph name="trophy" className="w-4 h-4 text-type-muted" />
              <h2 className="text-ui-s font-semibold text-type-muted uppercase tracking-wider">Event activity</h2>
            </div>
            <Link href="/calendar" className="text-ui-s text-signal hover:text-signal font-medium">
              View calendar</Link>
          </div>
          {loadingStats ? (
            <div className="h-16" style={{ background: 'var(--ink-raised)' }} />
          ) : attendanceStats && attendanceStats.total_attended > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Events completed', value: attendanceStats.total_attended, color: 'text-type-primary' },
                { label: 'Total registered', value: attendanceStats.total_registered, color: 'text-type-secondary' },
                { label: 'Completion rate', value: `${attendanceStats.attendance_rate}%`, color: 'text-type-secondary' },
              ].map(s => (
                <div key={s.label} className="p-4 text-center" style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
                  <p className={`text-title font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-ui-s text-type-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ui text-type-muted text-center py-4">
              No events attended yet.{' '}
              <Link href="/events" className="text-signal hover:text-signal font-medium">Browse events</Link>
            </p>
          )}
        </div>

        {/* Account actions */}
        <div className="p-6" style={CARD}>
          <h2 className="text-ui-s font-semibold text-type-muted uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-1">
            {[
              {
                label: 'Download attendance report',
                desc: 'Export your event history as PDF',
                action: handleDownloadData,
                loading: downloadingPDF,
                btnLabel: downloadingPDF ? 'Generating...' : 'Download PDF',
                icon: "download",
              },
              {
                label: 'Change password',
                desc: 'Update your account password',
                action: () => router.push('/auth/forgot-password'),
                btnLabel: 'Change',
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-4 border-b border-rule-strong last:border-0">
                <div>
                  <p className="text-ui text-type-primary font-medium">{item.label}</p>
                  <p className="text-ui-s text-type-muted mt-1">{item.desc}</p>
                </div>
                <button onClick={item.action} disabled={item.loading}
                  className="flex items-center gap-2 text-ui-s text-type-secondary hover:text-type-primary px-3 py-2 disabled:opacity-50"
                  style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
                  {item.icon && <Glyph name={item.icon} className="w-4 h-4" />}
                  {item.btnLabel}
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-ui text-signal font-medium">Sign out</p>
                <p className="text-ui-s text-type-muted mt-1">Sign out of your account</p>
              </div>
              <button onClick={async () => { await signOut(); router.push('/auth') }}
                className="text-ui-s text-signal hover:text-signal px-3 py-2"
                style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

          </div>

          {/* Live preview of the public record, as others would see it. */}
          <aside className="mt-8 lg:col-span-5 lg:mt-0" aria-label="Public profile preview">
            <div className="sticky top-24 border border-rule p-4">
              <p className="font-sans text-label uppercase text-type-muted">Public preview</p>
              <div className="mt-4 flex items-start gap-3 border-t border-rule pt-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-rule">
                  <span data-mono className="text-mono text-type-primary">
                    {(profile?.full_name ?? profile?.username ?? '?').charAt(0).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="font-display text-title uppercase text-type-primary">{profile?.full_name}</p>
                  <p data-mono className="text-mono text-type-secondary">@{profile?.username}</p>
                </div>
              </div>
              {profile?.bio ? (
                <p className="mt-4 max-w-tight font-serif text-ui-s text-type-secondary">{profile.bio}</p>
              ) : null}
              <dl className="mt-4 border-t border-rule">
                {profile?.college ? (
                  <div className="flex justify-between gap-3 border-b border-rule py-2">
                    <dt className="font-sans text-ui-s text-type-muted">College</dt>
                    <dd className="font-sans text-ui-s text-type-primary">{profile.college}</dd>
                  </div>
                ) : null}
                {profile?.graduation_year ? (
                  <div className="flex justify-between gap-3 border-b border-rule py-2">
                    <dt className="font-sans text-ui-s text-type-muted">Graduation</dt>
                    <dd data-mono className="text-mono text-type-primary">{profile.graduation_year}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-4 font-sans text-ui-s text-type-muted">
                {profile?.is_profile_public ? 'Visible to others.' : 'Private. Only you can see this.'}
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Edit Modal */}
      
        {showEditModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--ink)', }}
            onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)', }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-rule-strong">
                <h2 className="text-body font-bold text-type-primary">Edit profile</h2>
                <button onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-ink-raised text-type-secondary hover:text-type-primary">
                  <Glyph name="cross" className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="profile-username-read-only" className="block text-ui-s font-medium text-type-secondary mb-2">Username (read-only)</label>
                  <input id="profile-username-read-only" value={`@${profile.username}`} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} style={INPUT_STYLE} />
                </div>
                {[
                  { key: 'full_name', label: 'Full name', placeholder: 'Your full name', type: 'text' },
                  { key: 'college', label: 'College', placeholder: 'Your college name', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label htmlFor="profile-f-label" className="block text-ui-s font-medium text-type-secondary mb-2">{f.label}</label>
                    <input id="profile-f-label" type={f.type} value={(editFormData as any)[f.key]}
                      onChange={e => setEditFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className={inputCls} style={INPUT_STYLE} />
                  </div>
                ))}
                <div>
                  <label htmlFor="profile-graduation-year" className="block text-ui-s font-medium text-type-secondary mb-2">Graduation year</label>
                  <input id="profile-graduation-year" type="number" value={editFormData.graduation_year}
                    onChange={e => setEditFormData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    min="1950" max="2050" className={inputCls} style={INPUT_STYLE} />
                </div>
                <div>
                  <label htmlFor="profile-bio" className="block text-ui-s font-medium text-type-secondary mb-2">Bio</label>
                  <textarea id="profile-bio" value={editFormData.bio}
                    onChange={e => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..." rows={3}
                    className={`${inputCls} resize-none`} style={INPUT_STYLE} />
                </div>
                <div>
                  <label className="block text-ui-s font-medium text-type-secondary mb-2">Skills <span className="text-type-muted">(comma separated)</span></label>
                  <input type="text" value={editFormData.skills}
                    onChange={e => setEditFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="React, Python, UI/UX Design..." className={inputCls} style={INPUT_STYLE} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEditModal(false)} disabled={saving}
                    className="flex-1 text-ui py-3 text-type-secondary disabled:opacity-50"
                    style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving || !editFormData.full_name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 text-ui py-3 text-type-primary font-semibold disabled:opacity-50"
                    style={{ background: 'var(--ink-raised)' }}>
                    <Glyph name="check" className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
    </div>
  )
}
