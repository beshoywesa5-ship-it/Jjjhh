import { useEffect, useRef } from 'react';

export interface BackHandlerItem {
  id: string;
  onClose: () => void;
}

// Global active modal/card stack
export const backHandlerStack: BackHandlerItem[] = [];

// Counter of internal history pops triggered programmatically (e.g. clicking X, Cancel, or code state changes)
let internalPopCounter = 0;

export function notifyInternalPop() {
  internalPopCounter++;
}

export function shouldIgnoreNextPop(): boolean {
  if (internalPopCounter > 0) {
    internalPopCounter--;
    return true;
  }
  return false;
}

export function popTopBackHandler(): boolean {
  if (backHandlerStack.length > 0) {
    const top = backHandlerStack.pop();
    if (top) {
      top.onClose();
      return true;
    }
  }
  return false;
}

/**
 * Universal Mobile Hardware & Gesture Back Button Handler for Modals, Sheets & Cards.
 * Coordinates cleanly with MobileShell so closing modals or collapsing cards
 * NEVER triggers an accidental tab switch back to the home screen.
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, modalId = 'modal') {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Remove from stack if present
        const idx = backHandlerStack.findIndex(item => item.id === modalId);
        if (idx !== -1) {
          backHandlerStack.splice(idx, 1);
        }
        // Tell popstate listener to ignore this programmatic back navigation
        notifyInternalPop();
        window.history.back();
      }
      return;
    }

    // Modal or card opened: push history state and register to stack
    window.history.pushState({ masrofyModalId: modalId }, '');
    isPushedRef.current = true;
    
    // Add to stack (ensuring unique by id)
    const existingIdx = backHandlerStack.findIndex(item => item.id === modalId);
    if (existingIdx !== -1) {
      backHandlerStack.splice(existingIdx, 1);
    }
    backHandlerStack.push({
      id: modalId,
      onClose: () => onCloseRef.current(),
    });

    return () => {
      // Unmount cleanup
      const idx = backHandlerStack.findIndex(item => item.id === modalId);
      if (idx !== -1) {
        backHandlerStack.splice(idx, 1);
      }
      if (isPushedRef.current) {
        isPushedRef.current = false;
        notifyInternalPop();
        window.history.back();
      }
    };
  }, [isOpen, modalId]);
}
