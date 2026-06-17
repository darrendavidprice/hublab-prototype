import { useEffect } from 'react';

/** Sets the document title for a route and restores nothing on unmount (the
 *  next route sets its own). Keeps the suffix consistent across the site. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · HubLab` : 'HubLab — Bringing science and engineering to life';
  }, [title]);
}
