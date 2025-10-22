/**
 * Accessibility utilities for The Skeptical Wombat
 * 
 * This module provides helper functions for keyboard navigation and focus management
 */

/**
 * Traps focus within a specific element (useful for modals)
 * @param element The element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Hook to handle Escape key press
 * @param callback Function to call when Escape is pressed
 */
export const useEscapeKey = (callback: () => void) => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }
  
  return () => {};
};

/**
 * Announces a message to screen readers
 * @param message Message to announce
 * @param priority 'polite' or 'assertive'
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Gets a descriptive label for a phase status
 * @param status Current phase status
 * @returns Human-readable description
 */
export const getPhaseAriaLabel = (status: string): string => {
  const labels: Record<string, string> = {
    agree_statement: 'Phase 1: Agree on Problem Statement',
    private_versions: 'Phase 2: Submit Private Versions',
    translation: 'Phase 3: View Wombat Translation',
    steelman: 'Phase 4: Submit Steelman Arguments',
    steelman_approval: 'Phase 5: Approve Steelman',
    ai_review: 'Phase 6: Wombat Verdict',
    propose_solutions: 'Phase 7: Propose Solutions',
    solution_steelman: 'Phase 8: Explain Partner Solutions',
    wager: 'Phase 9: Wombat Wager',
    solution: 'Phase 10: Agree on Final Solution',
    resolved: 'Completed: Problem Resolved',
  };
  
  return labels[status] || `Phase: ${status.replace(/_/g, ' ')}`;
};
