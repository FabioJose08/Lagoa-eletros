import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import { deleteFiles } from '@/firebase/storage';
import { calcDiscountPercent } from '@/utils/pricing';
import { computeAvailable } from '@/utils/stock';
import { DEMO_BRANDS, DEMO_CATEGORIES, DEMO_ORDERS, DEMO_PRODUCTS } from './demoData';
import { brandFromDoc, categoryFromDoc, productFromDoc } from './mappers';

/** Grava categorias, marcas, produtos, promoções e pedidos DEMO (todos com demo: true). Só administradores conseguem. */
export async function seedDemoData(): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const stamps = { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

  for (const c of DEMO_CATEGORIES) {
    batch.set(doc(db, COL.categories, c.id), { name: c.name, slug: c.id, description: '', icon: c.icon, imageUrl: '', imagePath: '', active: true, demo: true, ...stamps });
  }
  for (const b of DEMO_BRANDS) {
    batch.set(doc(db, COL.brands, b.id), { name: b.name, logoUrl: '', logoPath: '', active: true, demo: true, ...stamps });
  }
  for (const p of DEMO_PRODUCTS) {
    const promo = p.promoPrice !== null ? { promoPrice: p.promoPrice, startsAt: null, endsAt: null, active: true } : null;
    const discountPercentage = p.promoPrice !== null ? calcDiscountPercent(p.price, p.promoPrice) : 0;
    batch.set(doc(db, COL.products, p.id), {
      name: p.name, slug: p.id, description: p.shortDescription, shortDescription: p.shortDescription,
      price: p.price, oldPrice: null, costPrice: null, discountPercentage,
      brandId: p.brandId, categoryId: p.categoryId, condition: p.condition,
      stock: p.stock, reservedStock: 0, availableStock: computeAvailable(p.stock, 0),
      sku: `DEMO-${p.id.slice(0, 8).toUpperCase()}`, featured: p.featured, onSale: promo !== null, active: true,
      imageUrl: '', imagePath: '', thumbUrl: '', thumbPath: '', additionalImages: [], promotion: promo,
      demo: true, ...stamps,
    });
    if (promo) {
      batch.set(doc(db, COL.promotions, p.id), {
        productId: p.id, productName: p.name, regularPrice: p.price, promoPrice: promo.promoPrice, discountPercentage,
        startsAt: null, endsAt: null, active: true, demo: true, ...stamps,
      });
    }
  }
  for (const o of DEMO_ORDERS) {
    const items = o.productIds.map((pid) => {
      const p = DEMO_PRODUCTS.find((x) => x.id === pid);
      if (!p) throw new Error(`Produto demo inexistente: ${pid}`);
      const price = p.promoPrice ?? p.price;
      return { productId: p.id, name: p.name, price, originalPrice: p.price, quantity: 1, imageUrl: '', sku: `DEMO-${p.id.slice(0, 8).toUpperCase()}` };
    });
    const subtotal = items.reduce((s, i) => s + i.originalPrice, 0);
    const total = items.reduce((s, i) => s + i.price, 0);
    batch.set(doc(db, COL.orders, o.key), {
      userId: 'demo-user',
      customer: { name: 'Cliente DEMO', email: 'cliente.demo@exemplo.com', phone: '' },
      items, subtotal, discount: subtotal - total, shipping: 0, total,
      paymentMethod: 'arrange_whatsapp', paymentStatus: o.status === 'cancelled' ? 'cancelled' : 'pending',
      orderStatus: o.status, stockApplied: 'none', notes: '', demo: true, ...stamps,
    });
  }
  await batch.commit();
}

/** Apaga TUDO que estiver marcado como demo (e as imagens desses itens no Storage). Dados reais não são tocados. */
export async function removeDemoData(): Promise<void> {
  const db = getDb();
  const paths: string[] = [];
  for (const name of [COL.orders, COL.promotions, COL.products, COL.categories, COL.brands]) {
    const snap = await getDocs(query(collection(db, name), where('demo', '==', true)));
    if (snap.empty) continue;
    snap.docs.forEach((d) => {
      if (name === COL.products) {
        const p = productFromDoc(d.id, d.data());
        paths.push(p.imagePath, p.thumbPath, ...p.additionalImages.flatMap((i) => [i.path, i.thumbPath ?? '']));
      } else if (name === COL.categories) paths.push(categoryFromDoc(d.id, d.data()).imagePath);
      else if (name === COL.brands) paths.push(brandFromDoc(d.id, d.data()).logoPath);
    });
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteFiles(paths);
}
