'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Eye, EyeOff } from 'lucide-react'
import LogoutButton from '@/components/logout-button'
import ThemeToggle from '@/components/settings/ThemeToggle'
import { usePrivacy } from '@/app/contexts/PrivacyContext'

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const { privacyMode, togglePrivacyMode } = usePrivacy()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function getUser() {
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          setUser(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching user:', error);
        }
        setUser(null);
        setLoading(false);
      }
    }
    
    getUser();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Base navigation items
  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/clients', label: 'Kunden' },
  ]

  // Admin-only navigation items
  const adminNavItems = [
    { href: '/templates', label: 'Vorlagen' },
    { href: '/settings', label: 'Einstellungen' },
    { href: '/sales-dashboard', label: 'Sales Dashboard' },
  ]

  // Advisor navigation items
  const advisorNavItems = [
    { href: '/templates', label: 'Vorlagen' },
  ]

  // Combine navigation items based on user role
  const navItems = user?.role === 'admin' 
    ? [...baseNavItems, ...adminNavItems]
    : user?.role === 'advisor'
    ? [...baseNavItems, ...advisorNavItems]
    : []

  // If no user, show login link
  if (!loading && !user) {
    return (
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#000',
            textDecoration: 'none',
          }}>
            iFinance
          </Link>
          <Link href="/login" style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Anmelden
          </Link>
        </div>
      </nav>
    )
  }

  if (loading) {
    return (
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#000',
          }}>
            iFinance
          </div>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>Lädt...</div>
        </div>
      </nav>
    )
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#000',
          textDecoration: 'none',
        }}>
          iFinance
        </Link>
        
        {/* Desktop Navigation */}
        <div style={{
          display: 'none',
          gap: '2rem',
          alignItems: 'center',
        }} className="desktop-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: pathname === item.href ? '#007AFF' : '#666',
                textDecoration: 'none',
                fontWeight: pathname === item.href ? 600 : 400,
                transition: 'color 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <LogoutButton />
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'block',
            padding: '0.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#000',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '1rem',
        }} className="mobile-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '1rem',
                color: pathname === item.href ? '#007AFF' : '#000',
                textDecoration: 'none',
                fontWeight: pathname === item.href ? 600 : 400,
                borderRadius: '0.5rem',
                backgroundColor: pathname === item.href ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                marginBottom: '0.5rem',
              }}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={togglePrivacyMode}
            style={{
              display: 'block',
              padding: '1rem',
              color: privacyMode ? '#007AFF' : '#000',
              textDecoration: 'none',
              fontWeight: privacyMode ? 600 : 400,
              borderRadius: '0.5rem',
              backgroundColor: privacyMode ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
              marginBottom: '0.5rem',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>{privacyMode ? 'Datenschutz-Modus aus' : 'Datenschutz-Modus an'}</span>
          </button>
          <div style={{
            padding: '1rem',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            marginTop: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      )}
      
      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
          .mobile-nav {
            display: none !important;
          }
        }
        
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}

