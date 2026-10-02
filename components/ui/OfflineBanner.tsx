'use client'

import { useEffect, useState } from 'react'

/**
 * The offline state.
 *
 * Every page on HATCH reads from Supabase, so losing the network means the
 * event index, the dashboard and the attendance cap all silently stop being
 * true. Say so rather than showing stale data as if it were live.
 *
 * Mounted once in the root layout. A live region, so it is announced.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="assertive"
      className="sticky top-0 z-[60] border-b border-deadline bg-ink-raised px-4 py-2"
    >
      <p className="mx-auto max-w-[1440px] font-sans text-ui-s text-deadline">
        <span data-mono className="text-mono">
          offline
        </span>{' '}
        You are not connected. Nothing on this page is updating, and anything you submit will fail
        until the connection returns.
      </p>
    </div>
  )
}
