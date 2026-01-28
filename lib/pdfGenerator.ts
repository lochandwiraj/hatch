import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
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
  required_tier?: string // Add required_tier to filter by
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

// Helper function to filter events based on user's subscription tier
const filterEventsByTier = (events: AttendedEvent[], userTier: string): AttendedEvent[] => {
  return events.filter(event => {
    const eventTier = event.required_tier || 'free'
    
    switch (userTier) {
      case 'free':
        // Free users can only see free events
        return eventTier === 'free'
      
      case 'basic_99': // Explorer
        // Explorer users can see free + basic events
        return eventTier === 'free' || eventTier === 'basic_99'
      
      case 'premium_149': // Professional
        // Professional users can see all events
        return true
      
      default:
        // Default to free tier access
        return eventTier === 'free'
    }
  })
}

export const generateAttendanceReport = (
  userProfile: UserProfile,
  attendedEvents: AttendedEvent[],
  attendanceStats: { total_registered: number; total_attended: number; attendance_rate: number }
) => {
  // Filter events based on user's subscription tier
  const filteredEvents = filterEventsByTier(attendedEvents, userProfile.subscription_tier)
  
  // Create new PDF document
  const doc = new jsPDF()
  
  // Set up colors
  const primaryColor = [79, 70, 229] // Primary blue
  const secondaryColor = [107, 114, 128] // Gray
  const successColor = [34, 197, 94] // Green
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, 'F')
  
  // HATCH Logo/Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('HATCH', 20, 25)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Event Attendance Report', 20, 32)
  
  // Date generated
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 140, 32)
  
  // User Information Section
  let yPosition = 55
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('User Information', 20, yPosition)
  
  yPosition += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const userInfo = [
    ['Name:', userProfile.full_name],
    ['Username:', `@${userProfile.username}`],
    ['Email:', userProfile.email],
    ['College:', userProfile.college],
    ['Graduation Year:', userProfile.graduation_year],
    ['Plan:', getSubscriptionTierName(userProfile.subscription_tier)],
    ['Member Since:', new Date(userProfile.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })]
  ]
  
  userInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, yPosition)
    yPosition += 7
  })
  
  // Attendance Statistics Section
  yPosition += 10
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Attendance Statistics', 20, yPosition)
  
  yPosition += 15
  
  // Stats boxes
  const statsBoxWidth = 50
  const statsBoxHeight = 25
  const statsSpacing = 60
  
  // Events Registered Box
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(20, yPosition, statsBoxWidth, statsBoxHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(attendanceStats.total_registered.toString(), 45 - (attendanceStats.total_registered.toString().length * 3), yPosition + 12)
  doc.setFontSize(8)
  doc.text('Events Registered', 22, yPosition + 20)
  
  // Events Attended Box
  doc.setFillColor(successColor[0], successColor[1], successColor[2])
  doc.rect(20 + statsSpacing, yPosition, statsBoxWidth, statsBoxHeight, 'F')
  doc.setFontSize(18)
  doc.text(attendanceStats.total_attended.toString(), 45 + statsSpacing - (attendanceStats.total_attended.toString().length * 3), yPosition + 12)
  doc.setFontSize(8)
  doc.text('Events Attended', 22 + statsSpacing, yPosition + 20)
  
  // Attendance Rate Box
  doc.setFillColor(168, 85, 247) // Purple
  doc.rect(20 + (statsSpacing * 2), yPosition, statsBoxWidth, statsBoxHeight, 'F')
  doc.setFontSize(18)
  doc.text(`${attendanceStats.attendance_rate}%`, 45 + (statsSpacing * 2) - (`${attendanceStats.attendance_rate}%`.length * 3), yPosition + 12)
  doc.setFontSize(8)
  doc.text('Attendance Rate', 22 + (statsSpacing * 2), yPosition + 20)
  
  yPosition += 40
  
  // Events Attended Section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Events Attended', 20, yPosition)
  
  yPosition += 10
  
  if (filteredEvents.length === 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('No events attended in your tier yet.', 20, yPosition)
    
    // Show tier access information
    yPosition += 10
    doc.setFontSize(10)
    doc.text(`Your ${getSubscriptionTierName(userProfile.subscription_tier)} gives you access to:`, 20, yPosition)
    yPosition += 7
    
    const tierAccess = getTierAccessDescription(userProfile.subscription_tier)
    doc.text(tierAccess, 20, yPosition)
  } else {
    // Add tier access info before the table
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`Showing events accessible with your ${getSubscriptionTierName(userProfile.subscription_tier)}`, 20, yPosition)
    yPosition += 10
    
    // Prepare table data with tier information
    const tableData = filteredEvents.map((event, index) => [
      (index + 1).toString(),
      event.event_title,
      new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      event.event_time || 'All Day',
      event.organizer,
      event.category,
      event.mode,
      getTierDisplayName(event.required_tier || 'free'),
      new Date(event.attended_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    ])
    
    // Create table with tier column
    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Event Name', 'Date', 'Time', 'Organizer', 'Category', 'Mode', 'Tier', 'Attended On']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // #
        1: { cellWidth: 40 }, // Event Name
        2: { cellWidth: 20 }, // Date
        3: { cellWidth: 15 }, // Time
        4: { cellWidth: 25 }, // Organizer
        5: { cellWidth: 20 }, // Category
        6: { cellWidth: 15 }, // Mode
        7: { cellWidth: 15, halign: 'center' }, // Tier
        8: { cellWidth: 20 } // Attended On
      },
      margin: { left: 20, right: 20 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      }
    })
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Footer line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, 280, 190, 280)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text('HATCH - Stop Searching. Start Discovering.', 20, 285)
    doc.text(`Page ${i} of ${pageCount}`, 170, 285)
    doc.text('Generated from hatch.in', 20, 290)
  }
  
  // Generate filename
  const filename = `HATCH_Attendance_Report_${userProfile.username}_${new Date().toISOString().split('T')[0]}.pdf`
  
  // Save the PDF
  doc.save(filename)
}

// Helper function to get subscription tier name
const getSubscriptionTierName = (tier: string): string => {
  switch (tier) {
    case 'free':
      return 'Free Plan'
    case 'basic_99':
      return 'Explorer Plan (₹99)'
    case 'premium_149':
      return 'Professional Plan (₹149)'
    default:
      return 'Free Plan'
  }
}

// Helper function to get tier display name for events
const getTierDisplayName = (tier: string): string => {
  switch (tier) {
    case 'free':
      return 'Free'
    case 'basic_99':
      return 'Explorer'
    case 'premium_149':
      return 'Professional'
    default:
      return 'Free'
  }
}

// Helper function to get tier access description
const getTierAccessDescription = (tier: string): string => {
  switch (tier) {
    case 'free':
      return '• Free events only'
    case 'basic_99':
      return '• Free events + Explorer events'
    case 'premium_149':
      return '• All events (Free + Explorer + Professional)'
    default:
      return '• Free events only'
  }
}