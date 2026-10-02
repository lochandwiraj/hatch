import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Events, Hackathons, Competitions & Workshops in India',
  description: 'Browse curated hackathons, case competitions, workshops and student events across India. Every event is reviewed by a person before it goes live. Free to start.',
  alternates: { canonical: '/events' },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
