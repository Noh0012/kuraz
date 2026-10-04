/** 635 -> "10 min", 3780 -> "1 hr 3 mins" */
export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min${m === 1 ? '' : 's'}` : `${h} hr`;
}

/** Remaining time as in the reference "01 hr 03 mins left". */
export function formatRemaining(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${pad(h)} hr ${pad(m)} mins left` : `${pad(m)} mins left`;
}

/** Countdown clock: 125 -> "02:05", 3725 -> "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "2026-11-01" (a date without time) -> "1 Nov 2026" */
export function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatBirr(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '')
    .replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'K';
}

export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'there';
}

export function percent(score: number, total: number): number {
  return total ? Math.round((score / total) * 100) : 0;
}
