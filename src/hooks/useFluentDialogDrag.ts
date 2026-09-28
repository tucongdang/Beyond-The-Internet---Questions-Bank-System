import { useRef, useEffect, useState, useCallback } from 'react';
import { calculateSnapAlignment } from '../utils/fluentDialogSnap';
import { vibrateSelection, vibrateTap } from '../utils/hapticUtils';
import { soundFx } from '../services/audioEffects';

interface UseFluentDialogDragOptions {
  enabled?: boolean;
  onSnap?: (cornerOrEdge: string) => void;
}

export function useFluentDialogDrag(options: UseFluentDialogDragOptions = {}) {
  const { enabled = true, onSnap } = options;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [snappedTo, setSnappedTo] = useState<string | null>(null);

  const resetPosition = useCallback(() => {
    if (!dialogRef.current) return;
    vibrateTap();
    soundFx.playClick();
    dialogRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    dialogRef.current.style.transform = 'translate3d(0, 0, 0)';
    dialogRef.current.dataset.translateX = '0';
    dialogRef.current.dataset.translateY = '0';
    dialogRef.current.removeAttribute('data-snapped');
    setSnappedTo(null);
    setTimeout(() => {
      if (dialogRef.current) dialogRef.current.style.transition = '';
    }, 320);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dialog = dialogRef.current;
    const header = headerRef.current;
    if (!dialog || !header) return;

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let dialogWidth = 0;
    let dialogHeight = 0;
    let hasMoved = false;
    let ghostElement: HTMLElement | null = null;
    let currentClampedX = 0;
    let currentClampedY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, [role="button"], .fluent-dialog-pin-btn, .fluent-dialog-close-btn, .no-drag')) {
        return;
      }

      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = dialog.getBoundingClientRect();
      dialogWidth = rect.width;
      dialogHeight = rect.height;
      initialX = parseFloat(dialog.dataset.translateX || '0') || 0;
      initialY = parseFloat(dialog.dataset.translateY || '0') || 0;
      currentClampedX = initialX;
      currentClampedY = initialY;
      initialLeft = rect.left - initialX;
      initialTop = rect.top - initialY;
      hasMoved = false;

      try {
        header.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (!hasMoved) {
        if (Math.hypot(deltaX, deltaY) < 4) return;
        hasMoved = true;
        setIsDragging(true);
        dialog.classList.add('fluent-dialog-dragging', 'fluent-dialog-ghost-active');
        dialog.classList.remove('fluent-dialog-snapped');

        // Create ghost outline element
        ghostElement = document.createElement('div');
        ghostElement.className = 'fluent-dialog-ghost';
        ghostElement.style.width = `${dialogWidth}px`;
        ghostElement.style.height = `${dialogHeight}px`;
        ghostElement.style.left = `${initialLeft}px`;
        ghostElement.style.top = `${initialTop}px`;
        const compStyle = window.getComputedStyle(dialog);
        if (compStyle.borderRadius) {
          ghostElement.style.borderRadius = compStyle.borderRadius;
        }

        const ghostHeader = document.createElement('div');
        ghostHeader.className = 'fluent-dialog-ghost-header';
        const ghostDot = document.createElement('div');
        ghostDot.className = 'fluent-dialog-ghost-header-dot';
        ghostHeader.appendChild(ghostDot);
        ghostElement.appendChild(ghostHeader);

        document.body.appendChild(ghostElement);
      }

      const nextX = initialX + deltaX;
      const nextY = initialY + deltaY;

      const minX = -initialLeft + 4;
      const maxX = window.innerWidth - (initialLeft + dialogWidth) - 4;
      const minY = -initialTop + 4;
      const maxY = window.innerHeight - (initialTop + dialogHeight) - 4;

      const clampedX = Math.min(Math.max(nextX, minX), maxX);
      const clampedY = Math.min(Math.max(nextY, minY), maxY);

      currentClampedX = clampedX;
      currentClampedY = clampedY;

      // Translate ONLY ghost outline
      if (ghostElement) {
        ghostElement.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;

        const simulatedRect = new DOMRect(
          initialLeft + clampedX,
          initialTop + clampedY,
          dialogWidth,
          dialogHeight
        );
        const isNear =
          simulatedRect.left < 96 ||
          (window.innerWidth - simulatedRect.right) < 96 ||
          simulatedRect.top < 96 ||
          (window.innerHeight - simulatedRect.bottom) < 96;

        if (isNear) {
          ghostElement.classList.add('snapping');
        } else {
          ghostElement.classList.remove('snapping');
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      setIsDragging(false);

      if (ghostElement) {
        ghostElement.remove();
        ghostElement = null;
      }

      dialog.classList.remove('fluent-dialog-dragging', 'fluent-dialog-ghost-active');

      try {
        header.releasePointerCapture(e.pointerId);
      } catch {}

      if (!hasMoved) return;

      const finalRect = new DOMRect(
        initialLeft + currentClampedX,
        initialTop + currentClampedY,
        dialogWidth,
        dialogHeight
      );

      const snapResult = calculateSnapAlignment(
        finalRect,
        window.innerWidth,
        window.innerHeight,
        initialLeft,
        initialTop
      );

      const targetX = snapResult.snapped ? snapResult.targetX : currentClampedX;
      const targetY = snapResult.snapped ? snapResult.targetY : currentClampedY;

      dialog.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease';
      dialog.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      dialog.dataset.translateX = String(targetX);
      dialog.dataset.translateY = String(targetY);

      if (snapResult.snapped) {
        dialog.classList.add('fluent-dialog-snapped');
        const snappedPosition = snapResult.alignment.corner || 'edge';
        dialog.setAttribute('data-snapped', snappedPosition);
        setSnappedTo(snappedPosition);
        onSnap?.(snappedPosition);

        vibrateSelection();
        soundFx.playClick();

        setTimeout(() => {
          if (dialog) {
            dialog.style.transition = '';
            dialog.classList.remove('fluent-dialog-snapped');
          }
        }, 280);
      } else {
        dialog.removeAttribute('data-snapped');
        setTimeout(() => {
          if (dialog) {
            dialog.style.transition = '';
          }
        }, 240);
      }
    };

    header.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      header.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [enabled, onSnap]);

  return {
    dialogRef,
    headerRef,
    isDragging,
    snappedTo,
    resetPosition
  };
}
