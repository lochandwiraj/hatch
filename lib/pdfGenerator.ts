import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface AttendedEvent {
  event_title: string
  event_date: string
  event_time: string | null
  organizer: string
  category: string
  mode: string
  attended_at: string
  required_tier?: string
}

interface UserProfile {
  full_name: string
  username: string
  email: string
  college: string
  graduation_year: string
  subscription_tier: string
  created_at: string
}

const tierName = (tier: string) => {
  if (tier === 'basic_99') return 'Explorer'
  if (tier === 'premium_149') return 'Professional'
  return 'Free'
}

const filterByTier = (events: AttendedEvent[], tier: string) =>
  events.filter(e => {
    const t = e.required_tier || 'free'
    if (tier === 'premium_149') return true
    if (tier === 'basic_99') return t === 'free' || t === 'basic_99'
    return t === 'free'
  })

// ── Palette (all grayscale — professional) ──
const BLACK  = [15, 15, 15]   as [number,number,number]
const DARK   = [55, 55, 55]   as [number,number,number]
const MID    = [110, 110, 110] as [number,number,number]
const LIGHT  = [180, 180, 180] as [number,number,number]
const RULE   = [220, 220, 220] as [number,number,number]
const ROW_BG = [248, 248, 248] as [number,number,number]
const WHITE  = [255, 255, 255] as [number,number,number]

export const generateAttendanceReport = async (
  profile: UserProfile,
  attendedEvents: AttendedEvent[],
  stats: { total_registered: number; total_attended: number; attendance_rate: number }
) => {
  const events = filterByTier(attendedEvents, profile.subscription_tier)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // Load and register Qepho font (TTF preferred; OTF may not render in jsPDF)
  let qephoLoaded = false
  try {
    const res = await fetch('/fonts/qephomodern-regular.ttf')
    if (res.ok) {
      const buf = await res.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const b64 = btoa(binary)
      doc.addFileToVFS('Qepho.ttf', b64)
      doc.addFont('Qepho.ttf', 'Qepho', 'normal')
      // Quick sanity check — jsPDF will throw if the font is unusable
      doc.setFont('Qepho', 'normal')
      qephoLoaded = true
    }
  } catch {
    qephoLoaded = false
  }

  const setHatchFont = (size: number) => {
    doc.setFontSize(size)
    if (qephoLoaded) {
      doc.setFont('Qepho', 'normal')
    } else {
      doc.setFont('helvetica', 'bold')
    }
  }
  const W = 210
  const L = 20  // left margin
  const R = 190 // right margin
  let y = 0

  // ── Helper: horizontal rule ──
  const rule = (yy: number, weight = 0.3, color = RULE) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(weight)
    doc.line(L, yy, R, yy)
  }

  // ── Helper: set text style ──
  const txt = (
    text: string, x: number, yy: number,
    size: number, weight: 'normal' | 'bold', color: [number,number,number],
    align: 'left' | 'right' | 'center' = 'left'
  ) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', weight)
    doc.setTextColor(...color)
    doc.text(text, x, yy, { align })
  }

  // ══════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════
  y = 22
  setHatchFont(26)
  doc.setTextColor(...BLACK)
  doc.text('HATCH', L, y)

  txt(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    R, y, 8, 'normal', MID, 'right'
  )

  y += 5
  txt('Event Attendance Report', L, y, 10, 'normal', MID)

  y += 7
  rule(y, 0.6, BLACK)

  // ══════════════════════════════════════════
  // PROFILE + STATS (two-column)
  // ══════════════════════════════════════════
  y += 12

  // Left column — profile details
  const col2 = 120 // x start of right column

  txt('Profile', L, y, 7.5, 'bold', MID)
  txt('Summary', col2, y, 7.5, 'bold', MID)

  y += 6

  const profileRows: [string, string][] = [
    ['Name',            profile.full_name || '—'],
    ['Username',        `@${profile.username}`],
    ['Email',           profile.email],
    ['College',         profile.college || '—'],
    ['Graduation',      profile.graduation_year || '—'],
    ['Plan',            tierName(profile.subscription_tier)],
    ['Member since',    new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })],
  ]

  const statRows: [string, string][] = [
    ['Registered',      stats.total_registered.toString()],
    ['Attended',        stats.total_attended.toString()],
    ['Attendance rate', `${stats.attendance_rate}%`],
  ]

  const rowH = 6.5
  profileRows.forEach(([label, value]) => {
    txt(label, L, y, 8, 'normal', MID)
    txt(value, L + 30, y, 8, 'normal', DARK)
    y += rowH
  })

  // Right column — stat numbers (bigger, with label below)
  let sy = y - (profileRows.length * rowH) // reset to same start
  statRows.forEach(([label, value]) => {
    txt(value, col2 + 25, sy + 5, 20, 'bold', BLACK, 'center')
    txt(label.toUpperCase(), col2 + 25, sy + 10.5, 6.5, 'normal', LIGHT, 'center')
    sy += 22
  })

  // Align y to whichever column is taller
  const statsBottom = (y - (profileRows.length * rowH)) + (statRows.length * 22)
  y = Math.max(y, statsBottom) + 4

  rule(y, 0.3)

  // ══════════════════════════════════════════
  // EVENTS TABLE
  // ══════════════════════════════════════════
  y += 10
  txt('Events Attended', L, y, 11, 'bold', BLACK)

  if (events.length > 0) {
    y += 2
    txt(
      `${events.length} event${events.length !== 1 ? 's' : ''} · ${tierName(profile.subscription_tier)} plan`,
      L, y + 5, 8, 'normal', MID
    )
    y += 8

    const tableData = events.map((e, i) => [
      (i + 1).toString(),
      e.event_title,
      new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      e.organizer,
      e.category,
      e.mode,
    ])

    doc.autoTable({
      startY: y,
      head: [['#', 'Event', 'Date', 'Organizer', 'Category', 'Mode']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: ROW_BG,
        textColor: MID,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      },
      alternateRowStyles: {
        fillColor: WHITE,
      },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center', textColor: LIGHT },
        1: { cellWidth: 62 },
        2: { cellWidth: 28 },
        3: { cellWidth: 38 },
        4: { cellWidth: 25 },
        5: { cellWidth: 19 },
      },
      margin: { left: L, right: W - R },
      tableLineColor: RULE,
      tableLineWidth: 0.2,
      didDrawCell: (data: any) => {
        // Bottom border on header row only
        if (data.row.index === -1 && data.cell.section === 'head') {
          doc.setDrawColor(...DARK)
          doc.setLineWidth(0.4)
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          )
        }
      },
    })
  } else {
    y += 10
    txt('No events attended yet.', L, y, 9, 'normal', LIGHT)
  }

  // ══════════════════════════════════════════
  // FOOTER — every page
  // ══════════════════════════════════════════
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    rule(284, 0.3, RULE)
    setHatchFont(7.5)
    doc.setTextColor(...MID)
    doc.text('HATCH', L, 289)
    txt('hatch.in', L + 14, 289, 7.5, 'normal', LIGHT)
    txt(`Page ${i} of ${pages}`, R, 289, 7.5, 'normal', LIGHT, 'right')
  }

  doc.save(`HATCH_Report_${profile.username}_${new Date().toISOString().split('T')[0]}.pdf`)
}
