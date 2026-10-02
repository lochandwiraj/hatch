'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NumberRoll } from '@/components/ui/NumberRoll'
import { TIER_PRICING, formatRupees, normalizeUserTier, type Tier } from '@/lib/tier'

/**
 * The tier comparison. Replaces three pricing cards side by side.
 *
 * Three equal columns of cards is the banned shape, and it is also the wrong
 * one: these tiers differ by a handful of values, so the honest form is a
 * comparison table where each row is a capability and the eye runs across it.
 *
 * Presence is a filled square, absence an outline. No checkmarks anywhere.
 *
 * Phone: one tier per screen on a native scroll-snap rail, with the rows
 * aligned so swiping compares like against like. Laptop: one table.
 */

const TIERS: { id: Tier; name: string; note: string }[] = [
  { id: 'free', name: 'Free', note: 'Start here' },
  { id: 'basic_99', name: 'Explorer', note: 'More room each month' },
  { id: 'premium_149', name: 'Professional', note: 'Every event' },
]

/**
 * Rows state only what the database can back:
 * the monthly attendance cap (free 5, Explorer 10, Professional highest),
 * visibility by required_tier, and the manual event allowance.
 */
const ROWS: { label: string; values: Record<Tier, string | boolean> }[] = [
  {
    label: 'Events per month',
    values: { free: '5', basic_99: '10', premium_149: 'Highest' },
  },
  {
    label: 'Free-tier listings',
    values: { free: true, basic_99: true, premium_149: true },
  },
  {
    label: 'Explorer listings',
    values: { free: false, basic_99: true, premium_149: true },
  },
  {
    label: 'Professional listings',
    values: { free: false, basic_99: false, premium_149: true },
  },
  {
    label: 'Manually added events',
    values: { free: '2', basic_99: 'Unlimited', premium_149: 'Unlimited' },
  },
]

function Mark({ on }: { on: boolean }) {
  return (
    <span
      role="img"
      aria-label={on ? 'included' : 'not included'}
      className={`inline-block h-3 w-3 border ${on ? 'border-signal bg-signal' : 'border-rule-strong'}`}
    />
  )
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') return <Mark on={value} />
  return (
    <span data-mono className="text-mono text-type-primary">
      {value}
    </span>
  )
}

export function TierLedger({
  currentTier,
  onChoose,
}: {
  currentTier?: string | null
  onChoose?: (tier: Tier, annual: boolean) => void
}) {
  const [annual, setAnnual] = useState(false)
  const current = currentTier ? normalizeUserTier(currentTier) : null

  const price = (t: Tier) => (annual ? TIER_PRICING[t].annual : TIER_PRICING[t].monthly)

  return (
    <div>
      {/* Billing cycle. The price row rolls rather than swapping. */}
      <div className="mb-6 inline-flex border border-rule" role="group" aria-label="Billing cycle">
        {[
          { label: 'Monthly', on: !annual },
          { label: 'Annual', on: annual },
        ].map(({ label, on }) => (
          <button
            key={label}
            type="button"
            onClick={() => setAnnual(label === 'Annual')}
            aria-pressed={on}
            className={`min-h-touch px-4 py-2 font-sans text-ui-s ${
              on ? 'bg-signal text-ink' : 'text-type-secondary hover:text-type-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Laptop: one table. */}
      <table className="hidden w-full border-collapse text-left lg:table">
        <caption className="sr-only">Monthly limits, access and price by tier</caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="py-3 font-sans text-label uppercase text-type-muted">
              Capability
            </th>
            {TIERS.map((t) => (
              <th
                key={t.id}
                scope="col"
                className={`py-3 ${current === t.id ? 'border-x-2 border-t-2 border-signal' : ''}`}
              >
                <span className="block px-3 font-display text-title uppercase text-type-primary">{t.name}</span>
                <span className="block px-3 font-sans text-ui-s text-type-muted">{t.note}</span>
                {current === t.id ? (
                  <span data-mono className="block px-3 text-mono text-signal">
                    current
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-rule">
            <th scope="row" className="py-4 font-sans text-ui-s text-type-secondary">
              {annual ? 'Price per year' : 'Price per month'}
            </th>
            {TIERS.map((t) => (
              <td key={t.id} className={`px-3 py-4 ${current === t.id ? 'border-x-2 border-signal' : ''}`}>
                <NumberRoll mono={false} value={formatRupees(price(t.id))} className="font-display text-mono-l text-type-primary" />
                {annual && TIER_PRICING[t.id].saving > 0 ? (
                  <span data-mono className="mt-1 block text-mono text-verified">
                    saves {formatRupees(TIER_PRICING[t.id].saving)}
                  </span>
                ) : null}
              </td>
            ))}
          </tr>

          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-rule">
              <th scope="row" className="py-3 font-sans text-ui-s text-type-secondary">
                {row.label}
              </th>
              {TIERS.map((t) => (
                <td key={t.id} className={`px-3 py-3 ${current === t.id ? 'border-x-2 border-signal' : ''}`}>
                  <Cell value={row.values[t.id]} />
                </td>
              ))}
            </tr>
          ))}

          <tr>
            <td />
            {TIERS.map((t) => (
              <td key={t.id} className={`px-3 pt-4 ${current === t.id ? 'border-x-2 border-b-2 border-signal' : ''}`}>
                {current === t.id ? (
                  <span className="flex min-h-touch w-full items-center justify-center border border-rule font-sans text-ui-s text-type-muted">Your tier</span>
                ) : t.id === 'free' ? (
                  <Link
                    href="/auth"
                    className="flex min-h-touch w-full items-center justify-center border border-rule-strong px-4 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal"
                  >
                    Start free
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onChoose?.(t.id, annual)}
                    className="flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-2 font-sans text-ui-s text-ink hover:bg-ink hover:text-signal"
                  >
                    Choose {t.name}
                  </button>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Phone: one tier per screen, snapped, rows in the same order. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 lg:hidden">
        {TIERS.map((t) => (
          <section
            key={t.id}
            aria-label={t.name}
            className={`w-[80%] shrink-0 snap-center border p-4 ${
              current === t.id ? 'border-2 border-signal' : 'border-rule'
            }`}
          >
            <h3 className="font-display text-title uppercase text-type-primary">{t.name}</h3>
            <p className="font-sans text-ui-s text-type-muted">{t.note}</p>
            {current === t.id ? (
              <p data-mono className="text-mono text-signal">
                current
              </p>
            ) : null}

            <p className="mt-4 border-t border-rule pt-4">
              <NumberRoll mono={false} value={formatRupees(price(t.id))} className="font-display text-mono-l text-type-primary" />
              <span data-mono className="ml-1 text-mono text-type-secondary">
                {annual ? '/year' : '/month'}
              </span>
            </p>
            {annual && TIER_PRICING[t.id].saving > 0 ? (
              <p data-mono className="text-mono text-verified">
                saves {formatRupees(TIER_PRICING[t.id].saving)}
              </p>
            ) : null}

            <dl className="mt-4 border-t border-rule">
              {ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-rule py-3">
                  <dt className="font-sans text-ui-s text-type-secondary">{row.label}</dt>
                  <dd>
                    <Cell value={row.values[t.id]} />
                  </dd>
                </div>
              ))}
            </dl>

            {current === t.id ? null : t.id === 'free' ? (
              <Link
                href="/auth"
                className="mt-4 flex min-h-touch items-center justify-center border border-rule-strong px-4 py-3 font-sans text-ui text-type-primary active:border-signal active:text-signal"
              >
                Start free
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onChoose?.(t.id, annual)}
                className="mt-4 flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui text-ink active:bg-ink active:text-signal"
              >
                Choose {t.name}
              </button>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export default TierLedger
