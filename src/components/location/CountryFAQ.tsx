import type { CountryFAQ as FAQItem } from '@/lib/countries';

interface CountryFAQProps {
  countryName: string;
  faqs: FAQItem[];
}

export default function CountryFAQ({ countryName, faqs }: CountryFAQProps) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 className="text-2xl font-bold font-heading mb-6">
        Frequently Asked Questions about Filming in {countryName}
      </h2>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="rounded-xl border border-white/[0.08] group"
            style={{ background: 'var(--surface)' }}
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="px-6 py-5 cursor-pointer font-bold text-foreground/90 hover:text-primary transition-colors list-none flex items-center justify-between gap-4">
              <span>{faq.question}</span>
              <span className="text-foreground/30 group-open:rotate-45 transition-transform text-xl font-light flex-shrink-0">
                +
              </span>
            </summary>
            <div className="px-6 pb-5 text-foreground/60 leading-relaxed text-sm border-t border-white/5 pt-4">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
