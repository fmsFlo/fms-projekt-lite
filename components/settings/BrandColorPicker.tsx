"use client"

import { useState } from 'react'
import { useTheme } from '@/styles/themes/themeContext'

const PRESET_PALETTES = [
  {
    name: 'Apple Blue',
    colors: {
      primary: '#0071E3',
      secondary: '#5856D6',
      accent: '#FF9500'
    }
  },
  {
    name: 'Modern Neutrals',
    colors: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
      accent: '#86868B'
    }
  },
  {
    name: 'Vibrant',
    colors: {
      primary: '#FF3B30',
      secondary: '#FF9500',
      accent: '#34C759'
    }
  },
  {
    name: 'Ocean',
    colors: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      accent: '#00C7BE'
    }
  },
  {
    name: 'Purple',
    colors: {
      primary: '#5856D6',
      secondary: '#AF52DE',
      accent: '#FF2D55'
    }
  }
]

export default function BrandColorPicker() {
  const { brandColors, setBrandColors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setBrandColors({
      ...brandColors,
      [key]: value
    })
  }

  const applyPreset = (preset: typeof PRESET_PALETTES[0]) => {
    setBrandColors(preset.colors)
  }

  // Check contrast ratio (WCAG AA)
  const getContrastRatio = (color: string): 'pass' | 'fail' => {
    // Simple check - in production, use a proper contrast calculation library
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? 'pass' : 'fail'
  }

  return (
    <div className="brand-color-picker">
      <div className="brand-color-picker-header">
        <h3 className="text-h3">Brand Colors</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="brand-color-picker-toggle"
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide' : 'Customize'}
        </button>
      </div>

      {isOpen && (
        <div className="brand-color-picker-content">
          {/* Preset Palettes */}
          <div className="brand-color-presets">
            <label className="brand-color-label">Preset Palettes</label>
            <div className="brand-color-presets-grid">
              {PRESET_PALETTES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="brand-color-preset-card"
                  title={preset.name}
                >
                  <div className="brand-color-preset-colors">
                    <div
                      className="brand-color-preset-color"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div
                      className="brand-color-preset-color"
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                    <div
                      className="brand-color-preset-color"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                  </div>
                  <span className="brand-color-preset-name">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="brand-color-custom">
            <label className="brand-color-label">Custom Colors</label>
            
            {(['primary', 'secondary', 'accent'] as const).map((key) => {
              const contrast = getContrastRatio(brandColors[key])
              return (
                <div key={key} className="brand-color-input-group">
                  <label className="brand-color-input-label">
                    {key.charAt(0).toUpperCase() + key.slice(1)} Color
                    {contrast === 'fail' && (
                      <span className="brand-color-warning" title="Low contrast - may affect accessibility">
                        ⚠️
                      </span>
                    )}
                  </label>
                  <div className="brand-color-input-wrapper">
                    <input
                      type="color"
                      value={brandColors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="brand-color-input"
                    />
                    <input
                      type="text"
                      value={brandColors[key]}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          handleColorChange(key, e.target.value)
                        }
                      }}
                      className="brand-color-text-input"
                      placeholder="#000000"
                      pattern="^#[0-9A-F]{6}$"
                    />
                    <div
                      className="brand-color-preview"
                      style={{ backgroundColor: brandColors[key] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reset Button */}
          <div className="brand-color-actions">
            <button
              onClick={() => setBrandColors(PRESET_PALETTES[0].colors)}
              className="brand-color-reset"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  )
}




