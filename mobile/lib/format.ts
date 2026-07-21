// Always pinned to 'en-US' so dates/numbers render in Western numerals
// regardless of device system locale — mirrors the app's own language
// selection rather than following the OS, and stays consistent with how
// prices are already formatted (toFixed/parseFloat, which are locale-proof).
export function formatDate(
  dateStr: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', opts);
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(
  val: number | string | null | undefined,
  opts?: Intl.NumberFormatOptions
): string {
  if (val == null || val === '') return '—';
  const n = typeof val === 'string' ? Number(val) : val;
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', opts);
}
