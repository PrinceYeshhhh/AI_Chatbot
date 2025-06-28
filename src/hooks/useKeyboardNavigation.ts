import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardNavigationOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | null;
}

/**
 * Hook for managing keyboard shortcuts and navigation
 */
export function useKeyboardNavigation({
  shortcuts,
  enabled = true,
  target
}: UseKeyboardNavigationOptions): void {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    if (!enabled) return;

    const targetElement = target || document;
    if (event.target !== targetElement && !targetElement.contains(event.target as Node)) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.metaKey === !!shortcut.metaKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.shiftKey === !!shortcut.shiftKey
      ) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
        break;
      }
    }
  }, [enabled, target]);

  useEffect(() => {
    const targetElement = target || document;
    targetElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);
}

/**
 * Predefined keyboard shortcuts for common chat actions
 */
export const CHAT_KEYBOARD_SHORTCUTS = {
  SEND_MESSAGE: {
    key: 'Enter',
    ctrlKey: true,
    action: () => {},
    description: 'Send message (Ctrl+Enter)',
    preventDefault: true
  },
  NEW_CONVERSATION: {
    key: 'n',
    altKey: true,
    action: () => {},
    description: 'New conversation (Alt+N)',
    preventDefault: true
  },
  CLOSE_MODAL: {
    key: 'Escape',
    action: () => {},
    description: 'Close modal (Escape)',
    preventDefault: true
  },
  FOCUS_INPUT: {
    key: '/',
    action: () => {},
    description: 'Focus chat input (/)',
    preventDefault: true
  },
  CLEAR_CHAT: {
    key: 'k',
    ctrlKey: true,
    action: () => {},
    description: 'Clear chat (Ctrl+K)',
    preventDefault: true
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrlKey: true,
    action: () => {},
    description: 'Toggle sidebar (Ctrl+B)',
    preventDefault: true
  },
  OPEN_SETTINGS: {
    key: ',',
    ctrlKey: true,
    action: () => {},
    description: 'Open settings (Ctrl+,)',
    preventDefault: true
  },
  VOICE_INPUT: {
    key: 'v',
    altKey: true,
    action: () => {},
    description: 'Voice input (Alt+V)',
    preventDefault: true
  }
} as const;

/**
 * Hook for managing focus in modals and dialogs
 */
export function useFocusManagement(enabled: boolean = true) {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);

  const updateFocusableElements = useCallback((container: HTMLElement): void => {
    if (!enabled) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
    ).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    focusableElementsRef.current = elements;
    firstFocusableElementRef.current = elements[0] || null;
    lastFocusableElementRef.current = elements[elements.length - 1] || null;
  }, [enabled]);

  const focusFirstElement = useCallback((): void => {
    if (firstFocusableElementRef.current) {
      firstFocusableElementRef.current.focus();
    }
  }, []);

  const focusLastElement = useCallback((): void => {
    if (lastFocusableElementRef.current) {
      lastFocusableElementRef.current.focus();
    }
  }, []);

  const handleTabKey = useCallback((event: KeyboardEvent): void => {
    if (!enabled || event.key !== 'Tab') return;

    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    const firstElement = firstFocusableElementRef.current;
    const lastElement = lastFocusableElementRef.current;

    if (!firstElement || !lastElement) return;

    if (event.shiftKey) {
      // Shift+Tab: move backwards
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move forwards
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [handleTabKey, enabled]);

  return {
    updateFocusableElements,
    focusFirstElement,
    focusLastElement,
    focusableElements: focusableElementsRef.current
  };
}

/**
 * Hook for managing ARIA live regions
 */
export function useLiveRegion(role: 'polite' | 'assertive' = 'polite') {
  const announce = useCallback((message: string): void => {
    // Create or find existing live region
    let liveRegion = document.getElementById('aria-live-region');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', role);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Announce the message
    liveRegion.textContent = message;
    
    // Clear the message after a short delay
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [role]);

  return { announce };
}

/**
 * Hook for managing skip links
 */
export function useSkipLink() {
  const createSkipLink = useCallback((targetId: string, text: string): void => {
    // Remove existing skip link
    const existingLink = document.getElementById('skip-link');
    if (existingLink) {
      existingLink.remove();
    }

    // Create new skip link
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-link';
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }, []);

  return { createSkipLink };
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestoration() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback((): void => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback((): void => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Utility function to check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  
  // Elements that are naturally focusable
  if (['input', 'select', 'textarea', 'button', 'a'].includes(tagName)) {
    return !element.hasAttribute('disabled') && !element.hasAttribute('hidden');
  }
  
  // Elements with tabindex
  if (tabIndex !== null) {
    return tabIndex !== '-1';
  }
  
  // Contenteditable elements
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Utility function to get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  ).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
} 