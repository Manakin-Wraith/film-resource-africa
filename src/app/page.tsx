import { getOpportunities } from './actions';
import DirectoryClient from '@/components/DirectoryClient';

export default async function Home() {
  const opportunities = await getOpportunities();

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="mb-16 text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            African Film Opportunities
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto">
            A curated directory of global screenwriting labs, co-production funds, and pitch forums for African creators.
          </p>
        </header>

        <DirectoryClient initialData={opportunities} />
      </div>
    </main>
  );
}
