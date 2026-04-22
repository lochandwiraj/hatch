import './globals.css'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AttendanceConfirmationProvider from '@/components/events/AttendanceConfirmationProvider'
import CompleteProfileModal from '@/components/auth/CompleteProfileModal'
import Footer from '@/components/layout/Footer'
import Script from 'next/script'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hatchevent.in'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HATCH — Stop Searching. Start Discovering.',
    template: '%s — HATCH',
  },
  description: 'Discover hackathons, case competitions & workshops for Indian college students. Curated from 50+ sources weekly. 200+ events. Free to start.',
  icons: {
    icon: '/HATCHsquare.png',
    apple: '/HATCHsquare.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'HATCH',
    title: 'HATCH — Stop Searching. Start Discovering.',
    description: 'Discover hackathons, case competitions & workshops for Indian college students. Curated from 50+ sources weekly.',
    url: SITE_URL,
    images: [{ url: '/HATCHsquare.png', width: 1024, height: 1024, alt: 'HATCH — Student Event Discovery' }],
  },
  twitter: {
    card: 'summary',
    title: 'HATCH — Stop Searching. Start Discovering.',
    description: 'Discover hackathons, case competitions & workshops for Indian college students. Curated from 50+ sources weekly.',
    images: ['/HATCHsquare.png'],
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HATCH',
  url: SITE_URL,
  logo: `${SITE_URL}/HATCHsquare.png`,
  description: 'Curated hackathons, competitions and workshops for Indian college students.',
  contactPoint: { '@type': 'ContactPoint', email: 'hatch0258@gmail.com', telephone: '+91-7892676997', contactType: 'customer support' },
  address: { '@type': 'PostalAddress', streetAddress: '#165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete', addressLocality: 'Bengaluru South', addressRegion: 'Karnataka', postalCode: '560018', addressCountry: 'IN' },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HATCH',
  url: SITE_URL,
  description: 'Discover hackathons, case competitions and workshops for Indian college students.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/events?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <link rel="preload" href="/fonts/qephomodern-regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body className={plusJakartaSans.className}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-R99ZV6SD91" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-R99ZV6SD91');
        `}</Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <AuthProvider>
          <CompleteProfileModal />
          <AttendanceConfirmationProvider>
            {children}
            <Footer />
          </AttendanceConfirmationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(13, 13, 20, 0.95)',
                color: '#fafafa',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                backdropFilter: 'blur(12px)',
                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              },
              success: { iconTheme: { primary: '#8b5cf6', secondary: '#fafafa' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
