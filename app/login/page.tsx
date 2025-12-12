'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Entfernt: Middleware übernimmt die Prüfung und Weiterleitung
  // Kein Session-Check mehr auf der Login-Seite, um Endlosschleifen zu vermeiden
  useEffect(() => {
    setCheckingSession(false);
  }, [])

  // Prüfe URL-Parameter für Fehler
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no_profile') {
      setError('Kein Profil gefunden. Bitte wenden Sie sich an den Administrator.');
      setCheckingSession(false);
    } else if (errorParam === 'blocked') {
      setError('Ihr Account wurde gesperrt. Bitte wenden Sie sich an den Administrator.');
      setCheckingSession(false);
    }
  }, [searchParams]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Login startet...', { email, passwordLength: password.length });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('🔍 Login Response Status:', response.status);
      console.log('🔍 Login Response OK:', response.ok);

      if (response.ok) {
        // Success - redirect NOW!
        console.log('✅ Login erfolgreich, weiterleiten zu /dashboard');
        
        // Use window.location.href instead of router.push to force full page reload
        window.location.href = '/dashboard';
        return; // Verhindere weitere Ausführung
      } else {
        // Error - show message
        const data = await response.json().catch(() => ({ message: 'Anmeldung fehlgeschlagen' }));
        console.error('❌ Login fehlgeschlagen:', data);
        setError(data.message || data.error || 'Anmeldung fehlgeschlagen');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Netzwerkfehler. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Prüfe Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text-primary)' }}>
            Finance Made Simple
          </h2>
          <p className="mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Anmelden für Berater-Zugang
          </p>
        </div>

        <form onSubmit={handleLogin} method="post" className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lädt...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
