import { useEffect } from 'react';

let activeModalsCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * useLockBodyScroll
 * Locks document body scroll and touch gestures on background when modal/dialog is open.
 * Prevents "scroll bleed" and background sticking.
 */
export function useLockBodyScroll(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    if (activeModalsCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // Calculate scrollbar width to prevent layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }

    activeModalsCount++;

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.classList.remove('modal-open');
      }
    };
  }, [isLocked]);
}
