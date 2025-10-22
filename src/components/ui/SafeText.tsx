import React from 'react';
import { sanitizeHTML } from '../../utils/security';

interface SafeTextProps {
  /**
   * The text content to display safely
   */
  content: string;
  
  /**
   * Additional className for styling
   */
  className?: string;
  
  /**
   * Whether to preserve whitespace and line breaks
   */
  preserveWhitespace?: boolean;
}

/**
 * SafeText component - Displays user or AI-generated content with XSS protection
 * 
 * This component sanitizes HTML content before rendering to prevent XSS attacks.
 * Use this for any user-generated or AI-generated content.
 */
const SafeText: React.FC<SafeTextProps> = ({ 
  content, 
  className = '', 
  preserveWhitespace = true 
}) => {
  const safeHTML = sanitizeHTML(content);
  
  const combinedClassName = `${className} ${preserveWhitespace ? 'whitespace-pre-wrap' : ''}`;
  
  return (
    <div 
      className={combinedClassName}
      dangerouslySetInnerHTML={{ __html: safeHTML }}
    />
  );
};

export default SafeText;
