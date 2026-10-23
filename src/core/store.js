// Safe localStorage helpers (private windows / blocked storage fall back to memory)
const mem = {};
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch { return key in mem ? mem[key] : fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { mem[key] = value; }
  },
  del(key) { try { localStorage.removeItem(key); } catch { delete mem[key]; } },
};

export async function sha256(text) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h;
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export const inr = (n, d = 0) => '₹' + fmt(n, d);
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || 'U';
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Seeded random for reproducible demo data
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function gauss(r) { const u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

export function downloadText(filename, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago';
}
