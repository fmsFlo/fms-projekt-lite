import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import RetirementConceptForm from './retirement-concept-form'

interface Params {
  params: { id: string; conceptId: string }
}

export default async function RetirementConceptPage({ params }: Params) {
  // Auth wird von middleware.ts übernommen
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

  // Prüfe Admin-Status
  const userIsAdmin = isAdmin()

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
            {/* PDF-Button nur für Admins */}
            {userIsAdmin && (
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
            )}
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
          initialConcept={{
            id: concept.id,
            clientId: concept.clientId,
            birthDate: concept.birthDate ? (typeof concept.birthDate === 'string' ? concept.birthDate : new Date(concept.birthDate).toISOString().split('T')[0]) : null,
            desiredRetirementAge: concept.desiredRetirementAge,
            targetPensionNetto: concept.targetPensionNetto,
            hasCurrentPensionInfo: concept.hasCurrentPensionInfo,
            pensionAtRetirement: concept.pensionAtRetirement,
            pensionIncrease: concept.pensionIncrease,
            inflationRate: concept.inflationRate,
            calculatedPensionAtRetirement: concept.calculatedPensionAtRetirement,
            existingProvisionData: concept.existingProvisionData,
            lifeExpectancy: concept.lifeExpectancy,
            monthlySavings: concept.monthlySavings,
            returnRate: concept.returnRate,
            withdrawalRate: concept.withdrawalRate,
            hasChildren: concept.hasChildren,
            isCompulsoryInsured: concept.isCompulsoryInsured,
            kvBaseRate: concept.kvBaseRate,
            kvAdditionalRate: concept.kvAdditionalRate,
            kvContributionIncrease: concept.kvContributionIncrease,
            statutoryStrengths: concept.statutoryStrengths,
            statutoryWeaknesses: concept.statutoryWeaknesses,
            privateStrengths: concept.privateStrengths,
            privateWeaknesses: concept.privateWeaknesses,
            customTemplateHtml: concept.customTemplateHtml,
            recommendationDelta: concept.recommendationDelta,
            notes: concept.notes,
            calculationSnapshot: (concept as any).calculationSnapshot || null,
            client: {
              id: concept.client.id,
              firstName: concept.client.firstName,
              lastName: concept.client.lastName,
              birthDate: concept.client.birthDate
            }
          }}
          clientBirthDate={concept.client.birthDate}
          initialAttachments={concept.attachments.map((attachment) => ({
            id: attachment.id,
            category: attachment.category,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            createdAt: attachment.createdAt.toISOString(),
            expiresAt: attachment.expiresAt.toISOString(),
            url: `/api/retirement-concepts/${concept.id}/attachments/${attachment.id}`,
            size: attachment.size
          }))}
        />
      </div>
    </div>
  )
}


