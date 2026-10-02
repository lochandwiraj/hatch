'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, EASE, prefersReducedMotion } from '@/lib/motion'
import { DataPlate } from './DataPlate'
import type { EventRowData } from './EventRow'

/**
 * Behaviour 3. The Rail.
 *
 * A horizontal register of the real events.
 *
 * PHONE is the primary version, not a fallback: native CSS scroll-snap on the
 * x axis, one plate per viewport, momentum intact, and an IntersectionObserver
 * marks the centred plate active. That is the whole phone implementation, and
 * it needs no GSAP at all.
 *
 * LAPTOP uses the same DOM and the same snap container, and additionally lets
 * ScrollTrigger advance the rail horizontally while the section is pinned. The
 * pin lasts exactly the rail's overflow width, so it unpins clean.
 *
 * Under reduced motion the scroll-snap stays, because it is user-driven, and
 * only the pinned scrub is dropped.
 */
export function EventRail({ events }: { events: EventRowData[] }) {
  const section = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(events[0]?.id ?? null)

  // Active plate detection. Identical on both, and the only JS the phone needs.
  useEffect(() => {
    const el = track.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const centred = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (centred) setActiveId((centred.target as HTMLElement).dataset.eventId ?? null)
      },
      { root: el, threshold: [0.5, 0.75, 1], rootMargin: '0px -40% 0px -40%' }
    )
    el.querySelectorAll('[data-event-id]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [events.length])

  useGSAP(
    () => {
      registerGsap()
      if (prefersReducedMotion()) return
      if (window.matchMedia('(max-width: 1023px)').matches) return // phone and tablet: snap only

      const sec = section.current
      const tr = track.current
      if (!sec || !tr) return

      const distance = () => Math.max(0, tr.scrollWidth - tr.clientWidth)
      if (distance() <= 0) return

      const tween = gsap.to(tr, {
        scrollLeft: distance,
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { scope: section, dependencies: [events.length] }
  )

  if (events.length === 0) return null

  return (
    <section ref={section} aria-labelledby="rail-heading" className="border-b border-rule py-12 lg:py-16">
      <div className="flex items-baseline justify-between">
        <h2 id="rail-heading" className="font-display text-display-m text-type-primary">
          The register
        </h2>
        <span data-mono className="text-mono text-type-secondary">
          {events.length} open
        </span>
      </div>

      <div
        ref={track}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:gap-6"
        style={{ scrollbarWidth: 'thin' }}
      >
        {events.map((e) => {
          const active = e.id === activeId
          return (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              data-event-id={e.id}
              className={`w-[78%] shrink-0 snap-center md:w-[46%] lg:w-[30%] ${
                active ? 'opacity-100' : 'opacity-70'
              }`}
              style={{ transition: `opacity var(--dur-state) var(--ease-enter)` }}
            >
              <DataPlate
                date={e.event_date}
                category={e.category}
                organizer={e.organizer}
                requiredTier={e.required_tier}
                active={active}
              />
              <p className="mt-3 font-display text-title uppercase text-type-primary">{e.title}</p>
            </Link>
          )
        })}
      </div>

      <p data-mono className="mt-2 text-mono text-type-muted lg:hidden">
        swipe
      </p>
    </section>
  )
}

export default EventRail
