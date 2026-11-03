interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd.supabase.co. Leave unset to run in local test mode. */
  readonly PUBLIC_SUPABASE_URL?: string;
  /** Supabase anon (public) key. Safe in the browser: row-level security protects the data. */
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
