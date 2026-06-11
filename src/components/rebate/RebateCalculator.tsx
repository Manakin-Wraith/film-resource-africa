'use client';

/**
 * Rebate & Net Exposure Calculator — Tier 1 form + Result Card.
 *
 * This is the interactive island on /rebate-calculator. It runs the pure
 * `calculate()` engine from @/lib/rebate/calculate on every keystroke, so the
 * Result Card stays live as the producer plays with inputs. No backend call
 * in v1 — everything is computed client-side against the versioned rate card.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  XCircle,
} from 'lucide-react';
import { calculate, formatRand } from '@/lib/rebate/calculate';
import { DTIC_PROGRAMMES, NON_DTIC_LAYERS, PROGRAMME_ORDER } from '@/lib/rebate/rates';
import type {
  BbbeeLevel,
  CalculatorTier1Inputs,
  Currency,
  DticProgrammeId,
  ProductionFormat,
  ProgrammeStatus,
} from '@/lib/rebate/types';

const FORMATS: { value: ProductionFormat; label: string }[] = [
  { value: 'feature', label: 'Feature film' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'series', label: 'Series / limited series' },
  { value: 'animation', label: 'Animation' },
  { value: 'tv-movie', label: 'TV movie' },
  { value: 'commercial', label: 'Commercial (ineligible)' },
];

const BBBEE_LEVELS: { value: BbbeeLevel; label: string }[] = [
  { value: 1, label: 'Level 1' },
  { value: 2, label: 'Level 2' },
  { value: 3, label: 'Level 3' },
  { value: 4, label: 'Level 4' },
  { value: 5, label: 'Level 5' },
  { value: 6, label: 'Level 6' },
  { value: 7, label: 'Level 7' },
  { value: 8, label: 'Level 8' },
  { value: 'none', label: 'Non-compliant / none' },
  { value: 'unsure', label: "I'm not sure yet" },
];

const STATUS_PILL: Record<
  ProgrammeStatus,
  { label: string; className: string }
> = {
  live: {
    label: 'Live',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  },
  restricted: {
    label: 'Restricted — payouts delayed',
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  },
  paused: {
    label: 'Paused — no approvals',
    className: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  },
  'cycle-closed': {
    label: 'Cycle closed',
    className: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
  },
  unknown: {
    label: 'Status unverified',
    className: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
  },
};

const DEFAULT_INPUTS: CalculatorTier1Inputs = {
  totalBudget: 40_000_000,
  currency: 'ZAR',
  qsapePercent: 0.7,
  saShootDays: 30,
  format: 'feature',
  programmeId: 'sa-production',
  bbbeeLevel: 3,
  blackHodPercent: 30,
  blackOwnedServiceCo: false,
  fxRateZarPerUsd: 18.5,
};

export default function RebateCalculator() {
  const [inputs, setInputs] = useState<CalculatorTier1Inputs>(DEFAULT_INPUTS);

  const result = useMemo(() => calculate(inputs), [inputs]);
  const programme = DTIC_PROGRAMMES[inputs.programmeId];
  const pill = STATUS_PILL[programme.status];

  const update = <K extends keyof CalculatorTier1Inputs>(
    key: K,
    value: CalculatorTier1Inputs[K],
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  const incentivePct =
    result.totalBudgetZAR > 0
      ? (result.totalIncentivesZAR / result.totalBudgetZAR) * 100
      : 0;

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
      {/* Form */}
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl">Your production</h2>
          <p className="text-sm text-foreground/60 mt-1">
            All fields update the result in real time. Nothing is saved until
            you export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <Field label="Total budget">
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={inputs.currency}
                  onChange={(e) => update('currency', e.target.value as Currency)}
                  className={selectClass('w-[5.5rem] pr-8')}
                  aria-label="Budget currency"
                >
                  <option value="ZAR">ZAR</option>
                  <option value="USD">USD</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40"
                />
              </div>
              <input
                type="number"
                min={0}
                step={100_000}
                value={inputs.totalBudget}
                onChange={(e) =>
                  update('totalBudget', Number(e.target.value) || 0)
                }
                className={inputClass('flex-1 font-mono')}
                aria-label="Total budget"
              />
            </div>
            {inputs.currency === 'USD' && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2">
                <span className="text-xs font-medium text-foreground/60 whitespace-nowrap">FX (ZAR per USD):</span>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={inputs.fxRateZarPerUsd}
                  onChange={(e) =>
                    update('fxRateZarPerUsd', Number(e.target.value) || 0)
                  }
                  className={inputClass('w-28 py-1.5 text-sm font-mono')}
                  aria-label="FX rate ZAR per USD"
                />
              </div>
            )}
          </Field>

          <Field
            label="QSAPE"
            hint="SA spend as % of total. Industry typical: 60–80%."
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(inputs.qsapePercent * 100)}
                onChange={(e) =>
                  update('qsapePercent', Number(e.target.value) / 100)
                }
                className="flex-1 accent-primary"
                aria-label="QSAPE percentage"
              />
              <span className="w-14 text-right font-mono text-sm">
                {Math.round(inputs.qsapePercent * 100)}%
              </span>
            </div>
          </Field>

          <Field label="Production format">
            <div className="relative">
              <select
                value={inputs.format}
                onChange={(e) =>
                  update('format', e.target.value as ProductionFormat)
                }
                className={selectClass('pr-9')}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40"
              />
            </div>
          </Field>

          <Field label="SA shoot days">
            <input
              type="number"
              min={0}
              step={1}
              value={inputs.saShootDays}
              onChange={(e) =>
                update('saShootDays', Number(e.target.value) || 0)
              }
              className={inputClass()}
            />
          </Field>

          <Field label="DTIC programme" className="md:col-span-2">
            <div className="relative">
              <select
                value={inputs.programmeId}
                onChange={(e) =>
                  update('programmeId', e.target.value as DticProgrammeId)
                }
                className={selectClass('w-full pr-9')}
              >
                {PROGRAMME_ORDER.map((id) => {
                  const p = DTIC_PROGRAMMES[id];
                  return (
                    <option key={id} value={id}>
                      {p.label} — base {Math.round(p.baseRate * 100)}%
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${pill.className}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {pill.label}
              </span>
              <span className="text-xs text-foreground/50">
                Cap {formatRand(programme.capZAR)} · min QSAPE{' '}
                {formatRand(
                  inputs.format === 'documentary'
                    ? programme.minQsapeDocsZAR
                    : programme.minQsapeZAR,
                )}
              </span>
            </div>
          </Field>

          <Field label="Production company B-BBEE level">
            <div className="relative">
              <select
                value={String(inputs.bbbeeLevel)}
                onChange={(e) => {
                  const v = e.target.value;
                  const parsed: BbbeeLevel =
                    v === 'none' || v === 'unsure'
                      ? (v as BbbeeLevel)
                      : (Number(v) as BbbeeLevel);
                  update('bbbeeLevel', parsed);
                }}
                className={selectClass('pr-9')}
              >
                {BBBEE_LEVELS.map((b) => (
                  <option key={String(b.value)} value={String(b.value)}>
                    {b.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40"
              />
            </div>
          </Field>

          {programme.bonus?.drivenBy === 'blackHodPercent' ? (
            <Field
              label="% of HODs who are black SA citizens"
              hint={`+${Math.round((programme.bonus?.rate ?? 0) * 100)}% bonus when ≥ ${programme.bonus?.threshold ?? 0}%.`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={inputs.blackHodPercent}
                  onChange={(e) =>
                    update('blackHodPercent', Number(e.target.value) || 0)
                  }
                  className="flex-1 accent-primary"
                  aria-label="Black HOD percentage"
                />
                <span className="w-14 text-right font-mono text-sm">
                  {inputs.blackHodPercent}%
                </span>
              </div>
            </Field>
          ) : programme.bonus?.drivenBy === 'blackOwnedServiceCo' ? (
            <Field
              label="Service company structure"
              hint={`+${Math.round((programme.bonus?.rate ?? 0) * 100)}% bonus with black-owned SA service co.`}
            >
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.15] bg-white/[0.08] cursor-pointer hover:bg-white/[0.12] transition">
                <input
                  type="checkbox"
                  checked={!!inputs.blackOwnedServiceCo}
                  onChange={(e) =>
                    update('blackOwnedServiceCo', e.target.checked)
                  }
                  className="accent-primary"
                />
                <span className="text-sm">
                  Shooting + post in SA via black-owned service company
                </span>
              </label>
            </Field>
          ) : (
            <Field label="Bonus uplift">
              <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-foreground/60">
                This programme has no additional bonus tier — the base rate
                already reflects the maximum.
              </div>
            </Field>
          )}
        </div>

        <p className="text-xs text-foreground/50 pt-2 border-t border-white/5">
          Source: <em>a Guide to the dtic Incentive Schemes 2025/26</em>. This
          is an indicative estimate, not a binding ruling.
        </p>
      </div>

      {/* Result Card */}
      <div className="space-y-5 lg:sticky lg:top-28">
        <ResultCard
          result={result}
          incentivePct={incentivePct}
          statusPill={pill}
        />
        <NonDticLayers />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-2 ${className ?? ''}`}>
      <span className="text-sm font-semibold text-foreground/90 tracking-wide">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-foreground/50 mt-1.5 leading-relaxed">{hint}</span>
      )}
    </label>
  );
}

function inputClass(extra = '') {
  return `w-full rounded-xl bg-white/[0.08] border border-white/[0.15] focus:border-primary/60 focus:ring-2 focus:ring-primary/25 outline-none px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/50 transition ${extra}`;
}

function selectClass(extra = '') {
  return `${inputClass(extra)} appearance-none cursor-pointer`;
}

function ResultCard({
  result,
  incentivePct,
  statusPill,
}: {
  result: ReturnType<typeof calculate>;
  incentivePct: number;
  statusPill: { label: string; className: string };
}) {
  const { programme } = result;

  const blockingFlags = result.flags.filter((f) => f.severity === 'block');
  const warningFlags = result.flags.filter((f) => f.severity === 'warn');
  const isContingent =
    programme.status === 'paused' || programme.status === 'restricted';

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/60 font-semibold">
            Estimated result
          </div>
          <h2 className="font-heading font-bold text-2xl mt-1">
            {programme.label}
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${statusPill.className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {statusPill.label}
        </span>
      </div>

      {/* Headline — Net Exposure */}
      <div className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
        <div className="text-xs uppercase tracking-wider text-foreground/60 font-semibold">
          Net exposure — money you still need to find
        </div>
        <div className="text-3xl md:text-4xl font-heading font-bold mt-1 tabular-nums">
          {formatRand(result.netExposureZAR)}
        </div>
        <div className="text-xs text-foreground/60 mt-1">
          {Math.round(incentivePct * 10) / 10}% of your total budget covered by
          modelled incentives
          {isContingent && (
            <span className="text-amber-300/90">
              {' '}
              &middot; contingent on DTIC payout
            </span>
          )}
        </div>
      </div>

      {/* Waterfall */}
      <dl className="space-y-2 text-sm">
        <Row label="Total budget" value={formatRand(result.totalBudgetZAR)} />
        <Row
          label="QSAPE (SA spend)"
          value={formatRand(result.qsapeZAR)}
          muted
        />
        <Row
          label={`DTIC base rebate (${Math.round(programme.baseRate * 100)}%)`}
          value={`− ${formatRand(result.dticBaseRebateZAR)}`}
          positive
        />
        {result.dticBonusZAR > 0 && (
          <Row
            label={`Bonus (+${Math.round((programme.bonus?.rate ?? 0) * 100)}%)`}
            value={`− ${formatRand(result.dticBonusZAR)}`}
            positive
          />
        )}
        {result.dticRebateGrossZAR > programme.capZAR &&
          result.isEligible && (
            <Row
              label={`Cap applied (${formatRand(programme.capZAR)} max)`}
              value={`+ ${formatRand(result.dticRebateGrossZAR - programme.capZAR)}`}
              muted
            />
          )}
        <Row
          label="DTIC rebate (after cap)"
          value={`− ${formatRand(result.dticRebateZAR)}`}
          strong
          positive
        />
        <Row
          label="Net exposure"
          value={formatRand(result.netExposureZAR)}
          strong
        />
      </dl>

      {/* Flags */}
      {(blockingFlags.length > 0 || warningFlags.length > 0) && (
        <div className="space-y-2">
          {blockingFlags.map((f) => (
            <Flag key={f.code} severity="block" message={f.message} />
          ))}
          {warningFlags.map((f) => (
            <Flag key={f.code} severity="warn" message={f.message} />
          ))}
        </div>
      )}

      {result.isEligible && blockingFlags.length === 0 && (
        <div className="flex items-start gap-2 text-sm text-emerald-300/90">
          <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
          <span>
            Your project passes the eligibility gates for this programme.
            Verification audit still required before an actual claim.
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-foreground/50">
        <span>{programme.source}</span>
        <span>Verified {programme.verifiedOn}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  positive,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  positive?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-1 ${
        strong ? 'border-t border-white/10 pt-3 mt-1 font-semibold' : ''
      }`}
    >
      <dt className={muted ? 'text-foreground/50' : 'text-foreground/75'}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          positive ? 'text-emerald-300' : 'text-foreground'
        } ${strong ? 'text-base' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Flag({
  severity,
  message,
}: {
  severity: 'block' | 'warn';
  message: string;
}) {
  const isBlock = severity === 'block';
  const Icon = isBlock ? XCircle : AlertTriangle;
  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm border ${
        isBlock
          ? 'bg-rose-500/10 border-rose-400/30 text-rose-200'
          : 'bg-amber-500/10 border-amber-400/30 text-amber-200'
      }`}
      role={isBlock ? 'alert' : 'note'}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function NonDticLayers() {
  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Info size={16} className="text-primary" />
        <h3 className="font-heading font-semibold text-base">
          Stackable layers (shipping next)
        </h3>
      </div>
      <p className="text-xs text-foreground/60">
        v1 models the DTIC layer only. NFVF and sub-national incentives are
        placeholders until we&rsquo;ve verified tier structure with the
        authorities &mdash; we&rsquo;ll notify you when they go live.
      </p>
      <ul className="space-y-2">
        {NON_DTIC_LAYERS.map((layer) => (
          <li
            key={layer.id}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div>
              <div className="font-medium text-foreground/85">
                {layer.label}
              </div>
              <div className="text-xs text-foreground/55 mt-0.5">
                {layer.note}
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/60 whitespace-nowrap">
              {layer.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
