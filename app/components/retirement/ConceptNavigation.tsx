"use client"

import { useRouter } from 'next/navigation'
import { FileText, LayoutDashboard, User, Lightbulb } from 'lucide-react'

interface ConceptNavigationProps {
  clientId: string
  conceptId: string
  activeView: 'datenerfassung' | 'dashboard' | 'personal' | 'empfehlungen'
}

export default function ConceptNavigation({ clientId, conceptId, activeView }: ConceptNavigationProps) {
  const router = useRouter()

  const views = [
    {
      id: 'datenerfassung' as const,
      label: 'Datenerfassung',
      icon: FileText,
      path: `/clients/${clientId}/retirement-concept/${conceptId}`,
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard Übersicht',
      icon: LayoutDashboard,
      path: `/clients/${clientId}/retirement-concept/${conceptId}?step=3`,
    },
    {
      id: 'personal' as const,
      label: 'Persönliche Analyse',
      icon: User,
      path: `/clients/${clientId}/retirement-concept/${conceptId}?step=4`,
    },
    {
      id: 'empfehlungen' as const,
      label: 'Empfehlungen',
      icon: Lightbulb,
      path: `/clients/${clientId}/retirement-concept/${conceptId}/ergebnis`,
    },
  ]

  const handleNavigation = (path: string) => {
    router.push(path, { scroll: false })
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {views.map((view) => {
            const Icon = view.icon
            const isActive = activeView === view.id
            return (
              <button
                key={view.id}
                onClick={() => handleNavigation(view.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{view.label}</span>
                <span className="sm:hidden">{view.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

