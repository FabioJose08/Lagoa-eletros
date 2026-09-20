import assert from 'node:assert/strict';
import { getPriceInfo, isPromotionActive, calcDiscountPercent } from '@/utils/pricing';
import { getStockState, getProductStatus, stockDeltaFor, targetStockApplied, applyStockDelta, InsufficientStockError, computeAvailable } from '@/utils/stock';
import { filterProducts, filtersFromParams, filtersToParams, DEFAULT_FILTERS } from '@/utils/search';
import { parseMoney, formatBRL, toInputDateTime, fromInputDateTime, formatOrderCode } from '@/utils/format';
import { slugify } from '@/utils/slug';
import { validateProductForm, validateRegister } from '@/utils/validation';
import { waLink, WA_MESSAGES } from '@/utils/whatsapp';
import { hasStorageConfigured } from '@/firebase/config';
import { getPasswordResetActionCodeSettings } from '@/firebase/auth';
import { buildImageUploadJobs, buildLocalFallbackImages } from '@/services/productService';
import type { Product, ProductFormValues, ImageDraft } from '@/types';

let n = 0; const t = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓', name); };
const base = (o: Partial<Product> = {}): Product => ({
  id: 'p1', name: 'iPhone 11 128 GB', slug: 'iphone-11', description: '', shortDescription: '', price: 1000, oldPrice: null, costPrice: null,
  discountPercentage: 0, brandId: 'apple', categoryId: 'celulares', condition: 'refurbished', stock: 5, reservedStock: 0, availableStock: 5,
  sku: 'IP11', featured: false, onSale: false, active: true, imageUrl: '', imagePath: '', thumbUrl: '', thumbPath: '', additionalImages: [],
  promotion: null, demo: false, createdAt: null, updatedAt: null, ...o,
});
const now = new Date('2026-09-19T12:00:00');
const day = (d: number) => new Date(now.getTime() + d * 86400000);

console.log('PREÇO / PROMOÇÃO');
t('sem promoção: preço normal', () => { const i = getPriceInfo(base(), now); assert.equal(i.current, 1000); assert.equal(i.previous, null); assert.equal(i.isPromo, false); });
t('preço anterior manual mostra riscado', () => { const i = getPriceInfo(base({ oldPrice: 1250 }), now); assert.equal(i.previous, 1250); assert.equal(i.discountPercent, 20); assert.equal(i.isPromo, false); });
t('promoção ativa aplica preço promocional', () => { const i = getPriceInfo(base({ onSale: true, promotion: { promoPrice: 800, active: true, startsAt: day(-1), endsAt: day(1) } }), now); assert.equal(i.current, 800); assert.equal(i.previous, 1000); assert.equal(i.discountPercent, 20); assert.equal(i.isPromo, true); });
t('promoção que ainda não começou é ignorada', () => assert.equal(getPriceInfo(base({ onSale: true, promotion: { promoPrice: 800, active: true, startsAt: day(2), endsAt: null } }), now).current, 1000));
t('promoção que já terminou é ignorada', () => assert.equal(getPriceInfo(base({ onSale: true, promotion: { promoPrice: 800, active: true, startsAt: null, endsAt: day(-1) } }), now).current, 1000));
t('promoção desativada é ignorada', () => assert.equal(isPromotionActive({ promoPrice: 800, active: false, startsAt: null, endsAt: null }, now), false));
t('promo maior que preço é ignorada (dado inválido)', () => assert.equal(getPriceInfo(base({ onSale: true, promotion: { promoPrice: 1200, active: true, startsAt: null, endsAt: null } }), now).current, 1000));
t('desconto arredondado', () => assert.equal(calcDiscountPercent(949, 849), 11));

console.log('ESTOQUE');
t('estados', () => { assert.equal(getStockState({ availableStock: 0 }), 'out_of_stock'); assert.equal(getStockState({ availableStock: 3 }), 'low_stock'); assert.equal(getStockState({ availableStock: 4 }), 'in_stock'); });
t('status do produto', () => { assert.equal(getProductStatus({ active: false, availableStock: 9 }), 'inactive'); assert.equal(getProductStatus({ active: true, availableStock: 0 }), 'out_of_stock'); assert.equal(getProductStatus({ active: true, availableStock: 2 }), 'active'); });
t('disponível = estoque - reservado', () => assert.equal(computeAvailable(5, 2), 3));
t('mapa status->estoque', () => { assert.equal(targetStockApplied('pending'), 'none'); assert.equal(targetStockApplied('confirmed'), 'reserved'); assert.equal(targetStockApplied('shipped'), 'reserved'); assert.equal(targetStockApplied('completed'), 'deducted'); assert.equal(targetStockApplied('cancelled'), 'none'); });
t('none->reserved reserva', () => assert.deepEqual(stockDeltaFor('none', 'reserved', 2), { stock: 0, reserved: 2 }));
t('reserved->deducted baixa e libera reserva', () => assert.deepEqual(stockDeltaFor('reserved', 'deducted', 2), { stock: -2, reserved: -2 }));
t('none->deducted baixa direto', () => assert.deepEqual(stockDeltaFor('none', 'deducted', 2), { stock: -2, reserved: 0 }));
t('reserved->none libera', () => assert.deepEqual(stockDeltaFor('reserved', 'none', 2), { stock: 0, reserved: -2 }));
t('deducted->none repõe estoque', () => assert.deepEqual(stockDeltaFor('deducted', 'none', 2), { stock: 2, reserved: 0 }));
t('mesmo estado = nada muda', () => assert.deepEqual(stockDeltaFor('reserved', 'reserved', 3), { stock: 0, reserved: 0 }));
t('reservar aplica e recalcula disponível', () => assert.deepEqual(applyStockDelta({ name: 'X', stock: 5, reservedStock: 1 }, { stock: 0, reserved: 2 }), { stock: 5, reservedStock: 3, availableStock: 2 }));
t('reservar além do disponível é bloqueado', () => assert.throws(() => applyStockDelta({ name: 'X', stock: 5, reservedStock: 4 }, { stock: 0, reserved: 2 }), InsufficientStockError));
t('baixa além do estoque é bloqueada', () => assert.throws(() => applyStockDelta({ name: 'X', stock: 1, reservedStock: 0 }, { stock: -2, reserved: 0 }), InsufficientStockError));
t('liberar nunca deixa negativo', () => assert.deepEqual(applyStockDelta({ name: 'X', stock: 5, reservedStock: 0 }, { stock: 0, reserved: -2 }), { stock: 5, reservedStock: 0, availableStock: 5 }));

console.log('BUSCA E FILTROS');
const cats: Record<string, string> = { celulares: 'Celulares', notebooks: 'Notebooks' };
const brands: Record<string, string> = { apple: 'Apple', dell: 'Dell' };
const lookup = { categoryName: (id: string) => cats[id] ?? '', brandName: (id: string | null) => (id ? brands[id] ?? '' : '') };
const list = [
  base({ id: 'a', name: 'iPhone 11 128 GB', price: 1899, condition: 'refurbished', featured: true }),
  base({ id: 'b', name: 'Notebook Dell Inspiron', categoryId: 'notebooks', brandId: 'dell', price: 2199, condition: 'used' }),
  base({ id: 'c', name: 'Galaxy A15', price: 949, condition: 'new', onSale: true, promotion: { promoPrice: 849, active: true, startsAt: null, endsAt: null } }),
  base({ id: 'd', name: 'Moto G24', price: 549, condition: 'used', stock: 0, availableStock: 0 }),
];
const ids = (l: Product[]) => l.map((p) => p.id).sort().join(',');
t('busca por nome sem acento/caixa', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, query: 'IPHONE' }, lookup, now)), 'a'));
t('busca por categoria', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, query: 'notebook' }, lookup, now)), 'b'));
t('busca por marca', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, query: 'dell' }, lookup, now)), 'b'));
t('busca por condição (usado)', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, query: 'usado' }, lookup, now)), 'b,d'));
t('filtro por condição', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, conditions: ['new'] }, lookup, now)), 'c'));
t('faixa de preço usa o preço ATUAL (promo)', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, minPrice: '800', maxPrice: '900' }, lookup, now)), 'c'));
t('só promoções', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, onSaleOnly: true }, lookup, now)), 'c'));
t('só disponíveis', () => assert.equal(ids(filterProducts(list, { ...DEFAULT_FILTERS, inStockOnly: true }, lookup, now)), 'a,b,c'));
t('ordenar por menor preço', () => assert.deepEqual(filterProducts(list, { ...DEFAULT_FILTERS, sort: 'price_asc' }, lookup, now).map((p) => p.id), ['d', 'c', 'a', 'b']));
t('relevância: destaque primeiro', () => assert.equal(filterProducts(list, DEFAULT_FILTERS, lookup, now)[0].id, 'a'));
t('URL ida e volta', () => { const f = { ...DEFAULT_FILTERS, query: 'x y', categoryIds: ['celulares'], conditions: ['new' as const], onSaleOnly: true, sort: 'price_desc' as const }; assert.deepEqual(filtersFromParams(filtersToParams(f)), f); });
t('URL ignora condição inválida', () => assert.deepEqual(filtersFromParams(new URLSearchParams('cond=new,hack')).conditions, ['new']));

console.log('FORMATAÇÃO / VALIDAÇÃO');
t('parseMoney PT-BR', () => { assert.equal(parseMoney('1.299,90'), 1299.9); assert.equal(parseMoney('R$ 59'), 59); assert.equal(parseMoney('849.5'), 849.5); assert.equal(parseMoney(''), null); assert.equal(parseMoney('abc'), null); });
t('formatBRL', () => assert.match(formatBRL(1899), /R\$\s?1\.899,00/));
t('datetime-local ida e volta', () => { const d = new Date(2026, 8, 19, 14, 30); assert.equal(toInputDateTime(d), '2026-09-19T14:30'); assert.equal(fromInputDateTime('2026-09-19T14:30')?.getTime(), d.getTime()); });
t('slugify', () => assert.equal(slugify('Notebook Dell 15" Ação!'), 'notebook-dell-15-acao'));
t('código do pedido', () => assert.equal(formatOrderCode('abc123xyz'), '#ABC123'));
const ok: ProductFormValues = { name: 'Galaxy A15', sku: 'GA15', shortDescription: '', description: '', categoryId: 'celulares', brandId: 'samsung', price: '949', oldPrice: '', costPrice: '', stock: '4', reservedStock: '0', condition: 'new', featured: false, active: true, onSale: false, promoPrice: '', promoStartsAt: '', promoEndsAt: '' };
t('produto válido não tem erros', () => assert.deepEqual(validateProductForm(ok), {}));
t('nome/preço/estoque inválidos', () => { const e = validateProductForm({ ...ok, name: 'a', price: '0', stock: '-1' }); assert.ok(e.name && e.price && e.stock); });
t('preço anterior deve ser maior', () => assert.ok(validateProductForm({ ...ok, oldPrice: '900' }).oldPrice));
t('promo exige preço menor que o normal', () => { assert.ok(validateProductForm({ ...ok, onSale: true, promoPrice: '' }).promoPrice); assert.ok(validateProductForm({ ...ok, onSale: true, promoPrice: '1000' }).promoPrice); assert.deepEqual(validateProductForm({ ...ok, onSale: true, promoPrice: '849' }), {}); });
t('fim da promo depois do início', () => assert.ok(validateProductForm({ ...ok, onSale: true, promoPrice: '849', promoStartsAt: '2026-09-20T10:00', promoEndsAt: '2026-09-19T10:00' }).promoEndsAt));
t('reservado não pode passar do estoque', () => assert.ok(validateProductForm({ ...ok, reservedStock: '9' }).stock));
t('cadastro: senhas e e-mail', () => { const e = validateRegister({ name: 'Ana', email: 'x', password: '123', confirm: '456', phone: '' }); assert.ok(e.email && e.password && e.confirm); });
console.log('CONFIGURAÇÃO');
t('modo sem storage é o padrão quando uploads não estão explicitamente ativados', () => { assert.equal(hasStorageConfigured(), import.meta.env?.VITE_ENABLE_STORAGE_UPLOADS === 'true' && Boolean(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET)); });
t('planejamento de upload divide cada imagem em principal + miniatura', () => {
  const main = new Blob(['main'], { type: 'image/jpeg' });
  const thumb = new Blob(['thumb'], { type: 'image/jpeg' });
  const drafts: ImageDraft[] = [
    { id: '1', kind: 'new', previewUrl: 'a', mainBlob: main, thumbBlob: thumb, fileName: 'a.jpg', sizeBytes: 100 },
    { id: '2', kind: 'new', previewUrl: 'b', mainBlob: main, thumbBlob: thumb, fileName: 'b.jpg', sizeBytes: 100 },
    { id: '3', kind: 'existing', previewUrl: 'c', existing: { url: 'c', path: 'c', thumbUrl: 'd', thumbPath: 'd' } },
  ];
  const jobs = buildImageUploadJobs(drafts, 'p123');
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].folder, 'main');
  assert.equal(jobs[1].folder, 'gallery');
  assert.match(jobs[0].mainPath, /^product-images\/p123\/main\//);
  assert.match(jobs[0].thumbPath, /^product-images\/p123\/main\//);
});
t('fallback local usa data URL do arquivo do usuário ao invés do placeholder', async () => {
  const drafts: ImageDraft[] = [
    { id: '1', kind: 'new', previewUrl: 'blob:iphone-11', mainBlob: new Blob(['x'], { type: 'image/jpeg' }), thumbBlob: new Blob(['y'], { type: 'image/jpeg' }) },
  ];
  const fallback = await buildLocalFallbackImages(drafts);
  assert.match(fallback[0].url, /^data:image\//);
  assert.notEqual(fallback[0].url, '/brand/logo-mark.webp');
  assert.match(fallback[0].thumbUrl ?? '', /^data:image\//);
});

console.log('WHATSAPP');
t('link', () => assert.equal(waLink(), 'https://wa.me/5581973307680'));
t('mensagem do briefing', () => { const m = decodeURIComponent(waLink(WA_MESSAGES.interest('iPhone 11')).split('text=')[1]); assert.equal(m, 'Olá! Tenho interesse no produto iPhone 11 da Lagoa Eletros. Gostaria de saber disponibilidade e informações.'); });
t('mensagem demo avisa que é teste', () => assert.match(WA_MESSAGES.interest('X', true), /teste do site/));

t('reset de senha usa a URL do site', () => {
  assert.deepEqual(getPasswordResetActionCodeSettings('https://loja.com.br'), { url: 'https://loja.com.br/login', handleCodeInApp: false });
});
console.log(`\n${n} testes de lógica passaram.`);
