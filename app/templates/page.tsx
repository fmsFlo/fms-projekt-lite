import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import DeleteTemplateButton from './delete-button'
import TemplateCategorySelect from './category-select'
import { requireAuth } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function TemplatesPage() {
  const auth = await requireAuth()
  if (!auth) {
    redirect('/login')
  }

  const isAdmin = auth.profile.role === 'admin'
  
  // Hole sichtbare Kategorien für Berater
  let visibleCategories: string[] | null = null
  if (!isAdmin && session) {
    const userId = session.split(':')[1]
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { visibleCategories: true }
      })
      if (user?.visibleCategories) {
        try {
          visibleCategories = JSON.parse(user.visibleCategories)
        } catch {
          visibleCategories = []
        }
      } else {
        visibleCategories = []
      }
    }
  }
  
  let templates = await prisma.contractTemplate.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  
  // Filtere Templates für Berater basierend auf sichtbaren Kategorien
  if (!isAdmin && visibleCategories !== null) {
    if (visibleCategories.length === 0) {
      // Keine Kategorien ausgewählt = keine Honorarverträge
      templates = templates.filter(t => t.category !== 'Honorarberatung' && t.category !== 'Honorar Beratung')
    } else {
      // Nur ausgewählte Kategorien
      templates = templates.filter(t => {
        const cat = t.category || 'Sonstige'
        return visibleCategories.includes(cat)
      })
    }
  }
  
  const categories = Array.from(new Set(templates.map(t => t.category || 'Sonstige')))
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <div className="space-y-12">
        {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>Vorlagen</h1>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Verwalten Sie Ihre Vertragsvorlagen</p>
          </div>
          {isAdmin && (
            <a 
              href="/templates/new" 
              className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              style={{
                padding: '12px 32px',
                height: 'var(--button-height-md)',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-success)'
              }}
            >
          + Neu
        </a>
          )}
      </div>
      
      {/* Categories */}
      {categories.map((category, catIdx) => {
        const catTemplates = templates.filter(t => (t.category || 'Sonstige') === category)
        return (
          <section key={category} className="space-y-6" style={{ marginTop: catIdx > 0 ? 'var(--spacing-12)' : '0' }}>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
              {category}
            </h2>
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              {catTemplates.map((t) => (
                <div
                  key={t.id}
                  className="template-card rounded-lg p-6 transition-all duration-300 cursor-default"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {t.name}
                        </h3>
                        {t.description && (
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {t.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        <code 
                          className="text-xs px-3 py-1.5 rounded-md font-mono" 
                          style={{ 
                            color: 'var(--color-text-tertiary)', 
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          {t.slug}
                        </code>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                        <TemplateCategorySelect
                          templateId={t.id}
                          currentCategory={t.category || ''}
                          categories={categories}
                        />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin ? (
                        <>
                          <a 
                            href={`/templates/${t.id}`}
                            className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                            style={{
                              padding: '8px 20px',
                              height: 'auto',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--weight-medium)',
                              backgroundColor: 'var(--color-primary)'
                            }}
                          >
                            Bearbeiten
                          </a>
                          <DeleteTemplateButton id={t.id} name={t.name} />
                        </>
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-md" style={{ color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                          Nur Ansicht
                        </span>
                      )}
                    </div>
                  </div>
                        </div>
                  ))}
            </div>
          </section>
        )
      })}
      </div>
    </div>
  )
}

