import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AttendanceConfirmationProvider from '@/components/events/AttendanceConfirmationProvider'
import CompleteProfileModal from '@/components/auth/CompleteProfileModal'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
})

export const metadata = {
  title: 'HATCH — Stop Searching. Start Discovering.',
  description: 'Curated student events delivered weekly. Save 10+ hours of searching. Quality over quantity.',
  keywords: 'student events, hackathons, competitions, workshops, curated events, college events',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <AuthProvider>
          <CompleteProfileModal />
          <AttendanceConfirmationProvider>
            {children}
          </AttendanceConfirmationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(13, 13, 20, 0.95)',
                color: '#fafafa',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                backdropFilter: 'blur(12px)',
                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              },
              success: { iconTheme: { primary: '#8b5cf6', secondary: '#fafafa' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
