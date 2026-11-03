// Whether a real backend is set up. Kept separate from supabase.ts so pages can check it
// without loading the Supabase library.
const url = import.meta.env.PUBLIC_SUPABASE_URL;

export const backendOn = !!(url && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

/** Where supabase-js keeps the signed-in session in localStorage (its default key) */
export const authStorageKey = backendOn ? `sb-${new URL(url!).hostname.split('.')[0]}-auth-token` : '';

/** The app itself and onboarding need an account; the landing page, legal and sign-in pages don't */
export const SIGNED_IN_PATHS = /^\/(app|welcome)(\/|$)/;

/** Remembers where to go back to after signing in (outside `inhandy:` so it never syncs) */
export const NEXT_KEY = 'inhandy-next';

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}
