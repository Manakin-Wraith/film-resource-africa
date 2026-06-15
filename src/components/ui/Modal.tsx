'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

/* The one modal shell. Owns the behaviors every modal previously implemented
   (or forgot): body scroll lock, Escape-to-close, backdrop, z layering via
   --z-modal, the floating close button, focus hand-off and return, and the
   mobile bottom-sheet with drag-to-dismiss (lifted from OpportunityModal). */

type ModalSize = 'md' | 'lg' | 'xl' | '2xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** md = max-w-lg · lg = max-w-2xl · xl = max-w-3xl · 2xl = max-w-4xl */
  size?: ModalSize;
  /** Bottom-sheet behavior below 768px (default). false = centered at all sizes */
  mobileSheet?: boolean;
  /** id of the element labelling the dialog */
  labelledBy?: string;
  /** Extra floating action buttons rendered beside the close button */
  actions?: React.ReactNode;
  /** Full-bleed banner above the scrollable content (e.g. OG-image hero) */
  hero?: React.ReactNode;
  /** Pinned footer below the scrollable content (safe-area aware) */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-3xl',
  '2xl': 'md:max-w-4xl',
};

export function ModalCloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 md:w-12 md:h-12 bg-foreground/[0.06] hover:bg-foreground/[0.10] rounded-full flex items-center justify-center transition-colors border border-line backdrop-blur-md"
    >
      <X size={20} aria-hidden />
    </button>
  );
}

export default function Modal({
  open,
  onClose,
  size = 'lg',
  mobileSheet = true,
  labelledBy,
  actions,
  hero,
  footer,
  children,
}: ModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const dragY = useMotionValue(0);
  const overlayOpacity = useTransform(dragY, [0, 300], [1, 0]);
  const dragControls = useDragControls();
  const closeRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const sheet = mobileSheet && isMobile;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Escape to close + focus hand-off/return
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.querySelector('button')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-(--z-modal) flex justify-center ${sheet ? 'items-end' : 'items-center p-4 md:p-8'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: sheet ? overlayOpacity : undefined }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={sheet ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 50 }}
            animate={sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={sheet ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={sheet ? { y: dragY, background: 'var(--surface)' } : { background: 'var(--surface)' }}
            className={`w-full overflow-hidden flex flex-col relative shadow-2xl ${
              sheet
                ? 'max-h-[95vh] rounded-t-[2rem] border-t border-line-mid'
                : `max-h-[90vh] rounded-2xl border border-line-mid ${sizeClasses[size]}`
            }`}
          >
            {/* Mobile drag handle */}
            {sheet && (
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-foreground/20" />
              </div>
            )}

            {/* Floating actions + close */}
            <div ref={closeRef} className="absolute top-3 md:top-6 right-4 md:right-6 flex items-center gap-2 z-30">
              {actions}
              <ModalCloseButton onClick={onClose} />
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-grow overscroll-contain">
              {hero}
              {children}
            </div>

            {footer && (
              <div
                className="border-t border-line"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
