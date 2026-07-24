'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const mono = 'var(--afx-mono)';

/** Signs out of the Supabase session and returns to the AFX login gate. */
export default function AfxSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/afx/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      style={{
        fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
        color: 'var(--afx-muted)', background: 'transparent', border: 'none',
        cursor: 'pointer', padding: '6px 4px',
      }}
    >
      Sign out
    </button>
  );
}
