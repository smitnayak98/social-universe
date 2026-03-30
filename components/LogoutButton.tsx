'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function LogoutButton() {
  const router = useRouter()
  async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
      Sign Out
    </button>
  )
}
