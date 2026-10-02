/**
 * The icon set. Drawn in-repo, no package.
 *
 * 20x20 viewBox, stroke-width 1, square caps, mitered joins, currentColor,
 * no fill. Square caps and mitered joins are the point: every corner in this
 * design system is square, and the icons follow.
 *
 * This replaces @heroicons/react entirely. There is deliberately no sparkle
 * glyph: it is on the banned list, so everything that reached for one uses
 * `bolt` instead.
 *
 * Need another? Draw it here. Do not install an icon library.
 */

export type GlyphName =
  | 'calendar'
  | 'clock'
  | 'pin'
  | 'link-out'
  | 'lock'
  | 'check'
  | 'cross'
  | 'chevron'
  | 'chevron-right'
  | 'chevron-left'
  | 'search'
  | 'filter'
  | 'upload'
  | 'download'
  | 'user'
  | 'users'
  | 'eye'
  | 'eye-off'
  | 'pencil'
  | 'trash'
  | 'tag'
  | 'bolt'
  | 'photo'
  | 'mail'
  | 'phone'
  | 'rupee'
  | 'card'
  | 'trophy'
  | 'star'
  | 'share'
  | 'plus'
  | 'minus'
  | 'info'
  | 'gift'
  | 'warning'
  | 'clipboard'
  | 'chart'
  | 'refresh'
  | 'cap'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'

const paths: Record<GlyphName, React.ReactNode> = {
  calendar: (
    <>
      <path d="M3 5h14v12H3z" />
      <path d="M3 9h14" />
      <path d="M7 3v4M13 3v4" />
    </>
  ),
  clock: (
    <>
      <path d="M10 3 17 10 10 17 3 10z" />
      <path d="M10 6.5V10h3" />
    </>
  ),
  pin: (
    <>
      <path d="M10 2 15 8l-5 10L5 8z" />
      <path d="M8 8h4" />
    </>
  ),
  'link-out': (
    <>
      <path d="M11 3h6v6" />
      <path d="M17 3 9 11" />
      <path d="M15 12v5H3V5h5" />
    </>
  ),
  lock: (
    <>
      <path d="M4 9h12v9H4z" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  check: <path d="M3 10.5 7.5 15 17 5.5" />,
  cross: (
    <>
      <path d="M4 4l12 12" />
      <path d="M16 4L4 16" />
    </>
  ),
  chevron: <path d="M6 8l4 4 4-4" />,
  'chevron-right': <path d="M8 6l4 4-4 4" />,
  'chevron-left': <path d="M12 6l-4 4 4 4" />,
  search: (
    <>
      <path d="M3 3h10v10H3z" />
      <path d="M13 13l4 4" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h14" />
      <path d="M5 10h10" />
      <path d="M8 15h4" />
    </>
  ),
  upload: (
    <>
      <path d="M10 15V4" />
      <path d="M5.5 8.5 10 4l4.5 4.5" />
      <path d="M3 17h14" />
    </>
  ),
  download: (
    <>
      <path d="M10 4v11" />
      <path d="M5.5 10.5 10 15l4.5-4.5" />
      <path d="M3 17h14" />
    </>
  ),
  user: (
    <>
      <path d="M5 7h10v6H5z" />
      <path d="M2 18v-2h16v2" />
    </>
  ),
  users: (
    <>
      <path d="M3 6h7v5H3z" />
      <path d="M11 8h6v4h-6z" />
      <path d="M1 17v-2h11v2" />
      <path d="M13 17v-2h6v2" />
    </>
  ),
  eye: (
    <>
      <path d="M1 10 10 4l9 6-9 6z" />
      <path d="M8 10h4" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M1 10 10 4l9 6-9 6z" />
      <path d="M3 3l14 14" />
    </>
  ),
  pencil: (
    <>
      <path d="M13 3l4 4L7 17H3v-4z" />
      <path d="M11 5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6h12" />
      <path d="M5 6l1 11h8l1-11" />
      <path d="M8 3h4v3H8z" />
    </>
  ),
  tag: (
    <>
      <path d="M3 3h7l7 7-7 7-7-7z" />
      <path d="M6 6h1v1H6z" />
    </>
  ),
  bolt: <path d="M11 2 4 11h5l-1 7 7-9h-5z" />,
  photo: (
    <>
      <path d="M3 4h14v12H3z" />
      <path d="M3 13l4-4 3 3 3-3 4 4" />
    </>
  ),
  mail: (
    <>
      <path d="M2 5h16v10H2z" />
      <path d="M2 5l8 6 8-6" />
    </>
  ),
  phone: (
    <>
      <path d="M6 2h8v16H6z" />
      <path d="M9 15h2" />
    </>
  ),
  rupee: (
    <>
      <path d="M6 3h8" />
      <path d="M6 7h8" />
      <path d="M6 3c4 0 4 7 0 7h2l5 7" />
    </>
  ),
  card: (
    <>
      <path d="M2 5h16v10H2z" />
      <path d="M2 8h16" />
      <path d="M5 12h3" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 3h8v5a4 4 0 0 1-8 0z" />
      <path d="M6 4H3v2l3 2M14 4h3v2l-3 2" />
      <path d="M10 12v3M7 18h6v-3H7z" />
    </>
  ),
  star: <path d="M10 2l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L10 14.7 4.9 17.4 6 11.8 2 7.9l5.6-.7z" />,
  share: (
    <>
      <path d="M10 13V3" />
      <path d="M6 7l4-4 4 4" />
      <path d="M4 11v6h12v-6" />
    </>
  ),
  plus: (
    <>
      <path d="M10 4v12" />
      <path d="M4 10h12" />
    </>
  ),
  minus: <path d="M4 10h12" />,
  info: (
    <>
      <path d="M10 2 18 10l-8 8-8-8z" />
      <path d="M10 9v5" />
      <path d="M10 6.5v1" />
    </>
  ),
  gift: (
    <>
      <path d="M2 7h16v4H2z" />
      <path d="M3 11h14v7H3z" />
      <path d="M10 7v11" />
    </>
  ),
  warning: (
    <>
      <path d="M10 2 19 18H1z" />
      <path d="M10 8v5" />
      <path d="M10 15v1" />
    </>
  ),
  clipboard: (
    <>
      <path d="M5 4h10v14H5z" />
      <path d="M8 2h4v3H8z" />
      <path d="M8 9h4M8 12h4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 17V3" />
      <path d="M3 17h14" />
      <path d="M6 14V9M10 14V5M14 14v-7" />
    </>
  ),
  refresh: (
    <>
      <path d="M17 10a7 7 0 1 1-2-5" />
      <path d="M15 1v4h-4" />
    </>
  ),
  cap: (
    <>
      <path d="M1 7l9-4 9 4-9 4z" />
      <path d="M5 9v5c0 1 2 2 5 2s5-1 5-2V9" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M17 10H3" />
      <path d="M8 5l-5 5 5 5" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M3 10h14" />
      <path d="M12 5l5 5-5 5" />
    </>
  ),
  'arrow-up-right': (
    <>
      <path d="M5 15 15 5" />
      <path d="M7 5h8v8" />
    </>
  ),
}

/**
 * `name` is widened to string because glyph names routinely arrive from config
 * arrays, where TypeScript infers `string` rather than the literal. An unknown
 * name renders `info` instead of crashing: a missing icon is never worth a
 * blank screen.
 */
export function Glyph({
  name,
  size = 20,
  className = '',
  label,
}: {
  name: GlyphName | (string & {})
  size?: number
  className?: string
  /** Omit for decorative glyphs: they are then hidden from assistive tech. */
  label?: string
}) {
  const path = paths[name as GlyphName] ?? paths.info
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {path}
    </svg>
  )
}

export default Glyph
