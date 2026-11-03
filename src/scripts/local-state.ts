// Small JSON values kept in this browser (checklists, scan choices). When signed in,
// sync.ts copies them to the account whenever CHANGE_EVENT fires.
export const CHANGE_EVENT = 'inhandy:change';

/** Call after changing anything under `inhandy:*` so it gets synced */
export function noteChange(): void {
  // Marked here, not in sync.ts, so changes made before sync has loaded still get sent
  try {
    localStorage.setItem('inhandy-sync:dirty', String(Date.now()));
  } catch {
    // Storage blocked
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`inhandy:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`inhandy:${key}`, JSON.stringify(value));
    noteChange();
  } catch {
    // Storage blocked: the page still works, it just won't remember
  }
}
