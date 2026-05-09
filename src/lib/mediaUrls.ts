/**
 * Normalize media URLs entered by members during onboarding.
 *
 * Members frequently paste YouTube/Vimeo "watch" URLs into the reel field
 * and bare hostnames (e.g. "www.example.com") into image fields. The render
 * layer can't trust the stored value as-is.
 */

/**
 * Heuristic: does this URL look like it points at an image (vs. a website)?
 * Used in server components where we can't attach an onError handler.
 * Returns false for plain hostnames like "www.example.com".
 */
export function looksLikeImageUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const url = toAbsoluteUrl(raw);
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (/\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/.test(path)) return true;
    const host = u.hostname.toLowerCase();
    /* Known image-serving hosts where extensions may be omitted. */
    const imageHosts = [
      'supabase.co', 'supabase.in',
      'googleusercontent.com', 'ggpht.com',
      'cloudinary.com', 'res.cloudinary.com',
      'imgur.com', 'i.imgur.com',
      'imagekit.io', 'ik.imagekit.io',
      'gravatar.com',
      'unsplash.com', 'images.unsplash.com',
      'amazonaws.com', 's3.amazonaws.com',
      'cdn.shopify.com',
      'wp.com', 'files.wordpress.com',
      'squarespace-cdn.com',
      'wixstatic.com',
      'dropboxusercontent.com',
    ];
    if (imageHosts.some(h => host === h || host.endsWith(`.${h}`))) return true;
    return false;
  } catch {
    return false;
  }
}

/** Add https:// to a bare hostname; return null for empty/invalid input. */
export function toAbsoluteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|\/\/)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

export type ReelHost = 'youtube' | 'vimeo' | 'drive' | 'unknown';

/**
 * Detect which reel host a URL belongs to. Used by the render layer to decide
 * between iframe embed (known hosts) and external-link fallback (unknown).
 */
export function detectReelHost(raw: string | null | undefined): ReelHost {
  const url = toAbsoluteUrl(raw);
  if (!url) return 'unknown';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') return 'youtube';
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'vimeo';
    if (host === 'drive.google.com') return 'drive';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Convert a YouTube/Vimeo/Drive URL to an embeddable iframe src.
 * - YouTube `watch?v=ID`, `youtu.be/ID`, `shorts/ID`  →  `youtube.com/embed/ID`
 * - Vimeo   `vimeo.com/ID`                            →  `player.vimeo.com/video/ID`
 * - Drive   `drive.google.com/file/d/ID/view`         →  `drive.google.com/file/d/ID/preview`
 * Already-embed URLs are returned unchanged. Unknown hosts pass through.
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  const url = toAbsoluteUrl(raw);
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    /* YouTube */
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) return url;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shorts = u.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
      const live = u.pathname.match(/^\/live\/([^/?#]+)/);
      if (live) return `https://www.youtube.com/embed/${live[1]}`;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    /* Vimeo */
    if (host === 'vimeo.com') {
      const id = u.pathname.replace(/^\//, '').split(/[/?#]/)[0];
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === 'player.vimeo.com') return url;

    /* Google Drive — file/d/{ID}/view → /preview (idempotent) */
    if (host === 'drive.google.com') {
      const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }

    return url;
  } catch {
    return url;
  }
}
