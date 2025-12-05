import type { ReactNode } from 'react'

export default function SalesDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <main className="w-full">
        {children}
      </main>
    </div>
  )
}

