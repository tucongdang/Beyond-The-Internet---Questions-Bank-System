import { vibrateSelection, vibrateTap } from './hapticUtils';
import { soundFx } from '../services/audioEffects';

/**
 * Configuration for Javascript Coordinate Detection & Snap-to-Edge Alignment
 */
const SNAP_THRESHOLD = 96; // Distance from viewport edges/corners (in pixels) to trigger snap
const CORNER_THRESHOLD = 140; // Proximity threshold for screen corners
const SNAP_MARGIN = 16; // Margin in px between dialog and viewport edge when snapped
const MIN_DRAG_DISTANCE = 4; // Threshold to distinguish click from drag

interface DragSession {
  dialog: HTMLElement;
  header: HTMLElement;
  ghost: HTMLElement | null;
  startX: number;
  startY: number;
  initialTranslateX: number;
  initialTranslateY: number;
  initialLeft: number;
  initialTop: number;
  dialogWidth: number;
  dialogHeight: number;
  hasDragged: boolean;
  pointerId: number;
  currentClampedX: number;
  currentClampedY: number;
}

let activeSession: DragSession | null = null;
let isInitialized = false;

/**
 * Coordinate detection to evaluate whether a dialog's bounding rectangle
 * is near viewport edges or corners and calculate the target alignment.
 */
export function calculateSnapAlignment(
  rect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
  initialLeft: number,
  initialTop: number
): {
  snapped: boolean;
  targetX: number;
  targetY: number;
  alignment: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  };
} {
  const distLeft = rect.left;
  const distRight = viewportWidth - rect.right;
  const distTop = rect.top;
  const distBottom = viewportHeight - rect.bottom;

  // Detect corner proximity
  const isNearTopLeft = distLeft < CORNER_THRESHOLD && distTop < CORNER_THRESHOLD;
  const isNearTopRight = distRight < CORNER_THRESHOLD && distTop < CORNER_THRESHOLD;
  const isNearBottomLeft = distLeft < CORNER_THRESHOLD && distBottom < CORNER_THRESHOLD;
  const isNearBottomRight = distRight < CORNER_THRESHOLD && distBottom < CORNER_THRESHOLD;

  // Determine edge snap condition
  const snapLeft = isNearTopLeft || isNearBottomLeft || distLeft < SNAP_THRESHOLD;
  const snapRight = isNearTopRight || isNearBottomRight || distRight < SNAP_THRESHOLD;
  const snapTop = isNearTopLeft || isNearTopRight || distTop < SNAP_THRESHOLD;
  const snapBottom = isNearBottomLeft || isNearBottomRight || distBottom < SNAP_THRESHOLD;

  let corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null = null;
  if ((snapLeft || isNearTopLeft) && (snapTop || isNearTopLeft)) corner = 'top-left';
  else if ((snapRight || isNearTopRight) && (snapTop || isNearTopRight)) corner = 'top-right';
  else if ((snapLeft || isNearBottomLeft) && (snapBottom || isNearBottomLeft)) corner = 'bottom-left';
  else if ((snapRight || isNearBottomRight) && (snapBottom || isNearBottomRight)) corner = 'bottom-right';

  const snapped = snapLeft || snapRight || snapTop || snapBottom;

  // Default to current offset
  let targetX = rect.left - initialLeft;
  let targetY = rect.top - initialTop;

  // Snap X axis to viewport bounds
  if (snapLeft) {
    targetX = SNAP_MARGIN - initialLeft;
  } else if (snapRight) {
    targetX = (viewportWidth - rect.width - SNAP_MARGIN) - initialLeft;
  }

  // Snap Y axis to viewport bounds
  if (snapTop) {
    targetY = SNAP_MARGIN - initialTop;
  } else if (snapBottom) {
    targetY = (viewportHeight - rect.height - SNAP_MARGIN) - initialTop;
  }

  return {
    snapped,
    targetX,
    targetY,
    alignment: {
      left: snapLeft,
      right: snapRight,
      top: snapTop,
      bottom: snapBottom,
      corner
    }
  };
}

/**
 * Check if the event target is an interactive element where dragging should not be initiated.
 */
function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], .fluent-dialog-pin-btn, .fluent-dialog-close-btn, .no-drag, .fluent-dialog-no-drag, [data-no-drag="true"]'
    )
  );
}

/**
 * Handles pointerdown to start dragging .fluent-dialog via .fluent-dialog-header
 */
function handlePointerDown(e: PointerEvent) {
  // Only handle primary button clicks (left click / touch)
  if (e.button !== 0) return;

  const target = e.target as HTMLElement;
  if (!target) return;

  // Do not initiate drag if user interacted with buttons, controls, or inputs
  if (isInteractiveElement(target)) return;

  const header = target.closest<HTMLElement>('.fluent-dialog-header, .fluent-dialog-drag-handle');
  if (!header) return;

  const dialog = header.closest<HTMLElement>('.fluent-dialog');
  if (!dialog) return;

  // Don't drag if fullscreen or maximized
  if (
    dialog.classList.contains('is-fullscreen') ||
    dialog.getAttribute('data-fullscreen') === 'true'
  ) {
    return;
  }

  const rect = dialog.getBoundingClientRect();
  const currentTranslateX = parseFloat(dialog.dataset.translateX || '0') || 0;
  const currentTranslateY = parseFloat(dialog.dataset.translateY || '0') || 0;

  // Base position without transform
  const initialLeft = rect.left - currentTranslateX;
  const initialTop = rect.top - currentTranslateY;

  activeSession = {
    dialog,
    header,
    ghost: null,
    startX: e.clientX,
    startY: e.clientY,
    initialTranslateX: currentTranslateX,
    initialTranslateY: currentTranslateY,
    initialLeft,
    initialTop,
    dialogWidth: rect.width,
    dialogHeight: rect.height,
    hasDragged: false,
    pointerId: e.pointerId,
    currentClampedX: currentTranslateX,
    currentClampedY: currentTranslateY
  };

  try {
    header.setPointerCapture(e.pointerId);
  } catch {}
}

/**
 * Handles pointermove for real-time smooth repositioning of the ghost outline
 * without moving the actual heavy dialog until pointer release.
 */
function handlePointerMove(e: PointerEvent) {
  if (!activeSession || e.pointerId !== activeSession.pointerId) return;

  const deltaX = e.clientX - activeSession.startX;
  const deltaY = e.clientY - activeSession.startY;

  if (!activeSession.hasDragged) {
    if (Math.hypot(deltaX, deltaY) >= MIN_DRAG_DISTANCE) {
      activeSession.hasDragged = true;
      activeSession.dialog.classList.add('fluent-dialog-dragging', 'fluent-dialog-ghost-active');
      activeSession.dialog.classList.remove('fluent-dialog-snapped');

      // Create lightweight ghost outline element
      const ghost = document.createElement('div');
      ghost.className = 'fluent-dialog-ghost';
      ghost.style.width = `${activeSession.dialogWidth}px`;
      ghost.style.height = `${activeSession.dialogHeight}px`;
      ghost.style.left = `${activeSession.initialLeft}px`;
      ghost.style.top = `${activeSession.initialTop}px`;

      const compStyle = window.getComputedStyle(activeSession.dialog);
      if (compStyle.borderRadius) {
        ghost.style.borderRadius = compStyle.borderRadius;
      }

      const ghostHeader = document.createElement('div');
      ghostHeader.className = 'fluent-dialog-ghost-header';
      const ghostDot = document.createElement('div');
      ghostDot.className = 'fluent-dialog-ghost-header-dot';
      ghostHeader.appendChild(ghostDot);
      ghost.appendChild(ghostHeader);

      document.body.appendChild(ghost);
      activeSession.ghost = ghost;
    } else {
      return;
    }
  }

  const newX = activeSession.initialTranslateX + deltaX;
  const newY = activeSession.initialTranslateY + deltaY;

  // Clamp within viewport so dialog outline cannot be dragged off-screen
  const minX = -activeSession.initialLeft + 4;
  const maxX = window.innerWidth - (activeSession.initialLeft + activeSession.dialogWidth) - 4;
  const minY = -activeSession.initialTop + 4;
  const maxY = window.innerHeight - (activeSession.initialTop + activeSession.dialogHeight) - 4;

  const clampedX = Math.min(Math.max(newX, minX), maxX);
  const clampedY = Math.min(Math.max(newY, minY), maxY);

  activeSession.currentClampedX = clampedX;
  activeSession.currentClampedY = clampedY;

  // Translate ONLY the lightweight ghost outline (no heavy modal reflow / repaint)
  if (activeSession.ghost) {
    activeSession.ghost.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;

    // Detect snap proximity for magnetic ghost feedback
    const simulatedRect = new DOMRect(
      activeSession.initialLeft + clampedX,
      activeSession.initialTop + clampedY,
      activeSession.dialogWidth,
      activeSession.dialogHeight
    );

    const isNearSnap =
      simulatedRect.left < SNAP_THRESHOLD ||
      (window.innerWidth - simulatedRect.right) < SNAP_THRESHOLD ||
      simulatedRect.top < SNAP_THRESHOLD ||
      (window.innerHeight - simulatedRect.bottom) < SNAP_THRESHOLD;

    if (isNearSnap) {
      activeSession.ghost.classList.add('snapping');
    } else {
      activeSession.ghost.classList.remove('snapping');
    }
  }
}

/**
 * Handles pointerup when user finishes dragging:
 * removes the ghost outline and smoothly repositions the actual dialog to the final coordinates.
 */
function handlePointerUp(e: PointerEvent) {
  if (!activeSession || e.pointerId !== activeSession.pointerId) return;

  const session = activeSession;
  activeSession = null;

  try {
    session.header.releasePointerCapture(e.pointerId);
  } catch {}

  // Remove the ghost outline element immediately
  if (session.ghost) {
    session.ghost.remove();
    session.ghost = null;
  }

  session.dialog.classList.remove('fluent-dialog-dragging', 'fluent-dialog-ghost-active');

  // If user only tapped/clicked without moving, do nothing
  if (!session.hasDragged) {
    return;
  }

  // Coordinate detection on finished drag based on ghost's final position
  const finalRect = new DOMRect(
    session.initialLeft + session.currentClampedX,
    session.initialTop + session.currentClampedY,
    session.dialogWidth,
    session.dialogHeight
  );

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const snapResult = calculateSnapAlignment(
    finalRect,
    viewportWidth,
    viewportHeight,
    session.initialLeft,
    session.initialTop
  );

  const targetX = snapResult.snapped ? snapResult.targetX : session.currentClampedX;
  const targetY = snapResult.snapped ? snapResult.targetY : session.currentClampedY;

  // Move the actual dialog element smoothly into the final position
  session.dialog.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease';
  session.dialog.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
  session.dialog.dataset.translateX = String(targetX);
  session.dialog.dataset.translateY = String(targetY);

  if (snapResult.snapped) {
    session.dialog.classList.add('fluent-dialog-snapped');
    if (snapResult.alignment.corner) {
      session.dialog.setAttribute('data-snapped', snapResult.alignment.corner);
    } else {
      session.dialog.setAttribute('data-snapped', 'edge');
    }

    // Tactile and audio confirmation
    try {
      vibrateSelection();
      soundFx.playClick();
    } catch {}

    setTimeout(() => {
      if (session.dialog) {
        session.dialog.style.transition = '';
        session.dialog.classList.remove('fluent-dialog-snapped');
      }
    }, 280);
  } else {
    session.dialog.removeAttribute('data-snapped');
    setTimeout(() => {
      if (session.dialog) {
        session.dialog.style.transition = '';
      }
    }, 240);
  }
}

/**
 * Handle double click on header to reset dialog back to center
 */
function handleDoubleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target || isInteractiveElement(target)) return;

  const header = target.closest<HTMLElement>('.fluent-dialog-header');
  if (!header) return;

  const dialog = header.closest<HTMLElement>('.fluent-dialog');
  if (!dialog) return;

  vibrateTap();
  soundFx.playClick();

  dialog.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
  dialog.style.transform = 'translate3d(0, 0, 0)';
  dialog.dataset.translateX = '0';
  dialog.dataset.translateY = '0';
  dialog.removeAttribute('data-snapped');

  setTimeout(() => {
    if (dialog) dialog.style.transition = '';
  }, 350);
}

/**
 * Window resize handler to keep dialogs inside viewport
 */
function handleWindowResize() {
  const dialogs = document.querySelectorAll<HTMLElement>('.fluent-dialog');
  dialogs.forEach((dialog) => {
    const curX = parseFloat(dialog.dataset.translateX || '0') || 0;
    const curY = parseFloat(dialog.dataset.translateY || '0') || 0;
    if (curX === 0 && curY === 0) return;

    const rect = dialog.getBoundingClientRect();
    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
      const snapResult = calculateSnapAlignment(
        rect,
        window.innerWidth,
        window.innerHeight,
        rect.left - curX,
        rect.top - curY
      );
      dialog.style.transform = `translate3d(${snapResult.targetX}px, ${snapResult.targetY}px, 0)`;
      dialog.dataset.translateX = String(snapResult.targetX);
      dialog.dataset.translateY = String(snapResult.targetY);
    }
  });
}

/**
 * Initializes global event delegation for draggable .fluent-dialog elements
 * with automatic snap-to-edge Javascript coordinate detection.
 */
export function initFluentDialogSnap(): () => void {
  if (typeof window === 'undefined' || isInitialized) {
    return () => {};
  }

  isInitialized = true;

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerup', handlePointerUp, { passive: true });
  window.addEventListener('pointercancel', handlePointerUp, { passive: true });
  document.addEventListener('dblclick', handleDoubleClick, { passive: true });
  window.addEventListener('resize', handleWindowResize, { passive: true });

  return () => {
    isInitialized = false;
    document.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    document.removeEventListener('dblclick', handleDoubleClick);
    window.removeEventListener('resize', handleWindowResize);
  };
}
