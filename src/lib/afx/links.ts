/** Returns the URL only if it parses as an absolute http(s) URL; else undefined.
 *  Guards against javascript:/data: URIs in producer-entered links (stored XSS). */
export function safeHttpUrl(u: string | undefined): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
