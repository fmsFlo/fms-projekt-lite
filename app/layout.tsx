import './globals.css'
import type { ReactNode } from 'react'
import { Navigation } from '@/app/components/Navigation'
import { ThemeProvider } from '@/styles/themes/themeContext'
import { SettingsProvider } from '@/lib/settings-context'

export const metadata = {
  title: 'iFinance',
  description: 'Kundenverwaltung, Verträge und Analysen'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <SettingsProvider>
            <Navigation />
            <main className="min-h-screen bg-[var(--color-bg-primary)]">
              {children}
            </main>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

