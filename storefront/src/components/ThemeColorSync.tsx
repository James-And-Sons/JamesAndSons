'use client';
import { useEffect } from 'react';

export default function ThemeColorSync() {
  useEffect(() => {
    const updateThemeColor = () => {
      // Find the active mobile header or desktop navbar
      const header = document.querySelector('.mobile-page-header') || document.querySelector('.main-nav');
      if (header) {
        const style = window.getComputedStyle(header);
        const bgColor = style.backgroundColor;
        
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'theme-color');
          document.head.appendChild(meta);
        }
        
        // Match the background of the navbar
        meta.setAttribute('content', bgColor);
      }
    };

    // Run after DOM has completed rendering
    const timer = setTimeout(updateThemeColor, 200);

    // Watch for theme/data-theme changes
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
