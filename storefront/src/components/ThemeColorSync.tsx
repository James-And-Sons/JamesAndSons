"use client";
import { useEffect } from "react";

export default function ThemeColorSync() {
  useEffect(() => {
    const updateThemeColor = () => {
      const isLight =
        document.documentElement.getAttribute("data-theme") === "light" ||
        document.documentElement.classList.contains("light");

      const themeColorHex = isLight ? "#faf7f2" : "#0a0a0b";
      const appleStatusStyle = isLight ? "default" : "black-translucent";

      // 1. Update theme-color meta tag
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement("meta");
        metaTheme.setAttribute("name", "theme-color");
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute("content", themeColorHex);

      // 2. Update apple-mobile-web-app-status-bar-style meta tag
      let metaApple = document.querySelector(
        'meta[name="apple-mobile-web-app-status-bar-style"]',
      );
      if (!metaApple) {
        metaApple = document.createElement("meta");
        metaApple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
        document.head.appendChild(metaApple);
      }
      metaApple.setAttribute("content", appleStatusStyle);

      // 3. Sync bottom home indicator container
      const bottomNav = document.querySelector(".mobile-bottom-nav-container");
      if (bottomNav) {
        (bottomNav as HTMLElement).style.backgroundColor = isLight
          ? "#faf7f2"
          : "#0a0a0b";
      }
    };

    const timer = setTimeout(updateThemeColor, 100);

    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
