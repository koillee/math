"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname) setVisible(false);
  }, [pathname]);

  useEffect(() => {
    let safetyTimer: number | undefined;
    const routePath = pathname;
    const start = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!routePath || link.origin !== window.location.origin || link.target === "_blank" || (link.pathname === window.location.pathname && link.search === window.location.search)) return;
      setVisible(true);
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => setVisible(false), 12000);
    };
    document.addEventListener("click", start);
    return () => {
      document.removeEventListener("click", start);
      window.clearTimeout(safetyTimer);
    };
  }, [pathname]);

  return visible ? <div className="navigation-progress" role="status" aria-label="Loading next page" /> : null;
}