/**
 * Decode common HTML entities to their character equivalents.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Derive a safe, openable URL from an `Apply:` field.
 *
 * The field is freeform text that may be a bare URL, a bare domain, or prose
 * containing one or more URLs (e.g. "Apply via the NFVF system: https://lnkd.in/x —
 * details at https://nfvf.co.za"). Returns the first http(s) URL found, or a
 * bare domain promoted to https://. Returns null when no usable link exists —
 * callers must not render an Apply button in that case (a non-URL href such as
 * `https://Apply via the…` resolves to about:blank#blocked in the browser).
 */
export function getApplyUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();

  // First explicit http(s) URL wins; stop at whitespace or the `|` separator.
  const explicit = text.match(/https?:\/\/[^\s|]+/i);
  if (explicit) return explicit[0].replace(/[.,;)\]]+$/, '');

  // Otherwise accept a leading bare domain (e.g. "nfvf.co.za/apply") and add https://.
  const domain = text.match(/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s|]*)?/i);
  if (domain) return `https://${domain[0].replace(/[.,;)\]]+$/, '')}`;

  return null;
}
