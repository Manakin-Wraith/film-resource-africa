import ReactMarkdown from 'react-markdown';
import { decodeHtmlEntities } from '@/lib/textUtils';

/**
 * Markdown renderer for opportunity field content (About, Eligibility,
 * What You Get, etc.). Extracted from the former OpportunityModal so the
 * /opportunities/[slug] page renders fields identically.
 */
export default function OpportunityMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="text-sm leading-relaxed text-foreground/75 mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed text-foreground/75">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-foreground/90">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            {children}
          </a>
        ),
        h3: ({ children }) => <h3 className="text-sm font-bold text-foreground/85 mt-3 mb-1">{children}</h3>,
      }}
    >
      {decodeHtmlEntities(text)}
    </ReactMarkdown>
  );
}
