import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hatchevent.in'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: event } = await supabase
    .from('events')
    .select('title, description, category, organizer, event_date, mode, poster_image_url')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'This event could not be found on HATCH.',
      robots: { index: false },
    }
  }

  const base = event.description.length > 120
    ? event.description.slice(0, 120).trimEnd() + '…'
    : event.description

  const description = `${base} — ${event.category} by ${event.organizer}. ${event.mode} event on HATCH.`
    .slice(0, 160)

  const image = event.poster_image_url ?? `${SITE_URL}/HATCHsquare.png`

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${params.id}` },
    openGraph: {
      title: `${event.title} — HATCH`,
      description: base,
      type: 'website',
      url: `${SITE_URL}/events/${params.id}`,
      images: [{ url: image, alt: event.title }],
    },
    twitter: {
      card: event.poster_image_url ? 'summary_large_image' : 'summary',
      title: `${event.title} — HATCH`,
      description: base,
      images: [image],
    },
  }
}

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
