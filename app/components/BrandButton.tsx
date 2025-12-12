'use client'

import { useSettings } from '@/lib/settings-context'
import { designSystem } from '@/lib/design-system'

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function BrandButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  style,
  onMouseEnter,
  onMouseLeave,
  ...props 
}: BrandButtonProps) {
  const { settings } = useSettings()

  const colors = {
    primary: settings?.primaryColor || '#007AFF',
    secondary: settings?.secondaryColor || '#5856D6',
  }

  const sizes = {
    sm: {
      padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
      fontSize: designSystem.typography.fontSize.sm,
    },
    md: {
      padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
      fontSize: designSystem.typography.fontSize.base,
    },
    lg: {
      padding: `${designSystem.spacing.lg} ${designSystem.spacing.xl}`,
      fontSize: designSystem.typography.fontSize.lg,
    },
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = '0.9'
    e.currentTarget.style.transform = 'scale(0.98)'
    onMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.opacity = '1'
    e.currentTarget.style.transform = 'scale(1)'
    onMouseLeave?.(e)
  }

  return (
    <button
      style={{
        backgroundColor: colors[variant],
        color: 'white',
        ...sizes[size],
        borderRadius: designSystem.borderRadius.lg,
        fontWeight: designSystem.typography.fontWeight.semibold,
        border: 'none',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: props.disabled ? 0.5 : 1,
        boxShadow: designSystem.shadows.sm,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
}

