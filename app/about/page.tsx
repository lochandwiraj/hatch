import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Student Event Discovery for India',
  description: 'HATCH was built by two students tired of missing opportunities. We curate the best hackathons, competitions and workshops across India so you never miss out.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-12">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">About</p>
          <h1 className="text-3xl font-bold text-white mb-4">We built <span className="font-qepho">HATCH</span> because we were tired of missing out.</h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Every week, hundreds of hackathons, competitions, workshops, and networking events happen across India — and most students never hear about them. They're buried across Instagram pages, WhatsApp groups, college notice boards, and random Discord servers.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">The problem</h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              A student who wants to find opportunities spends hours every week searching across ten different platforms, only to find out about an event after registration closed. The best hackathons, case competitions, and workshops go to the students who happen to be in the right group chat — not the most deserving ones.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Events are announced on obscure Instagram pages, buried in college WhatsApp groups, posted to Discord servers you didn't know existed, and pinned on notice boards you walk past without looking. There's no single place to check. Every student is on their own.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">What <span className="font-qepho">HATCH</span> does</h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              <span className="font-qepho">HATCH</span> aggregates and hand-curates the best student events across India — hackathons, case competitions, cultural fests, tech workshops, career fairs, and more. We scan 50+ sources every week so you don't have to.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-3">
              Every event on <span className="font-qepho">HATCH</span> is manually reviewed by our team before it goes live. We check that it's legitimate, open to students, and worth your time. No algorithm. No sponsored spam. No events from three months ago still showing as "upcoming."
            </p>
            <p className="text-zinc-400 leading-relaxed">
              We cover hackathons, national-level case competitions, design challenges, tech workshops, startup competitions, and more — from cities like Bengaluru, Mumbai, Delhi, Hyderabad, Chennai, and Pune, as well as fully online events open to students anywhere in India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Who we are</h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              <span className="font-qepho">HATCH</span> was built by <span className="text-white">Dwiraj</span> and <span className="text-white">Lochan</span> — two students who spent too much time searching and not enough time participating. We missed registrations because we found out too late. We drove each other up the wall talking about how this problem had no good solution.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              So we built one. <span className="font-qepho">HATCH</span> is shaped entirely by feedback from students like you. We're not a large company running automated aggregation — every curation decision is made by people who've been in the same situation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Our mission</h2>
            <p className="text-zinc-400 leading-relaxed">
              Help every student find the opportunity that changes their trajectory — regardless of which college they go to, which city they're in, or which WhatsApp group they happen to be in. The student at a tier-3 college in a small city deserves the same shot as the one at IIT Bombay. <span className="font-qepho">HATCH</span> exists to level that playing field.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">How curation works</h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              Each week, our team goes through Instagram pages, LinkedIn posts, college club announcements, Devfolio, Unstop, and dozens of other sources. We shortlist events that are open to college students, have clear registration details, and aren't pay-to-play.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Events are tagged by category, mode (online or offline), city, and required experience level. Explorer and Professional subscribers get early access and a larger selection — but every tier gets real, quality events. We'd rather show you five great opportunities than fifty mediocre ones.
            </p>
          </section>

          <section
            className="rounded-2xl p-6"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <p className="text-sm text-zinc-300 leading-relaxed">
              We're early and growing. If you have feedback, event suggestions, or just want to say hi —{' '}
              <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">reach out</Link>
              . We read every message. You can also browse our current{' '}
              <Link href="/events" className="text-violet-400 hover:text-violet-300 transition-colors">events listing</Link>
              {' '}or check{' '}
              <Link href="/pricing" className="text-violet-400 hover:text-violet-300 transition-colors">pricing</Link>
              {' '}to get started.
            </p>
          </section>
        </div>
      </main>

    </div>
  )
}
