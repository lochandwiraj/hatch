'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { CheckIcon, ArrowRightIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { getCategoryGradient } from '@/components/events/EventCard'

interface LiveEvent {
  id: string
  title: string
  organizer: string
  category: string
  event_date: string
  mode: string
  prize_pool: string | null
  required_tier: string
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay }}
      className={className}>
      {children}
    </motion.div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from('events')
        .select('id, title, organizer, category, event_date, mode, prize_pool, required_tier')
        .eq('status', 'published')
        .eq('required_tier', 'free')
        .order('event_date', { ascending: true })
        .limit(6)
      setLiveEvents(data ?? [])
      setEventsLoading(false)
    }
    fetchEvents()
  }, [])

  const categories = ['All', ...Array.from(new Set(liveEvents.map(e => e.category)))]
  const filteredEvents = activeCategory === 'All'
    ? liveEvents
    : liveEvents.filter(e => e.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-x-hidden">

      {/* Animated Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="orb-drift-1 absolute -top-[20%] -left-[10%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)' }} />
        <div className="orb-drift-2 absolute top-[20%] -right-[15%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)' }} />
        <div className="orb-drift-3 absolute bottom-[0%] left-[20%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%)' }} />
        <div className="absolute top-[50%] left-[60%] w-[350px] h-[350px] rounded-full orb-drift-1"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 65%)', animationDelay: '5s' }} />
      </div>

      {/* ── Floating Pill Nav ── */}
      <div className="sticky top-4 z-50 flex justify-center px-4 pointer-events-none">
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(5,5,8,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <div className="hidden sm:flex items-center gap-0.5 text-sm">
            <a href="#browse" className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200">Browse</a>
            <a href="#pricing" className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200">Pricing</a>
          </div>
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-white/[0.07]">
            <Link href="/auth" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</Link>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link href="/auth" className="text-sm text-white font-medium px-4 py-1.5 rounded-lg transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                Get started
              </Link>
            </motion.div>
          </div>
        </motion.nav>
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 36, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
            className="font-qepho text-white leading-none tracking-tight mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}
          >
            HATCH
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/25 mb-8"
            style={{ background: 'rgba(124,58,237,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-badge-pulse" />
            <span className="text-violet-300 text-xs font-medium tracking-wide">Discover events for college students</span>
          </div>

          <h1 className="text-[clamp(2.8rem,7vw,5rem)] font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Find your next<br />
            <span className="text-violet-300">big opportunity.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
            Hackathons, case studies, workshops and competitions — curated from 50+ sources every week.
            Never miss an event that could change your career.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
              <Link href="/auth"
                className="inline-flex items-center gap-2.5 text-white font-semibold px-6 py-3 rounded-xl text-sm"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                Start for free
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>
            <a href="#browse" className="text-sm text-zinc-400 hover:text-white transition-colors">Browse events →</a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.4 }}
          className="flex flex-wrap gap-x-12 gap-y-4 mt-14 pt-10 border-t border-white/[0.06]"
        >
          {[
            { value: '50+', label: 'Sources scanned', color: 'text-violet-400' },
            { value: '10h+', label: 'Saved per week', color: 'text-sky-400' },
            { value: '200+', label: 'Events curated', color: 'text-emerald-400' },
            { value: 'Weekly', label: 'Fresh drops', color: 'text-rose-400' },
          ].map(s => (
            <div key={s.label}>
              <div className={`text-3xl font-extrabold mb-0.5 ${s.color}`}>{s.value}</div>
              <div className="text-sm text-zinc-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Browse Events Preview ── */}
      <section id="browse" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <FadeUp className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Live on <span className="font-qepho">HATCH</span></p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">What's happening</h2>
          </div>
          <Link href="/auth" className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
            See all events <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </FadeUp>

        {/* Category filters — derived from real data */}
        {categories.length > 1 && (
          <FadeUp delay={0.05} className="flex flex-wrap gap-2 mb-7">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200"
                style={activeCategory === cat
                  ? { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#ffffff' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}>
                {cat}
              </button>
            ))}
          </FadeUp>
        )}

        {/* Event Cards Grid */}
        {eventsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                style={{ background: 'rgba(10,10,18,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="h-44 bg-white/[0.04]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 rounded-full bg-white/[0.04] w-1/3" />
                  <div className="h-4 rounded-full bg-white/[0.05] w-full" />
                  <div className="h-3 rounded-full bg-white/[0.03] w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((e, i) => (
              <FadeUp key={e.id} delay={i * 0.07}>
                <LiveEventCard event={e} />
              </FadeUp>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-600 text-sm">No events yet — check back soon.</div>
        )}

        <FadeUp delay={0.3} className="text-center mt-10">
          <Link href="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Sign up to see all events →
          </Link>
        </FadeUp>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <FadeUp className="mb-12">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Start free. Upgrade when ready.
          </h2>
          <p className="text-zinc-400 mt-3 text-lg">Less than a cup of chai for the Explorer plan.</p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.1}>
              <PlanCard plan={plan} />
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(20,10,50,0.9) 0%, rgba(15,12,40,0.9) 50%, rgba(30,10,25,0.9) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.4) 0%, transparent 55%)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Don't miss the next big one.
              </h2>
              <p className="text-zinc-300 mb-8 text-lg max-w-lg mx-auto">
                New events drop every week. Join free and never miss an opportunity.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-block">
                <Link href="/auth"
                  className="inline-flex items-center gap-3 text-white font-semibold px-8 py-3.5 rounded-xl text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 12px 40px rgba(124,58,237,0.45)' }}>
                  Get started for free
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="font-qepho text-white text-base">HATCH</span>
          <p className="text-sm text-zinc-600">© 2026 <span className="font-qepho">HATCH</span>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// ── Live Event Card (landing page, real Supabase data) ──
function LiveEventCard({ event }: { event: LiveEvent }) {
  const dateObj = new Date(event.event_date)
  const dateDay = dateObj.getDate()
  const dateMonth = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const gradient = getCategoryGradient(event.category)

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'rgba(11,10,19,0.95)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}
    >
      {/* Date Hero Header */}
      <div className="relative h-44 overflow-hidden flex items-center justify-center" style={{ background: gradient }}>
        <div className="relative z-10 flex flex-col items-center leading-none select-none">
          <span className="text-white/60 font-bold tracking-[0.25em] mb-1" style={{ fontSize: '0.65rem' }}>
            {dateMonth}
          </span>
          <span className="font-qepho text-white leading-none"
            style={{ fontSize: '5.5rem', lineHeight: 1, textShadow: '0 2px 24px rgba(0,0,0,0.3)' }}>
            {dateDay}
          </span>
        </div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 100%)' }} />
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {event.category}
          </span>
        </div>
        {event.prize_pool && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(52,211,153,0.25)', color: '#6ee7b7', backdropFilter: 'blur(8px)', border: '1px solid rgba(52,211,153,0.35)' }}>
              🏆 {event.prize_pool}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
            style={{ background: gradient }}>
            {event.organizer.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-zinc-400 font-medium truncate">{event.organizer}</span>
        </div>
        <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">{event.title}</h3>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {event.mode}
          </span>
        </div>
        <div className="pt-2 border-t border-white/[0.05]">
          <Link href="/auth"
            className="block text-center text-xs font-semibold py-2 rounded-xl text-white transition-all duration-200 w-full"
            style={{ background: gradient, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            Join to register ↗
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ── Plan Card ──
interface Plan {
  name: string; price: string; period: string | null; tagline: string; popular: boolean
  priceColor: string; badgeClass: string; dotColor: string; checkColor: string; features: string[]; cta: string
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
      className="relative flex flex-col rounded-2xl p-6 h-full"
      style={plan.popular
        ? { background: 'linear-gradient(145deg, rgba(20,12,45,0.98), rgba(15,10,35,0.98))', border: '1px solid rgba(124,58,237,0.45)', boxShadow: '0 0 40px rgba(124,58,237,0.15)' }
        : { background: 'rgba(13,13,20,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="text-xs font-semibold text-white px-3.5 py-1 rounded-full"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>Most popular</span>
        </div>
      )}
      <div className="mb-5">
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${plan.badgeClass}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${plan.dotColor}`} />{plan.name}
        </div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className={`text-4xl font-extrabold ${plan.priceColor}`}>{plan.price}</span>
          {plan.period && <span className="text-zinc-500 text-sm">{plan.period}</span>}
        </div>
        <p className="text-sm text-zinc-500">{plan.tagline}</p>
      </div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map(f => (
          <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.popular ? 'text-zinc-300' : 'text-zinc-400'}`}>
            <CheckIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.checkColor}`} />{f}
          </li>
        ))}
      </ul>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
        <Link href="/auth"
          className="text-center text-sm font-semibold py-2.5 rounded-xl block transition-all duration-200"
          style={plan.popular
            ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }
            : plan.name === 'Professional'
            ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }
            : { background: 'rgba(255,255,255,0.06)', color: '#d4d4d8' }}>
          {plan.cta}
        </Link>
      </motion.div>
    </motion.div>
  )
}

const plans: Plan[] = [
  { name: 'Free', price: 'Free', period: null, tagline: 'For getting started', popular: false, priceColor: 'text-white', badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', dotColor: 'bg-zinc-400', checkColor: 'text-zinc-500', cta: 'Start free', features: ['5 curated events/week', 'Basic profile page', 'Event browsing', 'Email notifications'] },
  { name: 'Explorer', price: '₹99', period: '/month', tagline: 'For active students', popular: true, priceColor: 'text-sky-400', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dotColor: 'bg-sky-400', checkColor: 'text-sky-400', cta: 'Get Explorer', features: ['7 curated events/week', 'Priority registration', 'Advanced filters', 'Profile showcase', 'Calendar sync'] },
  { name: 'Professional', price: '₹149', period: '/month', tagline: 'For serious achievers', popular: false, priceColor: 'text-emerald-400', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotColor: 'bg-emerald-400', checkColor: 'text-emerald-400', cta: 'Get Professional', features: ['All curated events', 'Early access to listings', 'VIP-only events', 'Career guidance sessions', 'Priority support', 'Portfolio export'] },
]
