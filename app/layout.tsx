import './globals.css'
import type { ReactNode } from 'react'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/styles/themes/themeContext'

export const metadata = {
  title: 'iFinance',
  description: 'Kundenverwaltung, Verträge und Analysen'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] shadow-sm">
            <div className="max-w-[var(--max-width-content)] mx-auto px-[var(--padding-mobile)] sm:px-[var(--padding-tablet)] lg:px-[var(--padding-desktop)] py-4">
              <div className="flex items-center justify-between">
                <a href="/dashboard" className="text-xl font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity">
                  iFinance
                </a>
                <div className="flex items-center gap-4">
                  <Navigation />
                </div>
              </div>
            </div>
          </header>
          <main className="min-h-screen bg-[var(--color-bg-primary)]">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}

