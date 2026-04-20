'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { motion, useInView } from 'motion/react'
import {
  CalendarDaysIcon,
  ArrowRightIcon,
  BoltIcon,
  UserCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimitDescription, getEventLimit } from '@/lib/utils'

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }
const CARD_INNER = { background: 'rgba(5,5,10,0.6)', border: '1px solid rgba(255,255,255,0.05)' }

const tierMap = {
  free: { color: 'text-zinc-400', dot: 'bg-zinc-500', glow: 'rgba(113,113,122,0.15)', label: 'zinc' },
  basic_99: { color: 'text-sky-400', dot: 'bg-sky-400', glow: 'rgba(56,189,248,0.12)', label: 'sky' },
  premium_149: { color: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'rgba(52,211,153,0.12)', label: 'emerald' },
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1], delay }}
      className={className}>
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { profile, user, refreshProfile, loading } = useAuth()

  useEffect(() => {
    if (!profile) return
    const interval = setInterval(refreshProfile, 15000)
    return () => clearInterval(interval)
  }, [profile, refreshProfile])

  useEffect(() => {
    const handleFocus = () => { if (profile) refreshProfile() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [profile, refreshProfile])

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const tier = (profile?.subscription_tier ?? 'free') as keyof typeof tierMap
  const { color: tierColor, dot: tierDot, glow: tierGlow } = tierMap[tier] ?? tierMap.free
  const tierLabel = getSubscriptionTierName(tier)
  const limit = getEventLimit(tier)
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            Hey, {firstName} 👋
          </h1>
          <p className="text-zinc-500">Here's your <span className="font-qepho">HATCH</span> dashboard.</p>
        </motion.div>

        {/* Stats row */}
        <FadeUp delay={0.05} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Tier card — glows in tier color */}
          <div className="rounded-2xl p-4 col-span-1" style={{ background: `rgba(10,10,18,0.8)`, border: `1px solid rgba(255,255,255,0.07)`, boxShadow: `0 0 24px ${tierGlow}` }}>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Current plan</p>
            <div className={`flex items-center gap-1.5 ${tierColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${tierDot}`} />
              <p className="text-base font-bold">{tierLabel}</p>
            </div>
          </div>
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Event access</p>
            <p className="text-base font-bold text-white">{limit === -1 ? 'Unlimited' : `${limit} events`}</p>
          </div>
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Username</p>
            <p className="text-base font-bold text-white truncate">@{profile?.username}</p>
          </div>
          <div className="rounded-2xl p-4" style={CARD}>
            <p className="text-xs text-zinc-500 mb-2 font-medium">College</p>
            <p className="text-base font-bold text-white truncate">{profile?.college || '—'}</p>
          </div>
        </FadeUp>

        {/* Upgrade banner */}
        {tier === 'free' && (
          <FadeUp delay={0.1} className="mb-6">
            <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SparklesIcon className="w-4 h-4 text-violet-400" />
                  <p className="text-white font-semibold text-sm">Unlock more with Explorer or Professional</p>
                </div>
                <p className="text-violet-300/60 text-xs">More events, early access, and premium features. Starting ₹99/month.</p>
              </div>
              <Link href="/subscription/upgrade"
                className="flex-shrink-0 flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                Upgrade
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </FadeUp>
        )}

        {/* Quick links */}
        <FadeUp delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { href: '/events', icon: BoltIcon, title: 'Browse events', desc: 'Discover and register for curated events.', accent: 'rgba(124,58,237,0.14)', iconColor: 'text-violet-400', border: 'rgba(124,58,237,0.2)' },
            { href: '/calendar', icon: CalendarDaysIcon, title: 'My calendar', desc: 'View your registered events by date.', accent: 'rgba(56,189,248,0.12)', iconColor: 'text-sky-400', border: 'rgba(56,189,248,0.2)' },
            { href: '/profile', icon: UserCircleIcon, title: 'My profile', desc: 'Edit bio, skills and download your report.', accent: 'rgba(52,211,153,0.12)', iconColor: 'text-emerald-400', border: 'rgba(52,211,153,0.2)' },
          ].map(item => (
            <motion.div key={item.href} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <Link href={item.href} className="block rounded-2xl p-5 transition-all duration-200"
                style={CARD}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.13)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: item.accent, border: `1px solid ${item.border}` }}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </Link>
            </motion.div>
          ))}
        </FadeUp>

        {/* Profile completion */}
        <FadeUp delay={0.2}>
          <div className="rounded-2xl p-5" style={CARD}>
            <h2 className="text-sm font-semibold text-white mb-4">Profile completion</h2>
            <div className="space-y-3">
              {[
                { label: 'Basic information', done: true },
                { label: 'Bio & skills', done: !!(profile?.bio && profile?.skills?.length) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}`}>
                      {item.done
                        ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                        : <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                    </div>
                    <span className="text-sm text-zinc-300">{item.label}</span>
                  </div>
                  {item.done
                    ? <span className="text-xs text-emerald-400 font-medium">Done</span>
                    : <Link href="/profile" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Add →</Link>}
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

      </main>
    </div>
  )
}
