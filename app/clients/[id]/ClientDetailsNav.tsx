'use client'

import { useState } from 'react'
import { Menu, X, User, FileText, Trash2, Calculator } from 'lucide-react'

interface ClientDetailsNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onDelete?: () => void
}

export default function ClientDetailsNav({ activeTab, onTabChange, onDelete }: ClientDetailsNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'details', label: 'Details', icon: User },
    { id: 'contracts', label: 'Dokumente', icon: FileText },
    { id: 'concept', label: 'Analyse Tools', icon: Calculator },
  ]

  return (
    <div className="sticky top-16 z-40 bg-white border-b border-gray-200 mb-4">
      {/* Desktop Navigation */}
      <div className="hidden md:flex max-w-5xl mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
        {onDelete && (
          <div className="ml-auto flex items-center">
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
              <span className="hidden lg:inline">Löschen</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span>
              {tabs.find(t => t.id === activeTab)?.label || 'Menü'}
            </span>
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 text-sm font-medium text-red-600"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

