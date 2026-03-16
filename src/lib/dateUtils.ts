/**
 * Client-side date utilities for localized dates and relative time formatting.
 * Uses Intl.DateTimeFormat and Intl.RelativeTimeFormat for automatic timezone detection.
 */

/** Get the user's timezone abbreviation (e.g., "WAT", "EAT", "SAST", "GMT") */
export function getUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Get short timezone name
    const short = new Date().toLocaleTimeString('en-US', {
      timeZoneName: 'short',
      timeZone: tz,
    });
    // Extract the timezone part (e.g., "3:07:00 PM WAT" → "WAT")
    const parts = short.split(' ');
    return parts[parts.length - 1] || tz;
  } catch {
    return 'UTC';
  }
}

/** Get the user's full timezone name (e.g., "Africa/Lagos") */
export function getUserTimezoneFull(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Format a date as relative time: "2 hours ago", "Yesterday", "3 days ago", etc. */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  // Fallback to localized date
  return formatLocalDate(dateStr);
}

/** Format a date in the user's local format: "14 Mar 2026" */
export function formatLocalDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a date with time in the user's local timezone: "14 Mar 2026, 3:07 PM" */
export function formatLocalDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Calculate days remaining until a deadline. Returns negative if past. */
export function daysUntil(dateStr: string): number {
  const deadline = new Date(dateStr);
  const now = new Date();
  // Reset to midnight for day-level comparison
  deadline.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const NEW_WINDOW_DAYS = 14;

/** Check if a listing was recently created (within NEW_WINDOW_DAYS) */
export function isNewListing(createdAt?: string | null, id?: number): boolean {
  if (createdAt) {
    const created = new Date(createdAt);
    if (!isNaN(created.getTime())) {
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= NEW_WINDOW_DAYS;
    }
  }
  // Fallback: IDs 56-65 were added on March 16, 2026
  if (id && id >= 56 && id <= 65) return true;
  return false;
}

/** Check if a listing was recently updated (within NEW_WINDOW_DAYS, and updated after creation) */
export function isUpdatedListing(createdAt?: string | null, updatedAt?: string | null, id?: number): boolean {
  if (createdAt && updatedAt) {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    if (!isNaN(created.getTime()) && !isNaN(updated.getTime())) {
      if (updated.getTime() <= created.getTime() + 60000) return false; // within 1min = same event
      const now = new Date();
      const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= NEW_WINDOW_DAYS;
    }
  }
  // Fallback: IDs 7 and 38 were updated on March 16, 2026
  if (id && (id === 7 || id === 38)) return true;
  return false;
}

/** Format a deadline with countdown: "2 Apr 2026 · 19 days left" */
export function formatDeadline(dateStr: string): {
  dateFormatted: string;
  daysLeft: number;
  countdownText: string;
  urgency: 'critical' | 'warning' | 'normal' | 'passed';
} {
  const daysLeft = daysUntil(dateStr);
  const dateFormatted = formatLocalDate(dateStr);

  let countdownText: string;
  let urgency: 'critical' | 'warning' | 'normal' | 'passed';

  if (daysLeft < 0) {
    countdownText = 'Closed';
    urgency = 'passed';
  } else if (daysLeft === 0) {
    countdownText = 'Closes today!';
    urgency = 'critical';
  } else if (daysLeft === 1) {
    countdownText = 'Closes tomorrow!';
    urgency = 'critical';
  } else if (daysLeft <= 7) {
    countdownText = `${daysLeft} days left`;
    urgency = 'critical';
  } else if (daysLeft <= 21) {
    countdownText = `${daysLeft} days left`;
    urgency = 'warning';
  } else {
    countdownText = `${daysLeft} days left`;
    urgency = 'normal';
  }

  return { dateFormatted, daysLeft, countdownText, urgency };
}
