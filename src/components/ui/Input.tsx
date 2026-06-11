'use client';

import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* Shared form-control primitives. Field look matches the dominant pattern
   (directory search bars / footer newsletter): surface-raised fill, line-mid
   border, rounded-xl, text-sm, /50 placeholder, border-primary on focus.
   The global :focus-visible outline (globals.css) provides the keyboard ring. */

const fieldClasses =
  'w-full bg-surface-raised border border-line-mid rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus:border-primary/60 transition-colors';

interface FieldChromeProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldChrome({ id, label, hint, error, required, children }: FieldChromeProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-urgent ml-1" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-foreground/50">{hint}</p>}
      {error && (
        <p className="text-urgent text-xs flex items-center gap-1" role="alert">
          <AlertCircle size={12} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: LucideIcon;
  /** Renders the shared "Clear" affordance used by the directory search bars */
  onClear?: () => void;
}

export default function Input({
  label,
  hint,
  error,
  leftIcon: LeftIcon,
  onClear,
  required,
  className = '',
  id: idProp,
  value,
  ...rest
}: InputProps) {
  const autoId = useId();
  // Only attach an id when a label needs htmlFor — components SSR'd inside a
  // Suspense boundary (useSearchParams pages) get unstable useId values.
  const id = idProp ?? (label ? autoId : undefined);

  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {LeftIcon && (
          <LeftIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" aria-hidden />
        )}
        <input
          id={id}
          required={required}
          value={value}
          className={`${fieldClasses} ${LeftIcon ? 'pl-[3.25rem]' : ''} ${onClear ? 'pr-16' : ''} ${className}`}
          {...rest}
        />
        {onClear && value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors text-sm font-medium"
          >
            Clear
          </button>
        ) : null}
      </div>
    </FieldChrome>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, required, className = '', id: idProp, ...rest }: TextareaProps) {
  const autoId = useId();
  const id = idProp ?? (label ? autoId : undefined);
  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required}>
      <textarea id={id} required={required} className={`${fieldClasses} min-h-[120px] resize-vertical ${className}`} {...rest} />
    </FieldChrome>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

// PRS-style data-URI chevron so the control looks consistent cross-browser
const selectChevron =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaaaaa' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")";

export function Select({ label, hint, error, required, className = '', id: idProp, children, ...rest }: SelectProps) {
  const autoId = useId();
  const id = idProp ?? (label ? autoId : undefined);
  return (
    <FieldChrome id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        required={required}
        className={`${fieldClasses} appearance-none pr-11 cursor-pointer [&>option]:bg-surface-raised ${className}`}
        style={{ backgroundImage: selectChevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        {...rest}
      >
        {children}
      </select>
    </FieldChrome>
  );
}
