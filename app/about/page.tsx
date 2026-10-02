import type { Metadata } from 'next'
import { Hatch, BrandName } from '@/components/brand/Hatch'
import Header from '@/components/layout/Header'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About, Student Event Discovery for India',
  description: 'HATCH was built by two students tired of missing opportunities. We curate the best hackathons, competitions and workshops across India so you never miss out.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-16 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="max-w-tight lg:col-span-7">

        <div className="mb-12">
          <p className="text-ui-s text-signal uppercase tracking-widest font-medium mb-3">About</p>
          <h1 className="text-display-m font-bold text-type-primary mb-2">We built <Hatch /> because we were tired of missing out.</h1>
          <p className="text-body font-medium text-signal mb-4">Student event discovery for India, hackathons, competitions &amp; workshops, curated weekly.</p>
          <p className="text-type-secondary text-body leading-relaxed">
            Hackathons, competitions, workshops and networking events run constantly across India, and most students never hear about the ones they could have entered. They're buried across Instagram pages, WhatsApp groups, college notice boards, and random Discord servers.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-body-l font-semibold text-type-primary mb-3">The problem</h2>
            <p className="text-type-secondary leading-relaxed mb-3">
              A student who wants to find opportunities spends hours every week searching across ten different platforms, only to find out about an event after registration closed. The best hackathons, case competitions, and workshops go to the students who happen to be in the right group chat, not the most deserving ones.
            </p>
            <p className="text-type-secondary leading-relaxed">
              Events are announced on obscure Instagram pages, buried in college WhatsApp groups, posted to Discord servers you didn't know existed, and pinned on notice boards you walk past without looking. There's no single place to check. Every student is on their own.
            </p>
          </section>

          <section>
            <h2 className="text-body-l font-semibold text-type-primary mb-3">What <Hatch /> does</h2>
            <p className="text-type-secondary leading-relaxed mb-3">
              <Hatch /> aggregates and hand-curates the best student events across India: hackathons, case competitions, cultural fests, tech workshops, career fairs, and more. Every listing is found and checked by a person, not scraped by a bot.
            </p>
            <p className="text-type-secondary leading-relaxed mb-3">
              Every event on <Hatch /> is manually reviewed by our team before it goes live. We check that it's legitimate, open to students, and worth your time. No algorithm. No sponsored spam. No events from three months ago still showing as "upcoming."
            </p>
            <p className="text-type-secondary leading-relaxed">
              We cover hackathons, national-level case competitions, design challenges, tech workshops, startup competitions, and more, from cities like Bengaluru, Mumbai, Delhi, Hyderabad, Chennai, and Pune, as well as fully online events open to students anywhere in India.
            </p>
          </section>

          <section>
            <h2 className="text-body-l font-semibold text-type-primary mb-3">Who we are</h2>
            <p className="text-type-secondary leading-relaxed mb-3">
              <Hatch /> was built by <BrandName className="text-type-primary">Dwiraj</BrandName>, <BrandName className="text-type-primary">Lochan</BrandName>, and <BrandName className="text-type-primary">Sai Sugeet</BrandName>, three students who spent too much time searching and not enough time participating. We missed registrations because we found out too late. We drove each other up the wall talking about how this problem had no good solution.
            </p>
            <p className="text-type-secondary leading-relaxed">
              So we built one. <Hatch /> is shaped entirely by feedback from students like you. We're not a large company running automated aggregation, every curation decision is made by people who've been in the same situation.
            </p>
          </section>

          <section>
            <h2 className="text-body-l font-semibold text-type-primary mb-3">Our mission</h2>
            <p className="text-type-secondary leading-relaxed">
              Help every student find the opportunity that changes their trajectory, regardless of which college they go to, which city they're in, or which WhatsApp group they happen to be in. The student at a tier-3 college in a small city deserves the same shot as the one at IIT Bombay. <Hatch /> exists to level that playing field.
            </p>
          </section>

          <section>
            <h2 className="text-body-l font-semibold text-type-primary mb-3">How curation works</h2>
            <p className="text-type-secondary leading-relaxed mb-3">
              Each week, our team goes through Instagram pages, LinkedIn posts, college club announcements, Devfolio, Unstop, and dozens of other sources. We shortlist events that are open to college students, have clear registration details, and aren't pay-to-play.
            </p>
            <p className="text-type-secondary leading-relaxed">
              Events are tagged by category, mode (online or offline), city, and required experience level. Explorer and Professional subscribers get early access and a larger selection, but every tier gets real, quality events. We'd rather show you five great opportunities than fifty mediocre ones.
            </p>
          </section>

          <section className="border-t border-rule pt-6">
            <p className="max-w-measure font-serif text-body leading-relaxed text-type-secondary">
              We're early and growing. If you have feedback, event suggestions, or just want to say
              hi,{' '}
              <Link href="/contact" className="text-signal rule-underline">reach out</Link>. We read
              every message. You can also browse our current{' '}
              <Link href="/events" className="text-signal rule-underline">events listing</Link> or
              check{' '}
              <Link href="/pricing" className="text-signal rule-underline">pricing</Link> to get
              started.
            </p>
          </section>
        </div>
          </div>

          {/* A running mono sidenote, as the spec asks for at lg. */}
          <aside className="mt-12 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
            <dl className="border-t border-rule">
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Founded</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">Bengaluru, India</dd>
              </div>
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Reviewed by</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">a person, not a bot</dd>
              </div>
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Contact</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">hatch@hatchevent.in</dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>

    </div>
  )
}
