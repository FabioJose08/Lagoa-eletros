import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, where, writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import { deleteFiles, uploadBlob } from '@/firebase/storage';
import { hasStorageConfigured } from '@/firebase/config';
import type { ImageDraft, Product, ProductFormValues, StoredImage } from '@/types';
import { extensionFor } from '@/utils/image';
import { fromInputDateTime, parseMoney } from '@/utils/format';
import { calcDiscountPercent } from '@/utils/pricing';
import { slugify } from '@/utils/slug';
import { computeAvailable } from '@/utils/stock';
import { writeLocalProductImages } from '@/utils/localImages';
import { productFromDoc } from './mappers';

type OnError = (err: Error) => void;

/** Site público: escuta somente produtos ATIVOS (as Security Rules exigem isso). Atualiza em tempo real. */
export function subscribeActiveProducts(cb: (list: Product[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.products), where('active', '==', true));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => productFromDoc(d.id, d.data()))), onError);
}

/** Painel: todos os produtos (ativos e inativos). Só admin consegue ler. */
export function subscribeAllProducts(cb: (list: Product[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(getDb(), COL.products),
    (snap) => cb(snap.docs.map((d) => productFromDoc(d.id, d.data()))),
    onError,
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(getDb(), COL.products, id));
  return snap.exists() ? productFromDoc(snap.id, snap.data()) : null;
}

async function slugExists(slug: string, exceptId: string): Promise<boolean> {
  const snap = await getDocs(query(collection(getDb(), COL.products), where('slug', '==', slug), limit(2)));
  return snap.docs.some((d) => d.id !== exceptId);
}

/** Gera um slug único: "iphone-11", "iphone-11-2", "iphone-11-3"... */
export async function uniqueProductSlug(name: string, productId: string): Promise<string> {
  const base = slugify(name) || 'produto';
  let slug = base;
  for (let i = 2; await slugExists(slug, productId); i++) slug = `${base}-${i}`;
  return slug;
}

export interface UploadProgress {
  done: number;
  total: number;
  /** 0 a 1, considerando todos os arquivos. */
  fraction: number;
}

export interface SaveProductOptions {
  existing: Product | null;
  onProgress?: (p: UploadProgress) => void;
}

export interface ProductImageUploadJob {
  draftIndex: number;
  folder: 'main' | 'gallery';
  mainPath: string;
  thumbPath: string;
  mainBlob: Blob;
  thumbBlob: Blob;
}

export function buildImageUploadJobs(drafts: ImageDraft[], productId: string): ProductImageUploadJob[] {
  const jobs: ProductImageUploadJob[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (d.kind === 'existing' || !d.mainBlob || !d.thumbBlob) continue;
    const folder = i === 0 ? 'main' : 'gallery';
    const stamp = `${Date.now()}-${i}`;
    const ext = extensionFor(d.mainBlob.type);
    jobs.push({
      draftIndex: i,
      folder,
      mainPath: `product-images/${productId}/${folder}/${stamp}.${ext}`,
      thumbPath: `product-images/${productId}/${folder}/${stamp}_thumb.${extensionFor(d.thumbBlob.type)}`,
      mainBlob: d.mainBlob,
      thumbBlob: d.thumbBlob,
    });
  }
  return jobs;
}

/** O Firestore recusa campos "undefined": guardamos só o que existe. */
const cleanImage = (i: StoredImage): StoredImage => ({
  url: i.url,
  path: i.path,
  ...(i.thumbUrl ? { thumbUrl: i.thumbUrl } : {}),
  ...(i.thumbPath ? { thumbPath: i.thumbPath } : {}),
});

async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Não foi possível converter a imagem local em dados persistentes.'));
      reader.readAsDataURL(blob);
    });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${blob.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
}

export async function buildLocalFallbackImages(drafts: ImageDraft[]): Promise<StoredImage[]> {
  const images: StoredImage[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (d.kind === 'existing' && d.existing) {
      images.push(cleanImage(d.existing));
      continue;
    }
    if (d.kind === 'new' && d.mainBlob && d.thumbBlob) {
      const [mainUrl, thumbUrl] = await Promise.all([
        blobToDataUrl(d.mainBlob),
        blobToDataUrl(d.thumbBlob),
      ]);
      images.push({ url: mainUrl, path: '', thumbUrl, thumbPath: '' });
    }
  }
  return images.length ? images : [{ url: '/brand/logo-mark.webp', path: '', thumbUrl: '/brand/logo-mark.webp', thumbPath: '' }];
}

const int = (s: string): number => Math.max(0, Math.trunc(Number(s.trim() || '0')));

/**
 * Cria ou atualiza um produto.
 * Fluxo: envia as imagens NOVAS ao Storage -> grava o produto (e a promoção) no Firestore em UMA operação
 * atômica -> só então apaga do Storage as imagens removidas. Se algo falhar, as imagens recém-enviadas são desfeitas.
 * A primeira imagem da lista (drafts[0]) é a imagem principal.
 */
export async function saveProduct(values: ProductFormValues, drafts: ImageDraft[], opts: SaveProductOptions): Promise<Product> {
  const db = getDb();
  const existing = opts.existing;
  const id = existing?.id ?? doc(collection(db, COL.products)).id;
  const slug = existing?.slug || (await uniqueProductSlug(values.name, id));

  const uploadJobs = buildImageUploadJobs(drafts, id);
  const toUpload = uploadJobs.length * 2;
  let done = 0;
  const report = (partial = 0): void =>
    opts.onProgress?.({ done, total: toUpload, fraction: toUpload ? Math.min(1, (done + partial) / toUpload) : 1 });
  report();

  const finalImages: Array<StoredImage | null> = new Array(drafts.length).fill(null);
  const uploadedPaths: string[] = [];
  try {
    if (!hasStorageConfigured()) {
      const localImages = await buildLocalFallbackImages(drafts);
      for (let i = 0; i < localImages.length; i++) {
        finalImages[i] = localImages[i];
      }
      writeLocalProductImages(id, localImages);
    } else {
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (d.kind === 'existing' && d.existing) {
          finalImages[i] = cleanImage(d.existing);
        }
      }

      for (const job of uploadJobs) {
        const [main, thumb] = await Promise.all([
          uploadBlob(job.mainPath, job.mainBlob, (f) => report(f)),
          uploadBlob(job.thumbPath, job.thumbBlob, (f) => report(f)),
        ]);
        uploadedPaths.push(main.path, thumb.path);
        done += 2;
        finalImages[job.draftIndex] = { url: main.url, path: main.path, thumbUrl: thumb.url, thumbPath: thumb.path };
        report();
      }
    }

    const normalizedImages = finalImages.filter((img): img is StoredImage => Boolean(img));
    const [main, ...gallery] = normalizedImages;

    const price = parseMoney(values.price) ?? 0;
    const oldPrice = values.oldPrice.trim() ? parseMoney(values.oldPrice) : null;
    const costPrice = values.costPrice.trim() ? parseMoney(values.costPrice) : null;
    const stock = int(values.stock);
    const reservedStock = existing?.reservedStock ?? 0; // o reservado é controlado pelos pedidos, nunca digitado
    const promoPrice = values.onSale ? parseMoney(values.promoPrice) : null;
    const promotion =
      values.onSale && promoPrice !== null
        ? { promoPrice, startsAt: fromInputDateTime(values.promoStartsAt), endsAt: fromInputDateTime(values.promoEndsAt), active: true }
        : null;

    const data = {
      name: values.name.trim(),
      slug,
      description: values.description.trim(),
      shortDescription: values.shortDescription.trim(),
      price,
      oldPrice,
      costPrice,
      discountPercentage: promotion ? calcDiscountPercent(price, promotion.promoPrice) : oldPrice ? calcDiscountPercent(oldPrice, price) : 0,
      brandId: values.brandId || null,
      categoryId: values.categoryId,
      condition: values.condition,
      stock,
      reservedStock,
      availableStock: computeAvailable(stock, reservedStock),
      sku: values.sku.trim(),
      featured: values.featured,
      onSale: promotion !== null,
      active: values.active,
      imageUrl: main?.url ?? '',
      imagePath: main?.path ?? '',
      thumbUrl: main?.thumbUrl ?? '',
      thumbPath: main?.thumbPath ?? '',
      additionalImages: gallery.map(cleanImage),
      promotion,
      demo: existing?.demo ?? false,
      updatedAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    const productRef = doc(db, COL.products, id);
    if (existing) batch.update(productRef, data);
    else batch.set(productRef, { ...data, createdAt: serverTimestamp() });

    const promoRef = doc(db, COL.promotions, id);
    if (promotion) {
      batch.set(promoRef, {
        productId: id,
        productName: data.name,
        regularPrice: price,
        promoPrice: promotion.promoPrice,
        discountPercentage: data.discountPercentage,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        active: true,
        demo: data.demo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (existing?.onSale || existing?.promotion) {
      batch.delete(promoRef);
    }
    await batch.commit();

    // Só agora, com tudo salvo, remove do Storage o que saiu do produto.
    if (existing) {
      const keep = new Set(finalImages.flatMap((i) => [i.path, i.thumbPath]));
      const before: StoredImage[] = [
        ...(existing.imagePath ? [{ url: existing.imageUrl, path: existing.imagePath, thumbPath: existing.thumbPath }] : []),
        ...existing.additionalImages,
      ];
      const remove = before.flatMap((i) => [i.path, i.thumbPath]).filter((p) => p && !keep.has(p));
      void deleteFiles(remove);
    }

    const saved = await getDoc(productRef);
    return productFromDoc(saved.id, saved.data() ?? data);
  } catch (err) {
    void deleteFiles(uploadedPaths); // desfaz os uploads desta tentativa
    throw err;
  }
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const batch = writeBatch(getDb());
  batch.update(doc(getDb(), COL.products, id), { active, updatedAt: serverTimestamp() });
  await batch.commit();
}

/** Cria uma cópia INATIVA (sem imagens e sem promoção) para agilizar o cadastro de variações. */
export async function duplicateProduct(source: Product): Promise<string> {
  const db = getDb();
  const id = doc(collection(db, COL.products)).id;
  const name = `${source.name} (cópia)`;
  const slug = await uniqueProductSlug(name, id);
  const batch = writeBatch(db);
  batch.set(doc(db, COL.products, id), {
    name,
    slug,
    description: source.description,
    shortDescription: source.shortDescription,
    price: source.price,
    oldPrice: source.oldPrice,
    costPrice: source.costPrice,
    discountPercentage: source.oldPrice ? calcDiscountPercent(source.oldPrice, source.price) : 0,
    brandId: source.brandId,
    categoryId: source.categoryId,
    condition: source.condition,
    stock: 0,
    reservedStock: 0,
    availableStock: 0,
    sku: `${source.sku}-COPIA`,
    featured: false,
    onSale: false,
    active: false,
    imageUrl: '',
    imagePath: '',
    thumbUrl: '',
    thumbPath: '',
    additionalImages: [],
    promotion: null,
    demo: source.demo,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return id;
}

export async function deleteProduct(product: Product): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  batch.delete(doc(db, COL.products, product.id));
  batch.delete(doc(db, COL.promotions, product.id));
  await batch.commit();
  await deleteFiles([
    product.imagePath,
    product.thumbPath,
    ...product.additionalImages.flatMap((i) => [i.path, i.thumbPath]),
  ]);
}

