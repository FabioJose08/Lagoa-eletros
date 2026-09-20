import { useEffect } from 'react';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/constants';

interface Meta {
  title?: string;
  description?: string;
  image?: string;
  /** Páginas privadas/administrativas não devem aparecer no Google. */
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** SEO por página: título, descrição, Open Graph, noindex e dados estruturados (JSON-LD). */
export function useDocumentMeta({ title, description, image, noindex, jsonLd }: Meta): void {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const fullTitle = title ? `${title} | Lagoa Eletros` : SITE_TITLE;
    const desc = description ?? SITE_DESCRIPTION;
    const img = image ?? `${window.location.origin}/brand/og-image.png`;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    let script: HTMLScriptElement | null = null;
    if (jsonKey) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = 'true';
      script.textContent = jsonKey;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, image, noindex, jsonKey]);
}
