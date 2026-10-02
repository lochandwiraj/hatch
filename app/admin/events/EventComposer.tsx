'use client'

import { useId, useMemo, useState } from 'react'
import { Overlay } from '@/components/ui/Overlay'
import { Glyph } from '@/components/ui/Glyph'
import { Button } from '@/components/ui/Button'
import { RowBody } from '@/components/events/EventRow'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { Tables } from '@/lib/supabase'

type Event = Tables<'events'>

/**
 * The event composer.
 *
 * The old version was a 672px box with every field stacked in one column and
 * its only exit — a text link reading "Cancel" — parked below a 90vh scroll.
 * Opening it by accident meant reloading the page: it bypassed Overlay, so
 * Escape did nothing, the scrim did nothing, and focus was never trapped.
 *
 * Now it is a full-bleed composer. The way out is the first thing in the tab
 * order and stays pinned while the form scrolls; Escape and the scrim both
 * close it, and anything typed is confirmed before it is thrown away.
 *
 * The right column earns its place: it renders the row through the same
 * component the public index uses, so what an admin sees while typing is
 * literally what a student will see, and a readiness ledger names the fields
 * still missing instead of waiting for the browser to reject the submit.
 */

const CATEGORIES = ['Hackathon', 'Networking', 'Conference', 'Webinar', 'Other']
const MODES = ['Online', 'Offline', 'Hybrid']
const TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'basic_99', label: 'Explorer (₹99)' },
  { value: 'premium_149', label: 'Professional (₹149)' },
] as const

const field =
  'mt-2 block min-h-touch w-full border border-rule bg-ink-sunken px-3 py-2 font-sans text-ui ' +
  'text-type-primary placeholder-type-muted focus:border-rule-strong focus:outline-none'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block font-sans text-label uppercase text-type-muted">
      {children}
      {required ? (
        <span className="ml-1 text-signal" aria-hidden>
          required
        </span>
      ) : null}
    </span>
  )
}

/** One ruled group of fields. The form reads as sections, not one long column. */
function Group({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule-strong pt-6">
      <div className="flex items-baseline gap-3">
        <span data-mono className="text-mono text-type-muted">
          {step}
        </span>
        <h3 className="font-display text-title uppercase text-type-primary">{title}</h3>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

export function EventComposer({
  event,
  onClose,
  onSave,
}: {
  event?: Event | null
  onClose: () => void
  onSave: () => void
}) {
  const titleId = useId()
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_link: event?.event_link || '',
    poster_image_url: event?.poster_image_url || '',
    category: event?.category || '',
    tags: event?.tags?.join(', ') || '',
    event_date: event?.event_date?.split('T')[0] || '',
    event_time: event?.event_time || '10:00',
    registration_deadline: event?.registration_deadline?.split('T')[0] || '',
    required_tier: (event?.required_tier || 'free') as 'free' | 'basic_99' | 'premium_149',
    status: (event?.status || 'draft') as 'draft' | 'published',
    is_early_access: event?.is_early_access || false,
    organizer: event?.organizer || '',
    prize_pool: event?.prize_pool || '',
    mode: event?.mode || '',
    eligibility: event?.eligibility || '',
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setDirty(true)
    setForm((p) => ({ ...p, [key]: value }))
  }

  // What still blocks a save, named while typing rather than on submit.
  const missing = useMemo(() => {
    const required: [string, unknown][] = [
      ['Title', form.title],
      ['Description', form.description],
      ['Organizer', form.organizer],
      ['Category', form.category],
      ['Date', form.event_date],
      ['Time', form.event_time],
      ['Mode', form.mode],
    ]
    return required.filter(([, v]) => !String(v ?? '').trim()).map(([k]) => k)
  }, [form])

  const ready = missing.length === 0

  /** Closing throws away typed work, so it is confirmed — but only if there is any. */
  const requestClose = () => {
    if (dirty && !window.confirm('Discard this event? Anything you typed will be lost.')) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_link: form.event_link,
        poster_image_url: form.poster_image_url || null,
        category: form.category,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        registration_deadline: form.registration_deadline
          ? new Date(form.registration_deadline).toISOString()
          : null,
        required_tier: form.required_tier,
        status: form.status,
        is_early_access: form.is_early_access,
        organizer: form.organizer,
        prize_pool: form.prize_pool || null,
        mode: form.mode,
        eligibility: form.eligibility || null,
      }
      const { error } = event
        ? await supabase.from('events').update(payload).eq('id', event.id)
        : await supabase.from('events').insert([payload])
      if (error) throw error
      toast.success(event ? 'Event updated.' : 'Event created.')
      setDirty(false)
      onSave()
    } catch {
      toast.error(`Could not ${event ? 'update' : 'create'} the event.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Overlay
      open
      onClose={requestClose}
      labelledBy={titleId}
      className="h-full w-full lg:h-[94vh] lg:w-[min(1400px,94vw)]"
    >
      <div className="flex h-full flex-col border border-rule-strong bg-ink">
        {/* The way out, pinned. First in the tab order and never scrolled away. */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-rule px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={requestClose}
              className="inline-flex min-h-touch items-center gap-2 border border-rule-strong px-3 py-2 font-sans text-ui-s text-type-primary hover:border-signal hover:text-signal active:border-signal active:text-signal"
            >
              <Glyph name="arrow-left" size={14} />
              Back
            </button>
            <div>
              <p data-mono className="text-mono text-type-muted">
                {event ? 'editing' : 'new'}
              </p>
              <h2 id={titleId} className="font-display text-title uppercase text-type-primary">
                {event ? 'Edit event' : 'Add event'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {dirty ? (
              <span data-mono className="text-mono text-deadline">
                unsaved
              </span>
            ) : null}
            <span className="hidden font-sans text-ui-s text-type-muted lg:inline">
              Press Esc to close
            </span>
          </div>
        </header>

        {/* The live row, pinned at full width.
            RowBody lays out as a five-column table row above lg and needs about
            570px; inside a 352px sidebar its columns collapsed on top of each
            other and the title overlapped the category. Full width is also the
            honest width, because this is exactly how the index renders it. */}
        <div className="shrink-0 border-b border-rule px-4 py-4 lg:px-8">
          <p className="font-sans text-label uppercase text-type-muted">As students will see it</p>
          <div className="mt-3">
            <RowBody
              event={{
                id: 'preview',
                title: form.title || 'Untitled event',
                organizer: form.organizer || null,
                category: form.category || null,
                mode: form.mode || null,
                event_date: form.event_date || null,
                registration_deadline: form.registration_deadline || null,
                prize_pool: form.prize_pool || null,
                required_tier: form.required_tier,
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <form id="event-composer" onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="space-y-8 lg:col-span-8">
              <Group step="01" title="The event">
                <label className="md:col-span-2">
                  <Label required>Title</Label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="The full name, exactly as the organizer writes it"
                    className={field}
                  />
                </label>
                <label className="md:col-span-2">
                  <Label required>Description</Label>
                  <textarea
                    required
                    rows={5}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="What it is, who it is for, and what a student gets out of it."
                    className={`${field} resize-y`}
                  />
                </label>
              </Group>

              <Group step="02" title="Who and what">
                <label>
                  <Label required>Organizer</Label>
                  <input
                    type="text"
                    required
                    value={form.organizer}
                    onChange={(e) => set('organizer', e.target.value)}
                    placeholder="The college, club or company running it"
                    className={field}
                  />
                </label>
                <label>
                  <Label required>Category</Label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className={field}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <Label required>Mode</Label>
                  <select
                    required
                    value={form.mode}
                    onChange={(e) => set('mode', e.target.value)}
                    className={field}
                  >
                    <option value="">Select mode</option>
                    {MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <Label>Eligibility</Label>
                  <input
                    type="text"
                    value={form.eligibility}
                    onChange={(e) => set('eligibility', e.target.value)}
                    placeholder="Open to all students"
                    className={field}
                  />
                </label>
              </Group>

              <Group step="03" title="When">
                <label>
                  <Label required>Date</Label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => set('event_date', e.target.value)}
                    className={field}
                  />
                </label>
                <label>
                  <Label required>Time</Label>
                  <input
                    type="time"
                    required
                    value={form.event_time}
                    onChange={(e) => set('event_time', e.target.value)}
                    className={field}
                  />
                </label>
                <label className="md:col-span-2">
                  <Label>Registration deadline</Label>
                  <input
                    type="date"
                    value={form.registration_deadline}
                    onChange={(e) => set('registration_deadline', e.target.value)}
                    className={field}
                  />
                  <span className="mt-1 block font-sans text-ui-s text-type-muted">
                    Leave empty if there is no cut-off. A past date reads as closed.
                  </span>
                </label>
              </Group>

              <Group step="04" title="Access">
                <div className="md:col-span-2">
                  <Label required>Required tier</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TIERS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={form.required_tier === t.value}
                        onClick={() => set('required_tier', t.value)}
                        className={`min-h-touch border px-3 py-2 font-sans text-ui-s ${
                          form.required_tier === t.value
                            ? 'border-signal bg-signal text-ink'
                            : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Visibility</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['draft', 'published'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={form.status === s}
                        onClick={() => set('status', s)}
                        className={`min-h-touch border px-3 py-2 font-sans text-ui-s capitalize ${
                          form.status === s
                            ? 'border-signal bg-signal text-ink'
                            : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <label className="ml-2 inline-flex min-h-touch items-center gap-2 font-sans text-ui-s text-type-secondary">
                      <input
                        type="checkbox"
                        checked={form.is_early_access}
                        onChange={(e) => set('is_early_access', e.target.checked)}
                        style={{ accentColor: 'var(--signal)' }}
                      />
                      Early access
                    </label>
                  </div>
                  <span className="mt-2 block font-sans text-ui-s text-type-muted">
                    {form.status === 'published'
                      ? 'Published events are visible to every student immediately.'
                      : 'Drafts stay hidden until you publish them.'}
                  </span>
                </div>

                <label>
                  <Label>Prize pool</Label>
                  <input
                    type="text"
                    value={form.prize_pool}
                    onChange={(e) => set('prize_pool', e.target.value)}
                    placeholder="₹50,000"
                    className={field}
                  />
                </label>
                <label>
                  <Label>Tags</Label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => set('tags', e.target.value)}
                    placeholder="React, Frontend, AI"
                    className={field}
                  />
                </label>
                <label className="md:col-span-2">
                  <Label>Event link</Label>
                  <input
                    type="url"
                    value={form.event_link}
                    onChange={(e) => set('event_link', e.target.value)}
                    placeholder="https://"
                    className={field}
                  />
                </label>
              </Group>
            </div>

            {/* What is still missing, tracked while typing. */}
            <aside className="mt-12 lg:col-span-3 lg:col-start-10 lg:mt-0 lg:sticky lg:top-0 lg:self-start">
              <p className="border-b border-rule-strong pb-2 font-sans text-label uppercase text-type-muted">
                Before it can be saved
              </p>
              {ready ? (
                <p className="flex items-baseline gap-2 border-b border-rule py-3 font-sans text-ui-s text-verified">
                  <Glyph name="check" size={14} />
                  Everything required is filled in.
                </p>
              ) : (
                <ul>
                  {missing.map((m) => (
                    <li
                      key={m}
                      className="flex items-baseline justify-between gap-4 border-b border-rule py-2"
                    >
                      <span className="font-sans text-ui-s text-type-secondary">{m}</span>
                      <span data-mono className="text-mono text-deadline">
                        missing
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </form>
        </div>

        {/* Actions, pinned. The second way out lives here. */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 lg:px-8">
          <span data-mono className="text-mono text-type-muted">
            {ready ? 'ready' : `${missing.length} field${missing.length === 1 ? '' : 's'} left`}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form="event-composer" variant="primary" loading={saving} disabled={!ready}>
              {saving ? 'Saving' : event ? 'Save changes' : 'Create event'}
            </Button>
          </div>
        </footer>
      </div>
    </Overlay>
  )
}

export default EventComposer
