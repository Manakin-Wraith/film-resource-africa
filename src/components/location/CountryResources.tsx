import { ExternalLink, Landmark, Banknote, Users, Award, Ticket, Link2 } from 'lucide-react';
import type { KeyResource, IndustryAssociation } from '@/lib/countries';

const resourceTypeConfig: Record<string, { label: string; icon: typeof Landmark; color: string; bg: string }> = {
  government: { label: 'Government', icon: Landmark, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
  fund: { label: 'Funding', icon: Banknote, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/25' },
  guild: { label: 'Guild', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/25' },
  association: { label: 'Association', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25' },
  festival_org: { label: 'Festival', icon: Ticket, color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/25' },
  other: { label: 'Resource', icon: Link2, color: 'text-foreground/60', bg: 'bg-white/10 border-white/15' },
};

interface CountryResourcesProps {
  resources: KeyResource[];
  associations: IndustryAssociation[];
  countryName: string;
}

export default function CountryResources({ resources, associations, countryName }: CountryResourcesProps) {
  if (resources.length === 0 && associations.length === 0) return null;

  return (
    <section id="resources-links" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
          <Link2 size={20} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Key Resources</h2>
          <p className="text-foreground/40 text-sm">
            Essential organisations, funds, and industry bodies in {countryName}
          </p>
        </div>
      </div>

      {/* Key Resources Grid */}
      {resources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((resource) => {
            const config = resourceTypeConfig[resource.type] || resourceTypeConfig.other;
            const Icon = config.icon;
            return (
              <div
                key={resource.name}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.color}`}>
                    <Icon size={10} />
                    {config.label}
                  </span>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/30 hover:text-primary transition-colors flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <h3 className="font-bold font-heading text-sm mb-1.5 group-hover:text-primary transition-colors leading-tight">
                  {resource.url ? (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.name}
                    </a>
                  ) : (
                    resource.name
                  )}
                </h3>
                <p className="text-foreground/50 text-xs leading-relaxed line-clamp-3">
                  {resource.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Industry Associations */}
      {associations.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">
            <Users size={14} /> Industry Associations & Guilds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {associations.map((assoc) => (
              <div
                key={assoc.name}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users size={14} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {assoc.website ? (
                      <a
                        href={assoc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {assoc.name}
                      </a>
                    ) : (
                      assoc.name
                    )}
                  </p>
                  <p className="text-foreground/40 text-xs mt-0.5 line-clamp-2">{assoc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
