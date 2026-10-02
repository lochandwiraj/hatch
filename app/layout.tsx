import './globals.css'
import type { Metadata } from 'next'
import { Barlow_Condensed, Public_Sans, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import AppToaster from '@/components/ui/AppToaster'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AttendanceConfirmationProvider from '@/components/events/AttendanceConfirmationProvider'
import CompleteProfileModal from '@/components/auth/CompleteProfileModal'
import Footer from '@/components/layout/Footer'
import OfflineBanner from '@/components/ui/OfflineBanner'
import Script from 'next/script'

// Qepho is NOT loaded here. It is the brand face, self-hosted in globals.css,
// and applied only through the Hatch component. See components/brand/Hatch.tsx.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-barlow-condensed',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-public-sans',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-source-serif',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const fontVars = [
  barlowCondensed.variable,
  publicSans.variable,
  sourceSerif.variable,
  jetbrainsMono.variable,
].join(' ')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hatchevent.in'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HATCH, Stop Searching. Start Discovering.',
    template: '%s, HATCH',
  },
  description: 'Discover hackathons, case competitions and workshops for Indian college students. Every event is reviewed by a person before it goes live. Free to start.',
  icons: {
    icon: '/HATCHsquare.png',
    apple: '/HATCHsquare.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'HATCH',
    title: 'HATCH, Stop Searching. Start Discovering.',
    description: 'Discover hackathons, case competitions and workshops for Indian college students. Every event is reviewed by a person before it goes live.',
    url: SITE_URL,
    images: [{ url: '/HATCHsquare.png', width: 1024, height: 1024, alt: 'HATCH, Student Event Discovery' }],
  },
  twitter: {
    card: 'summary',
    title: 'HATCH, Stop Searching. Start Discovering.',
    description: 'Discover hackathons, case competitions and workshops for Indian college students. Every event is reviewed by a person before it goes live.',
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
  contactPoint: { '@type': 'ContactPoint', email: 'hatch@hatchevent.in', telephone: '+91-7892676997', contactType: 'customer support' },
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
    <html lang="en" className={fontVars}>
      <head>
        <link rel="preload" href="/fonts/qephomodern-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-R99ZV6SD91" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-R99ZV6SD91');
        `}</Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <OfflineBanner />
        <AuthProvider>
          <CompleteProfileModal />
          <AttendanceConfirmationProvider>
            {children}
            <Footer />
          </AttendanceConfirmationProvider>
          <AppToaster />
        </AuthProvider>
      </body>
    </html>
  )
}
