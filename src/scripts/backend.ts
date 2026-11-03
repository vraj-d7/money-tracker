// Whether a real backend is set up. Kept separate from supabase.ts so pages can check it
// without loading the Supabase library.
export const backendOn = !!(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
