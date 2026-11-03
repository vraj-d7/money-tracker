// Small JSON values kept in this browser (checklists, scan choices) until there's a real backend.
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
  } catch {
    // Storage blocked: the page still works, it just won't remember
  }
}
