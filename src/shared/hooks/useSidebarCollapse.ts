import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'sidebarCollapsed';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch (e) {
        console.warn('[useSidebarCollapse] Failed to write localStorage:', e);
      }
      return next;
    });
  };

  return { isCollapsed, toggleCollapse, setIsCollapsed };
}
