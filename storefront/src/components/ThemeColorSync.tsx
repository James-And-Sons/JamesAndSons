'use client';
import { useEffect } from 'react';

export default function ThemeColorSync() {
  useEffect(() => {
    const updateThemeColor = () => {
      // Find the active mobile header or desktop navbar
      const header = document.querySelector('.mobile-page-header') || document.querySelector('.main-nav');
      if (header) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('light');
        const fallbackColor = isLight ? '#ffffff' : '#0a0905';
        const style = window.getComputedStyle(header);
        let bgColor = style.backgroundColor;
        
        // Convert rgba(r, g, b, a) to opaque rgb(r, g, b) since theme-color requires opaque color
        if (bgColor.includes('rgba')) {
          const match = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            bgColor = `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
          } else {
            bgColor = fallbackColor;
          }
        }

        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'theme-color');
          document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', bgColor || fallbackColor);
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
