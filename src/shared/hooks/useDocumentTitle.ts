import { useEffect } from 'react';

const DEFAULT_BASE_TITLE = 'StayFlow | Alojamientos';

export function setDocumentTitle(title?: string, tenantName?: string) {
  if (typeof document === 'undefined') return;
  if (!title && !tenantName) {
    document.title = DEFAULT_BASE_TITLE;
    return;
  }
  if (tenantName && title) {
    document.title = `${tenantName} | ${title} · StayFlow`;
  } else if (tenantName) {
    document.title = `${tenantName} | StayFlow`;
  } else {
    document.title = `${title} | StayFlow`;
  }
}

export function useDocumentTitle(title?: string, tenantName?: string) {
  useEffect(() => {
    setDocumentTitle(title, tenantName);
    return () => {
      // Revert to base title if unmounted
      if (title || tenantName) {
        document.title = DEFAULT_BASE_TITLE;
      }
    };
  }, [title, tenantName]);
}
