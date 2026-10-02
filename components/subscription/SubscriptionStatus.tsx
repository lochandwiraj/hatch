'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { NumberRoll } from '@/components/ui/NumberRoll'
import { normalizeUserTier, tierName, TIER_PRICING, formatRupees } from '@/lib/tier'

/**
 * The subscription state, as section 6 specifies it: current tier, expiry
 * date, days remaining as a mono countdown, and what happens at expiry stated
 * in words rather than implied.
 *
 * This file was empty. It was listed in the inventory and imported nowhere,
 * so nothing ever revealed that it had no contents.
 *
 * The expiry language matters: subscription-expiration-checker runs server
 * side and will act on auto_downgrade_enabled whether or not the UI mentions
 * it, so the UI mentions it.
 */
export function SubscriptionStatus() {
  const { profile } = useAuth()
  if (!profile) return null

  const tier = normalizeUserTier(profile.subscription_tier)
  const expires = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
  const valid = expires && !Number.isNaN(expires.getTime())
  const daysLeft = valid ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000)) : null
  const autoDowngrade = profile.auto_downgrade_enabled !== false

  return (
    <section aria-labelledby="sub-status" className="border border-rule">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule px-4 py-3">
        <h2 id="sub-status" className="font-display text-title uppercase text-type-primary">
          {tierName(tier)}
        </h2>
        {tier === 'free' ? (
          <span data-mono className="text-mono text-type-secondary">
            {formatRupees(0)}
          </span>
        ) : (
          <span data-mono className="text-mono text-type-secondary">
            {formatRupees(TIER_PRICING[tier].monthly)} / month
          </span>
        )}
      </div>

      <dl className="px-4">
        {valid ? (
          <>
            <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <dt className="font-sans text-ui-s text-type-secondary">Renews or expires on</dt>
              <dd>
                <time data-mono dateTime={expires.toISOString()} className="text-mono text-type-primary">
                  {expires.toISOString().slice(0, 10)}
                </time>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
              <dt className="font-sans text-ui-s text-type-secondary">Days remaining</dt>
              <dd>
                <NumberRoll
                  value={daysLeft ?? 0}
                  className={`text-mono-l ${
                    daysLeft !== null && daysLeft <= 7 ? 'text-deadline' : 'text-type-primary'
                  }`}
                />
              </dd>
            </div>
          </>
        ) : (
          <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
            <dt className="font-sans text-ui-s text-type-secondary">Expiry</dt>
            <dd className="font-sans text-ui-s text-type-muted">No end date on this tier</dd>
          </div>
        )}
      </dl>

      <div className="px-4 py-4">
        <p className="max-w-tight font-serif text-ui-s text-type-secondary">
          {tier === 'free'
            ? 'The free tier does not expire. Upgrading raises your monthly limit and unlocks higher-tier listings.'
            : autoDowngrade
              ? 'When this period ends your account returns to the free tier automatically, and your monthly limit drops with it. Nothing is charged again unless you renew.'
              : 'When this period ends your tier stays as it is until an administrator changes it.'}
        </p>

        {tier !== 'premium_149' ? (
          <Link
            href="/subscription/upgrade"
            className="mt-4 inline-flex min-h-touch items-center border border-signal bg-signal px-4 py-2 font-sans text-ui-s text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
          >
            Raise the limit
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export default SubscriptionStatus
