import { prisma } from '@/lib/prisma'
import RetirementConceptForm from './retirement-concept-form'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

interface Params {
  params: { id: string; conceptId: string }
}

export default async function RetirementConceptPage({ params }: Params) {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }
  const concept = await prisma.retirementConcept.findUnique({
    where: { id: params.conceptId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
        }
      },
      attachments: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!concept) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div style={{ color: 'var(--color-error)' }}>Rentenkonzept nicht gefunden</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <div className="space-y-8">
        {/* Header - Apple Style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
              Rentenkonzept
            </h1>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              {concept.client.firstName} {concept.client.lastName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/retirement-concepts/${concept.id}/pdf`}
              className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-primary)'
              }}
            >
              📄 PDF herunterladen
            </a>
            <a
              href={`/clients/${concept.client.id}`}
              className="inline-flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              ← Zurück zum Kunden
            </a>
          </div>
        </div>

        <RetirementConceptForm
          initialConcept={concept}
          clientBirthDate={concept.client.birthDate}
          initialAttachments={concept.attachments.map((attachment) => ({
            id: attachment.id,
            category: attachment.category,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            createdAt: attachment.createdAt.toISOString(),
            expiresAt: attachment.expiresAt.toISOString(),
            url: `/api/retirement-concepts/${concept.id}/attachments/${attachment.id}`,
          }))}
        />
      </div>
    </div>
  )
}


