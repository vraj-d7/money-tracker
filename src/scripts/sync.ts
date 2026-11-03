// Keeps everything saved under `inhandy:*` in this browser in step with the signed-in account.
// Last change wins: local edits are pushed straight away; on load, a newer copy from another
// device replaces what's here and the page reloads once to show it.
import { supabase } from './supabase';
import { CHANGE_EVENT } from './local-state';

const PREFIX = 'inhandy:';
// Bookkeeping lives outside the inhandy: prefix so it never syncs itself
const DIRTY = 'inhandy-sync:dirty';
const SEEN = 'inhandy-sync:seen';

const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // Storage blocked: nothing to sync
  }
};

// What's stored in user_data.data. Format 2 keeps each value as real JSON
// ({"profile": {"name": "Priya", …}}) so it reads cleanly in the Supabase dashboard.
// Rows saved before that (no `_format`) hold each value as a JSON string instead.
const FORMAT = 2;
type AccountData = Record<string, unknown>;

export function snapshot(): AccountData {
  const out: AccountData = { _format: FORMAT };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(k)!;
      try {
        out[k.slice(PREFIX.length)] = JSON.parse(raw);
      } catch {
        out[k.slice(PREFIX.length)] = raw; // not JSON (shouldn't happen): keep as text
      }
    }
  } catch {
    // Storage blocked
  }
  return out;
}

/** Replace everything saved in this browser with the account's `data` (either format) */
export function applySnapshot(data: AccountData) {
  const { _format, ...items } = data;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    Object.entries(items).forEach(([k, v]) =>
      localStorage.setItem(PREFIX + k, _format === FORMAT ? JSON.stringify(v) : String(v)),
    );
  } catch {
    // Storage blocked
  }
}

/** Forget this browser's copy (used on log out and account deletion) */
export function clearLocal() {
  applySnapshot({});
  set(DIRTY, null);
  set(SEEN, null);
}

async function userId() {
  const { data } = await supabase!.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Send this browser's data to the account now. Resolves when saved (or when there's nothing to do). */
export async function pushNow() {
  const id = supabase && (await userId());
  const dirtyAt = get(DIRTY);
  if (!id || !dirtyAt) return;
  const { data, error } = await supabase!
    .from('user_data')
    .upsert({ user_id: id, data: snapshot(), updated_at: new Date().toISOString() })
    .select('updated_at')
    .single();
  if (error) return; // stays dirty; tried again on the next change or page load
  set(SEEN, data.updated_at);
  // Only clear if nothing changed while saving
  if (get(DIRTY) === dirtyAt) set(DIRTY, null);
}

/** Fetch the account's copy. Returns true if it replaced what's in this browser. */
export async function pullNow(): Promise<boolean> {
  const id = supabase && (await userId());
  if (!id) return false;
  const { data, error } = await supabase!.from('user_data').select('data, updated_at').eq('user_id', id).maybeSingle();
  if (error || !data) return false;
  if (data.updated_at === get(SEEN)) return false;
  applySnapshot(data.data as AccountData);
  set(SEEN, data.updated_at);
  set(DIRTY, null);
  return true;
}

/**
 * Right after signing in: a returning account brings its saved data into this browser;
 * a new one starts from whatever was done here before signing in. Throws if the database can't be reached.
 */
export async function adoptAccount(): Promise<'returning' | 'new'> {
  const id = await userId();
  if (!id) throw new Error('Not signed in');
  const { data, error } = await supabase!.from('user_data').select('data, updated_at').eq('user_id', id).maybeSingle();
  if (error) throw error;
  if (data) {
    applySnapshot(data.data as AccountData);
    set(SEEN, data.updated_at);
    set(DIRTY, null);
    return 'returning';
  }
  set(DIRTY, String(Date.now()));
  await pushNow();
  return 'new';
}

let timer = 0;
export function startSync() {
  // The sign-in callback page handles the first sync itself
  if (!supabase || window.location.pathname.startsWith('/auth/')) return;
  window.addEventListener(CHANGE_EVENT, () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(pushNow, 800);
  });
  // Unsaved changes from the last page (e.g. saved right before a redirect) go first;
  // otherwise check whether another device saved something newer.
  if (get(DIRTY)) pushNow();
  else
    pullNow().then((changed) => {
      if (changed) window.location.reload();
    });
}
