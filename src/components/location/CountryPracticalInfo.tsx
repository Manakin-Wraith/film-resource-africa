import { Info, Banknote, Languages, Clock, Zap, Plane } from 'lucide-react';
import type { PracticalInfo } from '@/lib/countries';

interface CountryPracticalInfoProps {
  info: PracticalInfo | null;
  countryName: string;
}

export default function CountryPracticalInfo({ info, countryName }: CountryPracticalInfoProps) {
  if (!info) return null;

  const items = [
    { icon: Banknote, label: 'Currency', value: info.currency, color: 'text-green-400' },
    { icon: Languages, label: 'Languages', value: info.languages.join(', '), color: 'text-blue-400' },
    { icon: Clock, label: 'Timezone', value: info.timezone, color: 'text-amber-400' },
    { icon: Zap, label: 'Power', value: info.power_standard, color: 'text-yellow-400' },
  ];

  return (
    <section aria-label={`Practical production information for ${countryName}`} className="glass-card rounded-[2rem] p-6 border border-white/10">
      <h3 className="flex items-center gap-2 text-lg font-bold font-heading mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
          <Info size={16} className="text-blue-400" />
        </div>
        Production Quick Ref
      </h3>

      <div className="space-y-3">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-start gap-3">
            <div className={`flex-shrink-0 mt-0.5 ${color}`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">{label}</p>
              <p className="text-sm text-foreground/70 leading-snug">{value}</p>
            </div>
          </div>
        ))}

        {info.visa_info && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 text-rose-400">
              <Plane size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Visa & Work Permits</p>
              <p className="text-xs text-foreground/50 leading-relaxed">{info.visa_info}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
