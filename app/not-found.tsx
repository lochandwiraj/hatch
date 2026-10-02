import Link from 'next/link'
import { Hatch } from '@/components/brand/Hatch'

export const metadata = { title: 'Page not found' }

const routes = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink px-4 py-24 lg:px-16">
      <div className="mx-auto max-w-measure">
        <p data-mono className="text-mono text-signal">
          404
        </p>
        <h1 className="mt-4 font-display text-display-m text-type-primary">
          This page is not here
        </h1>
        <p className="mt-4 max-w-tight font-serif text-body text-type-secondary">
          The link may be old, or the event it pointed to has been archived. Everything on{' '}
          <Hatch /> is still reachable from the routes below.
        </p>

        <ul className="mt-12 border-t border-rule">
          {routes.map(({ href, label }) => (
            <li key={href} className="border-b border-rule">
              <Link
                href={href}
                className="flex min-h-touch items-center justify-between py-3 font-sans text-ui text-type-primary hover:text-signal active:text-signal"
              >
                <span>{label}</span>
                <span data-mono className="text-mono text-type-muted">
                  {href}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
