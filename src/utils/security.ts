/**
 * Security utilities for The Skeptical Wombat
 * 
 * This module provides security functions to protect against XSS, injection attacks,
 * and other security vulnerabilities.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty Potentially unsafe HTML string
 * @returns Sanitized HTML safe for rendering
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Validates and sanitizes user name input
 * @param name Raw user name input
 * @returns Sanitized name or null if invalid
 */
export const sanitizeName = (name: string): string | null => {
  const SAFE_NAME_PATTERN = /^[a-zA-Z0-9\s\-']{1,50}$/;
  const trimmed = name.trim();
  
  if (!SAFE_NAME_PATTERN.test(trimmed)) {
    return null;
  }
  
  return trimmed;
};

/**
 * Validates and sanitizes problem statement input
 * @param text Raw problem statement
 * @returns Sanitized text or null if invalid
 */
export const sanitizeProblemStatement = (text: string): string | null => {
  const trimmed = text.trim();
  
  if (trimmed.length < 10 || trimmed.length > 500) {
    return null;
  }
  
  // Remove any HTML tags
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
};

/**
 * Validates and sanitizes general text input
 * @param text Raw text input
 * @param maxLength Maximum allowed length
 * @returns Sanitized text
 */
export const sanitizeText = (text: string, maxLength: number = 5000): string => {
  const trimmed = text.trim().substring(0, maxLength);
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
};

/**
 * Escapes special characters for safe display
 * @param text Text to escape
 * @returns Escaped text
 */
export const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Rate limiter class for client-side API call throttling
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;
  
  constructor(maxCalls = 10, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }
  
  /**
   * Throttles function execution based on rate limit
   * @param fn Function to throttle
   * @returns Result of function call
   */
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    this.calls = this.calls.filter(time => time > now - this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitMs = oldestCall + this.windowMs - now;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.throttle(fn);
    }
    
    this.calls.push(now);
    return fn();
  }
  
  /**
   * Checks if rate limit is exceeded
   * @returns True if rate limit exceeded
   */
  isLimited(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter(time => time > now - this.windowMs);
    return this.calls.length >= this.maxCalls;
  }
}
