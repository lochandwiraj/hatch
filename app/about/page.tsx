import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'About — HATCH' }

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-12">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">About</p>
          <h1 className="text-3xl font-bold text-white mb-4">We built HATCH because we were tired of missing out.</h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Every week, hundreds of hackathons, competitions, workshops, and networking events happen across India — and most students never hear about them. They're buried across Instagram pages, WhatsApp groups, college notice boards, and random Discord servers.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">The problem</h2>
            <p className="text-zinc-400 leading-relaxed">
              A student who wants to find opportunities spends hours every week searching across ten different platforms, only to find out about an event after registration closed. The best opportunities go to the students who happen to be in the right group chat — not the most deserving ones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">What HATCH does</h2>
            <p className="text-zinc-400 leading-relaxed">
              HATCH aggregates and hand-curates the best student events across India — hackathons, case competitions, cultural fests, tech workshops, career fairs, and more. We filter out the noise so you only see events worth your time. No algorithm, no spam, just quality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Who we are</h2>
            <p className="text-zinc-400 leading-relaxed">
              HATCH was built by <span className="text-white">Dwiraj</span> and <span className="text-white">Lochan</span> — two students who spent too much time searching and not enough time participating. We're building this from the ground up, shaped entirely by feedback from students like you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Our mission</h2>
            <p className="text-zinc-400 leading-relaxed">
              Help every student find the opportunity that changes their trajectory — regardless of which college they go to, which city they're in, or which WhatsApp group they happen to be in.
            </p>
          </section>

          <section
            className="rounded-2xl p-6"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <p className="text-sm text-zinc-300 leading-relaxed">
              We're early and growing. If you have feedback, event suggestions, or just want to say hi —{' '}
              <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">
                reach out
              </Link>
              . We read every message.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
