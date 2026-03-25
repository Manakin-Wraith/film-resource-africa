'use client';

import ReactMarkdown from 'react-markdown';
import { useRef } from 'react';

/**
 * Strip common scraped boilerplate tails from article content.
 * These are newsletter CTAs, comment policies, JS snippets, etc.
 */
function sanitizeContent(raw: string): string {
  if (!raw) return raw;

  const cutPhrases = [
    'Get our Breaking News Alerts',
    'Comments On Deadline Hollywood',
    'document.getElementById',
    'Sign up for our newsletter',
    'Subscribe to our newsletter',
    'Sign up to receive',
    'Join our mailing list',
    'This article was originally published',
    'Click here to subscribe',
    '.setAttribute( "value"',
    'ak_js_',
  ];

  let content = raw;

  // Strip trailing boilerplate
  for (const phrase of cutPhrases) {
    const idx = content.indexOf(phrase);
    if (idx > 0) content = content.slice(0, idx).trim();
  }

  // Strip scraped metadata preamble (byline, date, tags at top of article)
  // e.g. "by Eric Kohn in Directors, Interviews\non Mar 24, 2026\nCannes Film Festival, Lumière..."
  content = content
    .replace(/^by\s+[^\n]+\n/i, '')
    .replace(/^on\s+\w{3,9}\s+\d{1,2},?\s+\d{4}\n/i, '')
    .replace(/^[A-Z][A-Za-zÀ-ÿ\s,!.:&''""-]{5,80}\n(?=[A-Z])/, '')
    .trim();

  return content;
}

/**
 * Normalise raw article text into proper markdown paragraphs.
 *
 * - If the text already has double-newlines, leave it alone.
 * - If it has single newlines only, promote them to paragraph breaks.
 * - If it's a wall of text with no newlines, split on sentence boundaries
 *   (". " followed by a capital letter) roughly every 2-3 sentences.
 */
function normaliseContent(raw: string): string {
  if (!raw) return raw;

  // Already has paragraph breaks — return as-is
  if (/\n\n/.test(raw)) return raw;

  // Has single newlines — promote to paragraph breaks
  if (/\n/.test(raw)) {
    return raw.replace(/\n/g, '\n\n');
  }

  // Wall of text — split on sentence boundaries (". " before uppercase)
  // Group ~2-3 sentences per paragraph for readability
  const sentences = raw.split(/(?<=\.)\s+(?=[A-Z\u201C\u2018"])/);
  if (sentences.length <= 2) return raw;

  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const s of sentences) {
    current.push(s);
    if (current.length >= 3) {
      paragraphs.push(current.join(' '));
      current = [];
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));

  return paragraphs.join('\n\n');
}

export default function MarkdownBody({ content }: { content: string }) {
  const pCount = useRef(0);
  // Reset counter on each render
  pCount.current = 0;

  const normalisedContent = normaliseContent(sanitizeContent(content));

  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold font-heading mt-10 mb-4 text-foreground/90">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold font-heading mt-8 mb-3 text-foreground/85">
            {children}
          </h3>
        ),
        p: ({ children }) => {
          pCount.current += 1;
          const isFirst = pCount.current === 1;
          return (
            <p className={`leading-relaxed mb-6 ${
              isFirst
                ? 'text-xl text-foreground/90 first-letter:text-5xl first-letter:font-bold first-letter:font-heading first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-primary'
                : 'text-lg text-foreground/80'
            }`}>
              {children}
            </p>
          );
        },
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-6 mb-6 space-y-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-6 mb-6 space-y-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground/80 text-lg leading-relaxed">
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-foreground/90">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/70">{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        hr: () => (
          <hr className="border-white/10 my-8" />
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 pl-6 italic text-foreground/60 my-8 text-lg">
            {children}
          </blockquote>
        ),
      }}
    >
      {normalisedContent}
    </ReactMarkdown>
  );
}
