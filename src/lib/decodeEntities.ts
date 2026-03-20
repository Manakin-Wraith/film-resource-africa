/**
 * Decode HTML entities in a string.
 * Handles numeric (&#8216;), hex (&#x27;), and named entities (&amp;).
 * Use as a safety net for RSS/email data that may contain encoded characters.
 */
export function decodeEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strip HTML tags from a string and clean up whitespace.
 * Decodes entities first so encoded tags like &lt;p&gt; are also caught.
 * Use for card summaries where only plain text should be displayed.
 */
export function cleanText(str: string): string {
  if (!str) return str;
  let s = decodeEntities(str);
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}
