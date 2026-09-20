/* Validação e otimização de imagens NO NAVEGADOR, antes do upload para o Storage.
   Resultado: uma imagem principal (até 1600 px) e uma miniatura (até 480 px), sem deformar drasticamente a aparência original. */

export const ACCEPTED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB (o arquivo final fica bem menor)
export const MAX_MAIN_DIMENSION = 1600;
export const MAX_THUMB_DIMENSION = 480;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" não é um formato aceito. Use JPG, PNG ou WEBP.`;
  }
  if (file.size === 0) return `"${file.name}" está vazio.`;
  if (file.size > MAX_INPUT_BYTES) {
    return `"${file.name}" é muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O máximo é 10 MB.`;
  }
  return null;
}

export const extensionFor = (mime: string): string => (mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp');

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* cai para o <img> abaixo */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Não foi possível ler esta imagem. O arquivo pode estar corrompido.'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function resize(d: Decoded, maxDim: number, quality: number, originalType: string): Promise<Blob> {
  const scale = Math.min(1, maxDim / Math.max(d.width, d.height));
  const w = Math.max(1, Math.round(d.width * scale));
  const h = Math.max(1, Math.round(d.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
  ctx.drawImage(d.source, 0, 0, w, h);

  const targetType = originalType === 'image/png' ? 'image/png' : 'image/jpeg';
  if (targetType === 'image/png') {
    const png = await toBlob(canvas, 'image/png', quality);
    if (png) return png;
  }

  const jpeg = await toBlob(canvas, 'image/jpeg', Math.min(quality, 0.95));
  if (!jpeg) throw new Error('Falha ao otimizar a imagem.');
  return jpeg;
}

export interface ProcessedImage {
  main: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

/** Valida (fora), decodifica, redimensiona e comprime. */
export async function processImage(file: File): Promise<ProcessedImage> {
  const d = await decode(file);
  try {
    const main = d.width <= MAX_MAIN_DIMENSION && d.height <= MAX_MAIN_DIMENSION
      ? file.slice(0, file.size, file.type)
      : await resize(d, MAX_MAIN_DIMENSION, 0.92, file.type);
    const thumb = d.width <= MAX_THUMB_DIMENSION && d.height <= MAX_THUMB_DIMENSION
      ? file.slice(0, file.size, file.type)
      : await resize(d, MAX_THUMB_DIMENSION, 0.88, file.type);
    return { main, thumb, width: d.width, height: d.height };
  } finally {
    d.release();
  }
}
