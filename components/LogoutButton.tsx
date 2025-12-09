'use client'
export const runtime = "nodejs";


import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      style={{
        backgroundColor: 'var(--color-error)',
        color: 'white',
        borderRadius: 'var(--radius-pill)'
      }}
    >
      Abmelden
    </button>
  )
}



