import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    /** Set by jspdf-autotable after each table. */
    lastAutoTable?: { finalY: number }
  }
}

interface AttendedEvent {
  event_title: string | null
  event_date: string | null
  event_time: string | null
  organizer: string | null
  category: string | null
  mode: string | null
  attended_at: string | null
  required_tier?: string | null
}

interface UserProfile {
  full_name: string | null
  username: string | null
  email: string | null
  college: string | null
  graduation_year: string | null
  subscription_tier: string | null
  created_at: string | null
}

const tierName = (tier: string | null) => {
  if (tier === 'basic_99') return 'Explorer'
  if (tier === 'premium_149') return 'Professional'
  return 'Free'
}

const filterByTier = (events: AttendedEvent[], tier: string | null) =>
  events.filter((e) => {
    const t = e.required_tier || 'free'
    if (tier === 'premium_149') return true
    if (tier === 'basic_99') return t === 'free' || t === 'basic_99'
    return t === 'free'
  })

/**
 * The attendance record, in the product's own language.
 *
 * It used to be a grey Helvetica document: zebra-striped table, a filled header
 * band, numbers set in the same face as everything else. It read like a
 * spreadsheet export from a different product.
 *
 * It now uses the light palette and the real faces. Barlow Condensed sets the
 * headings, Public Sans the prose, JetBrains Mono every figure and date, and
 * Qepho the wordmark and nothing else. Structure is rules, not fills, and
 * hierarchy comes from case, size and colour rather than weight — the same
 * decisions the screens make.
 *
 * Variable TTFs embed at their default instance, so Public Sans and JetBrains
 * Mono are Regular throughout and the single bold cut is Barlow Condensed.
 */

// The light theme, which is the one that belongs on paper.
const INK = [20, 17, 14] as [number, number, number] // --ink
const PAPER = [239, 235, 227] as [number, number, number] // --ink (light surface)
const SUNKEN = [245, 242, 236] as [number, number, number] // --ink-sunken
const PRIMARY = [20, 17, 14] as [number, number, number] // --type-primary
const SECONDARY = [92, 83, 71] as [number, number, number] // --type-secondary
const MUTED = [107, 99, 88] as [number, number, number] // --type-muted
const RULE = [205, 197, 182] as [number, number, number] // --rule
const RULE_STRONG = [168, 158, 140] as [number, number, number] // --rule-strong
const SIGNAL = [177, 61, 37] as [number, number, number] // --signal

const PAGE_W = 210
const PAGE_H = 297
const L = 18
const R = 192

type Face = 'display' | 'sans' | 'mono' | 'brand'

export const generateAttendanceReport = async (
  profile: UserProfile,
  attendedEvents: AttendedEvent[],
  stats: { total_registered: number; total_attended: number; attendance_rate: number }
) => {
  const events = filterByTier(attendedEvents, profile.subscription_tier)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  /** Embeds one TTF. Returns false rather than throwing, so a missing file
   *  costs a typeface and not the whole report. */
  const embed = async (url: string, vfs: string, name: string) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return false
      const bytes = new Uint8Array(await res.arrayBuffer())
      // Chunked and index-based: a 180KB font blows the argument limit of
      // String.fromCharCode, and spreading a Uint8Array needs downlevelIteration.
      let binary = ''
      const CHUNK = 8192
      for (let i = 0; i < bytes.length; i += CHUNK) {
        const end = Math.min(i + CHUNK, bytes.length)
        const parts: string[] = []
        for (let j = i; j < end; j++) parts.push(String.fromCharCode(bytes[j]))
        binary += parts.join('')
      }
      doc.addFileToVFS(vfs, btoa(binary))
      doc.addFont(vfs, name, 'normal')
      doc.setFont(name, 'normal')
      return true
    } catch {
      return false
    }
  }

  const has = {
    brand: await embed('/fonts/qephomodern-regular.ttf', 'Qepho.ttf', 'Qepho'),
    display: await embed('/fonts/barlow-condensed-bold.ttf', 'BarlowCondensed.ttf', 'BarlowCondensed'),
    sans: await embed('/fonts/public-sans.ttf', 'PublicSans.ttf', 'PublicSans'),
    mono: await embed('/fonts/jetbrains-mono.ttf', 'JetBrainsMono.ttf', 'JetBrainsMono'),
  }

  /** Falls back to a built-in of the same character, never to the wrong one. */
  const face = (f: Face) => {
    if (f === 'brand') return has.brand ? 'Qepho' : null
    if (f === 'display') return has.display ? 'BarlowCondensed' : 'helvetica'
    if (f === 'mono') return has.mono ? 'JetBrainsMono' : 'courier'
    return has.sans ? 'PublicSans' : 'helvetica'
  }

  const txt = (
    text: string,
    x: number,
    y: number,
    opts: {
      face?: Face
      size?: number
      color?: [number, number, number]
      align?: 'left' | 'right' | 'center'
      spacing?: number
    } = {}
  ) => {
    const { face: f = 'sans', size = 9, color = PRIMARY, align = 'left', spacing = 0 } = opts
    const resolved = face(f)
    if (!resolved) return
    doc.setFont(resolved, 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    if (spacing) doc.setCharSpace(spacing)
    doc.text(text, x, y, { align })
    if (spacing) doc.setCharSpace(0)
  }

  /** The wordmark. Qepho or nothing: a substituted wordmark is worse than none. */
  const wordmark = (size: number, x: number, y: number, color: [number, number, number]) => {
    if (!has.brand) return
    txt('HATCH', x, y, { face: 'brand', size, color })
  }

  const rule = (y: number, weight = 0.25, color = RULE, from = L, to = R) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(weight)
    doc.line(from, y, to, y)
  }

  /** A small uppercase label, the way every screen sets one. */
  const label = (text: string, x: number, y: number, align: 'left' | 'right' = 'left') =>
    txt(text.toUpperCase(), x, y, { face: 'sans', size: 6.5, color: MUTED, align, spacing: 0.4 })

  // Bone paper on every page, so the document reads as the product.
  const paintPage = () => {
    doc.setFillColor(...PAPER)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }
  // Page 1 is painted before anything is drawn on it. Later pages are painted
  // by autoTable's willDrawPage below, and only once: a fill is opaque and has
  // no z-order, so repainting a page that already has content erases it.
  const painted = new Set<number>([1])
  const paintIfNew = () => {
    const n = doc.getCurrentPageInfo().pageNumber
    if (painted.has(n)) return
    painted.add(n)
    paintPage()
  }
  paintPage()

  // ─────────────────────────────────────────── masthead ───
  let y = 20
  wordmark(22, L, y, INK)
  txt(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    R,
    y,
    { face: 'mono', size: 8, color: MUTED, align: 'right' }
  )

  y += 9
  txt('ATTENDANCE RECORD', L, y, { face: 'display', size: 22, color: PRIMARY })

  y += 5
  txt(
    `Events ${profile.full_name || profile.username || 'this student'} attended through HATCH, verified against our records.`,
    L,
    y,
    { face: 'sans', size: 8.5, color: SECONDARY }
  )

  y += 4
  rule(y, 0.6, SIGNAL)

  // ─────────────────────────────────────────── the figures ───
  y += 12
  const statCols = [
    { k: 'Registered', v: String(stats.total_registered) },
    { k: 'Attended', v: String(stats.total_attended) },
    { k: 'Attendance rate', v: `${stats.attendance_rate}%` },
    { k: 'Plan', v: tierName(profile.subscription_tier) },
  ]
  const colW = (R - L) / statCols.length
  statCols.forEach((s, i) => {
    const x = L + i * colW
    label(s.k, x, y)
    txt(s.v, x, y + 9, { face: 'mono', size: 18, color: PRIMARY })
    if (i > 0) {
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.25)
      doc.line(x - 4, y - 4, x - 4, y + 12)
    }
  })
  y += 17
  rule(y, 0.25, RULE)

  // ─────────────────────────────────────────── the person ───
  y += 10
  txt('STUDENT', L, y, { face: 'display', size: 12, color: PRIMARY })
  y += 3
  rule(y, 0.5, RULE_STRONG)
  y += 7

  const rows: [string, string, Face][] = [
    ['Name', profile.full_name || 'Not set', 'sans'],
    ['Username', profile.username ? `@${profile.username}` : 'Not set', 'mono'],
    ['Email', profile.email || 'Not set', 'mono'],
    ['College', profile.college || 'Not set', 'sans'],
    ['Graduation', profile.graduation_year || 'Not set', 'mono'],
    [
      'Member since',
      profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()
        : 'Not set',
      'mono',
    ],
  ]
  rows.forEach(([k, v, f]) => {
    label(k, L, y)
    txt(v, R, y, { face: f, size: 9, color: PRIMARY, align: 'right' })
    y += 3
    rule(y, 0.2, RULE)
    y += 6
  })

  // ─────────────────────────────────────────── the events ───
  y += 5
  txt('EVENTS ATTENDED', L, y, { face: 'display', size: 12, color: PRIMARY })
  txt(
    `${events.length} ${events.length === 1 ? 'event' : 'events'}`,
    R,
    y,
    { face: 'mono', size: 9, color: MUTED, align: 'right' }
  )
  y += 3
  rule(y, 0.5, RULE_STRONG)
  y += 6

  if (events.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['', 'EVENT', 'DATE', 'ORGANIZER', 'CATEGORY', 'MODE']],
      body: events.map((e, i) => [
        String(i + 1).padStart(2, '0'),
        e.event_title ?? '',
        e.event_date
          ? new Date(e.event_date)
              .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              .toUpperCase()
          : '',
        e.organizer ?? '',
        e.category ?? '',
        e.mode ?? '',
      ]),
      theme: 'plain',
      styles: { font: face('sans') || 'helvetica', fontSize: 8.5, textColor: PRIMARY },
      headStyles: {
        font: face('sans') || 'helvetica',
        fontSize: 6.5,
        textColor: MUTED,
        cellPadding: { top: 0, bottom: 3, left: 0, right: 3 },
        fillColor: PAPER,
      },
      bodyStyles: { cellPadding: { top: 3, bottom: 3, left: 0, right: 3 } },
      // Rules, not stripes. The old zebra fill is what made it a spreadsheet.
      alternateRowStyles: { fillColor: PAPER },
      columnStyles: {
        0: { cellWidth: 9, font: face('mono') || 'courier', textColor: MUTED, fontSize: 8 },
        1: { cellWidth: 56 },
        2: { cellWidth: 25, font: face('mono') || 'courier', fontSize: 8 },
        3: { cellWidth: 38, textColor: SECONDARY },
        4: { cellWidth: 25, textColor: SECONDARY },
        5: { cellWidth: 21, font: face('mono') || 'courier', fontSize: 8, textColor: SECONDARY },
      },
      margin: { left: L, right: PAGE_W - R, bottom: 24 },
      // Before the table draws on a fresh page, not after: didDrawPage ran
      // once the content was down and the fill covered the whole report.
      willDrawPage: () => paintIfNew(),
      didParseCell: (d: any) => {
        if (d.section === 'head') d.cell.styles.cellPadding = { top: 0, bottom: 3, left: 0, right: 3 }
      },
      didDrawCell: (d: any) => {
        // One hairline under every row, and a heavier one under the header.
        if (d.column.index !== 0) return
        const bottom = d.cell.y + d.cell.height
        doc.setDrawColor(...(d.section === 'head' ? RULE_STRONG : RULE))
        doc.setLineWidth(d.section === 'head' ? 0.4 : 0.15)
        doc.line(L, bottom, R, bottom)
      },
    })
    y = (doc.lastAutoTable?.finalY ?? y) + 10
  } else {
    doc.setFillColor(...SUNKEN)
    doc.rect(L, y, R - L, 16, 'F')
    txt('No events attended yet.', L + 4, y + 7, { face: 'sans', size: 9, color: SECONDARY })
    txt('Attendance is recorded when a student checks in at an event.', L + 4, y + 12, {
      face: 'sans',
      size: 7.5,
      color: MUTED,
    })
    y += 24
  }

  // ─────────────────────────────────────────── footer ───
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    rule(PAGE_H - 16, 0.25, RULE)
    wordmark(7, L, PAGE_H - 11, MUTED)
    txt('hatchevent.in', L + 13, PAGE_H - 11, { face: 'sans', size: 7.5, color: MUTED })
    txt(`${String(i).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`, R, PAGE_H - 11, {
      face: 'mono',
      size: 7.5,
      color: MUTED,
      align: 'right',
    })
  }

  doc.save(`HATCH-attendance-${profile.username}-${new Date().toISOString().split('T')[0]}.pdf`)
}
