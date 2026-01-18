import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HATCH - Stop Searching. Start Discovering.',
  description: 'Curated student events delivered weekly. Save 10+ hours of searching. Quality over quantity.',
  keywords: 'student events, hackathons, competitions, workshops, curated events, college events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}