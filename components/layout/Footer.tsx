import Link from 'next/link'

const links = {
  Legal: [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Delivery Policy', href: '/delivery' },
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
            <a
              href="https://www.linkedin.com/company/hatch-events-india/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="HATCH on LinkedIn"
              className="inline-flex items-center justify-center mt-4 w-8 h-8 rounded-lg text-zinc-500 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="space-y-1">
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} HATCH. All rights reserved.</p>
            <p className="text-xs text-zinc-700">#165 Beladingalu, 5th Main, Chamrajapete, Bengaluru, Karnataka – 560018</p>
          </div>
          <div className="flex items-center gap-3 text-xs shrink-0">
            <a href="mailto:hatch0258@gmail.com" className="text-zinc-500 hover:text-zinc-300 transition-colors">hatch0258@gmail.com</a>
            <span className="text-zinc-700">·</span>
            <a href="tel:+917892676997" className="text-zinc-500 hover:text-zinc-300 transition-colors">+91 78926 76997</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
