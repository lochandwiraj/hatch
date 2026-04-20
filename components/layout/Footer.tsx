import Link from 'next/link'

const links = {
  Legal: [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Refund Policy', href: '/refund' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ],
  Platform: [
    { label: 'Events', href: '/events' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
}

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,10,0.95)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-qepho text-xl text-white hover:opacity-80 transition-opacity">
              HATCH
            </Link>
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed max-w-[180px]">
              Curated student events. Stop searching, start discovering.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{group}</p>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} HATCH. All rights reserved.</p>
          <p className="text-xs text-zinc-600">
            Support:{' '}
            <a href="mailto:hatch0258@gmail.com" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              hatch0258@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
