import './globals.css'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import SessionGuard from '@/components/SessionGuard'

export const metadata = {
  title: 'SignEase — Sign Language & Speech-to-Text Classroom Assistant',
  description:
    'Real-time speech captions and supported sign-language recognition designed to make classrooms more accessible for deaf and hard-of-hearing students.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white font-sans">
        <AccessibilityProvider>
          <SessionGuard />
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  )
}
