"use client"

import { useTheme } from '@/styles/themes/themeContext'

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2V4M10 16V18M4 10H2M18 10H16M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
    if (resolvedTheme === 'dark') {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.293 13.293C16.3782 14.2078 15.2348 14.8626 14 15.146C12.7652 15.4294 11.4804 15.3315 10.2929 14.8636C9.10536 14.3957 8.06266 13.5762 7.28171 12.5C6.50075 11.4238 6.01019 10.1301 5.86667 8.77252C5.72315 7.41493 5.93134 6.04424 6.46718 4.79746C7.00302 3.55068 7.84526 2.47052 8.90738 1.66492C9.9695 0.859315 11.2124 0.357771 12.5207 0.214407C13.829 0.0710432 15.1585 0.291138 16.364 0.851723C15.0002 2.21449 14.2857 4.15328 14.5 6.05C14.7143 7.94672 15.8333 9.65 17.293 10.707C17.618 11.0362 17.8999 11.4092 18.1312 11.8157C18.3625 12.2222 18.5406 12.6581 18.6606 13.1119C18.7806 13.5657 18.8413 14.0336 18.8413 14.5035C18.8413 14.9734 18.7806 15.4413 18.6606 15.8951C18.5406 16.3489 18.3625 16.7848 18.1312 17.1913C17.8999 17.5978 17.618 17.9708 17.293 18.3L17.293 13.293Z" fill="currentColor"/>
        </svg>
      )
    }
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="4" fill="currentColor"/>
        <path d="M10 2V4M10 16V18M4 10H2M18 10H16M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  const getLabel = () => {
    if (theme === 'system') return 'System'
    return resolvedTheme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
      title={`Current: ${getLabel()}`}
    >
      <span className="theme-toggle-icon">{getIcon()}</span>
      <span className="theme-toggle-label">{getLabel()}</span>
    </button>
  )
}



