import './globals.css'
import type { ReactNode } from 'react'
import { Navigation } from '@/app/components/Navigation'
import { ThemeProvider } from '@/styles/themes/themeContext'
import { SettingsProvider } from '@/lib/settings-context'
import { PrivacyProvider } from '@/app/contexts/PrivacyContext'

export const metadata = {
  title: 'qapix',
  description: 'Kundenverwaltung, Verträge und Analysen'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <SettingsProvider>
            <PrivacyProvider>
              <Navigation />
              <main className="min-h-screen bg-[var(--color-bg-primary)]">
                {children}
              </main>
            </PrivacyProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

