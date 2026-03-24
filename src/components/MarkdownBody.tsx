'use client';

import ReactMarkdown from 'react-markdown';
import { useRef } from 'react';

export default function MarkdownBody({ content }: { content: string }) {
  const pCount = useRef(0);
  // Reset counter on each render
  pCount.current = 0;

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
      {content}
    </ReactMarkdown>
  );
}
