import { Metadata } from 'next';
import { Suspense } from 'react';
import { getPublicProjects } from '@/app/actions';
import ProjectsClient from '@/components/ProjectsClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewsletterCTA from '@/components/NewsletterCTA';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Projects — African Films in Development | Film Resource Africa',
  description:
    'Discover African film and series projects in development — loglines, formats, and what each team is seeking, from Film Resource Africa members.',
  openGraph: {
    title: 'Projects — African Films in Development | Film Resource Africa',
    description: 'African film and series projects in development, seeking partners, funding, and distribution.',
    siteName: 'Film Resource Africa',
  },
  twitter: {
    card: 'summary',
    title: 'Projects — African Films in Development',
    description: 'African film and series projects in development, seeking partners, funding, and distribution.',
  },
  alternates: {
    canonical: 'https://film-resource-africa.com/projects',
  },
};

export default async function ProjectsPage() {
  const projects = await getPublicProjects();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Projects', href: '/projects' },
          ]}
        />

        <header>
          <div className="section-rule section-rule-accent" />
          <span className="section-rubric">The Slate</span>
          <div className="flex items-baseline justify-between">
            <h1 className="text-[26px] md:text-[38px] font-bold font-heading leading-tight text-foreground">
              African films in development
            </h1>
            <span className="text-sm font-medium ml-4 shrink-0" style={{ color: 'var(--foreground-tertiary)' }}>
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: 'var(--foreground-secondary)' }}>
            Projects shared by Film Resource Africa members — what they are, where they are, and what each team is
            seeking. Find a project to back, partner on, or distribute.
          </p>
        </header>

        <Suspense fallback={null}>
          <ProjectsClient initialData={projects} />
        </Suspense>

        <NewsletterCTA
          variant="banner"
          heading="Have a project of your own?"
          subtext="Join Film Resource Africa, run a free Project Readiness assessment, and share your project with partners and funders."
        />
      </div>
    </main>
  );
}
