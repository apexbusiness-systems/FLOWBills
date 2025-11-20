/**
 * Accessibility Utilities
 * Helper functions and constants for WCAG 2.2 AA compliance
 */

/**
 * Minimum touch target size in pixels (WCAG 2.5.5 Level AAA)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Generates a unique ID for form fields and labels
 */
export const generateA11yId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates accessible button props
 */
export const getAccessibleButtonProps = (
  label: string,
  isLoading?: boolean,
  isDisabled?: boolean
) => ({
  'aria-label': label,
  'aria-busy': isLoading,
  'aria-disabled': isDisabled,
  disabled: isDisabled || isLoading,
});

/**
 * Creates accessible link props for external links
 */
export const getExternalLinkProps = (label?: string) => ({
  target: '_blank',
  rel: 'noopener noreferrer',
  'aria-label': label ? `${label} (opens in new tab)` : 'Opens in new tab',
});

/**
 * Creates live region props for dynamic content announcements
 */
export const getLiveRegionProps = (
  politeness: 'polite' | 'assertive' = 'polite'
) => ({
  role: 'status',
  'aria-live': politeness,
  'aria-atomic': 'true',
});

/**
 * Checks if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Announces text to screen readers
 */
export const announceToScreenReader = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Traps focus within a container
   */
  trapFocus: (containerRef: HTMLElement) => {
    const focusableElements = containerRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    containerRef.addEventListener('keydown', handleKeyDown);
    return () => containerRef.removeEventListener('keydown', handleKeyDown);
  },
  
  /**
   * Returns focus to the previously focused element
   */
  returnFocus: (previouslyFocused: HTMLElement | null) => {
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  },
};

/**
 * Skip to main content link helper
 * Returns props for skip link component
 */
export const getSkipToMainProps = () => ({
  href: '#main-content',
  className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
  children: 'Skip to main content',
});
