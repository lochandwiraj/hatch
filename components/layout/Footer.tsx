import Link from 'next/link'
import { Hatch } from '@/components/brand/Hatch'
import { Rule } from '@/components/ui/Rule'

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Discover',
    links: [
      { href: '/events', label: 'Events' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/profile', label: 'Profile' },
      { href: '/subscription', label: 'Subscription' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/refund', label: 'Refund' },
      { href: '/delivery', label: 'Delivery' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-ink">
      <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {columns.map(({ heading, links }) => (
            <nav key={heading} aria-label={heading}>
              <p className="border-b border-rule pb-2 font-sans text-label uppercase text-type-muted">
                {heading}
              </p>
              <ul>
                {links.map(({ href, label }) => (
                  <li key={href} className="border-b border-rule">
                    <Link
                      href={href}
                      className="flex min-h-touch items-center font-sans text-ui-s text-type-secondary hover:text-signal active:text-signal"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Rule className="mt-12" />
        <div className="pt-6 lg:flex lg:items-start lg:justify-between">
          <div>
            <Hatch className="text-[28px] leading-none text-type-primary" />
            <p className="mt-2 max-w-tight font-serif text-ui-s text-type-secondary">
              Curated hackathons, case competitions and workshops for Indian college students.
              Every event is reviewed by a person before it goes live.
            </p>
          </div>

          <address className="mt-6 not-italic lg:mt-0 lg:text-right">
            <a
              href="mailto:hatch@hatchevent.in"
              className="block font-sans text-ui-s text-type-secondary rule-underline"
            >
              hatch@hatchevent.in
            </a>
            <a
              href="tel:+917892676997"
              data-mono
              className="block text-mono text-type-secondary hover:text-signal"
            >
              +91 7892676997
            </a>
            <span className="mt-2 block font-sans text-ui-s text-type-muted">
              Chamrajapete, Bengaluru South, Karnataka 560018
            </span>
          </address>
        </div>

        <p className="mt-8 font-sans text-ui-s text-type-muted">
          <span data-mono className="text-mono">
            {new Date().getFullYear()}
          </span>{' '}
          <Hatch />. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
