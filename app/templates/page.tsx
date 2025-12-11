import { prisma } from '@/lib/prisma'
import TemplatesList from './templates-list'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function TemplatesPage() {
  // Auth wird von Middleware geprüft

  const templates = await prisma.contractTemplate.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
            Vorlagen
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Verwalten Sie Ihre Vertragsvorlagen und Schreiben
          </p>
        </div>
      </div>

      <TemplatesList initialTemplates={templates} />
    </div>
  )
}

