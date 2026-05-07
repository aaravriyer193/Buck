import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(n: number, opts: { precision?: number } = {}) {
  const p = opts.precision ?? (n < 1 ? 4 : 2);
  return `$${n.toFixed(p)}`;
}

// =============================================================================
// Hydration-safe date formatting
// =============================================================================
// `toLocaleString` formats differently on server vs client (server is UTC,
// browser is local), which makes Next.js scream about hydration mismatches.
// These helpers always render in UTC with a deterministic format so server and
// client agree byte-for-byte.
// =============================================================================

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hh}:${mm}`;
}

export function formatTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function relativeTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(date);
}

export function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}