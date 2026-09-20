import type { StoredImage } from '@/types';

const KEY = 'lagoa-eletros:local-product-images';

export function readLocalProductImages(productId: string): { main?: string; thumb?: string } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, { main?: string; thumb?: string }>;
    return parsed[productId] ?? null;
  } catch {
    return null;
  }
}

export function writeLocalProductImages(productId: string, images: StoredImage[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY);
    const current = raw ? (JSON.parse(raw) as Record<string, { main?: string; thumb?: string }>) : {};
    const next = {
      ...current,
      [productId]: {
        main: images[0]?.url ?? '',
        thumb: images[0]?.thumbUrl || images[0]?.url || '',
      },
    };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignora falhas de armazenamento local.
  }
}

export function resolveLocalImageUrl(productId: string, kind: 'main' | 'thumb', fallback: string): string {
  const local = readLocalProductImages(productId);
  if (local && local[kind]) return local[kind] as string;
  return fallback;
}
