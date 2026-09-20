import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeAllBrands } from '@/services/brandService';
import { subscribeAllCategories } from '@/services/categoryService';
import { getProductById, saveProduct, type UploadProgress } from '@/services/productService';
import type { Brand, Category, FormErrors, ImageDraft, Product, ProductFormValues } from '@/types';
import { moneyToInput, parseMoney, toInputDateTime } from '@/utils/format';
import { CONDITION_LABEL } from '@/utils/labels';
import { calcDiscountPercent } from '@/utils/pricing';
import { validateProductForm } from '@/utils/validation';

const EMPTY: ProductFormValues = {
  name: '', sku: '', shortDescription: '', description: '', categoryId: '', brandId: '', price: '', oldPrice: '', costPrice: '',
  stock: '0', reservedStock: '0', condition: 'new', featured: false, active: true, onSale: false, promoPrice: '', promoStartsAt: '', promoEndsAt: '',
};

function fromProduct(p: Product): ProductFormValues {
  return {
    name: p.name, sku: p.sku, shortDescription: p.shortDescription, description: p.description, categoryId: p.categoryId, brandId: p.brandId ?? '',
    price: moneyToInput(p.price), oldPrice: moneyToInput(p.oldPrice), costPrice: moneyToInput(p.costPrice),
    stock: String(p.stock), reservedStock: String(p.reservedStock), condition: p.condition, featured: p.featured, active: p.active,
    onSale: p.onSale && p.promotion !== null, promoPrice: moneyToInput(p.promotion?.promoPrice), promoStartsAt: toInputDateTime(p.promotion?.startsAt ?? null),
    promoEndsAt: toInputDateTime(p.promotion?.endsAt ?? null),
  };
}

function draftsFromProduct(p: Product): ImageDraft[] {
  const list = [
    ...(p.imageUrl ? [{ url: p.imageUrl, path: p.imagePath, thumbUrl: p.thumbUrl || undefined, thumbPath: p.thumbPath || undefined }] : []),
    ...p.additionalImages,
  ];
  return list.map((img, i) => ({ id: `ex-${i}-${img.path}`, kind: 'existing' as const, previewUrl: img.thumbUrl || img.url, existing: img }));
}

export function ProductFormPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<ProductFormValues>(EMPTY);
  const [drafts, setDrafts] = useState<ImageDraft[]>([]);
  const [errors, setErrors] = useState<FormErrors<ProductFormValues>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: categories } = useSubscription<Category[]>(subscribeAllCategories, []);
  const { data: brands } = useSubscription<Brand[]>(subscribeAllBrands, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getProductById(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) { setLoadError('Produto não encontrado.'); return; }
        setProduct(p); setValues(fromProduct(p)); setDrafts(draftsFromProduct(p));
      })
      .catch((e: unknown) => { if (!cancelled) setLoadError(firebaseErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]): void => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const text = (key: keyof ProductFormValues) => (e: { target: { value: string } }): void => set(key, e.target.value as never);

  const price = parseMoney(values.price);
  const promo = parseMoney(values.promoPrice);
  const promoPct = useMemo(() => (values.onSale && price && promo && promo < price ? calcDiscountPercent(price, promo) : 0), [values.onSale, price, promo]);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const errs = validateProductForm(values);
    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length) {
      document.getElementById(`pf-${keys[0]}`)?.focus();
      toast.error('Corrija os campos destacados.');
      return;
    }
    setSaving(true);
    setSubmitError(null);
    setProgress(null);
    try {
      await saveProduct(values, drafts, { existing: product, onProgress: setProgress });
      toast.success(product ? 'Produto atualizado.' : 'Produto cadastrado.');
      navigate('/admin/products');
    } catch (err) {
      const msg = firebaseErrorMessage(err, 'Não foi possível salvar o produto.');
      setSubmitError(msg);
      toast.error('Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen label="Carregando produto…" />;
  if (loadError) return <FormAlert>{loadError} <Link to="/admin/products">Voltar para a lista</Link></FormAlert>;

  const f = (key: keyof ProductFormValues, hint?: string) => fieldA11y(`pf-${key}`, errors[key], hint);
  const pct = progress ? Math.round(progress.fraction * 100) : 0;

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate>
      <AdminPageHead
        title={editing ? 'Editar produto' : 'Novo produto'}
        lead={editing ? 'As mudanças aparecem na loja assim que você salvar.' : 'Preencha os dados. O produto só aparece na loja se estiver ativo.'}
      />
      {submitError ? <div style={{ marginBottom: 16 }}><FormAlert>{submitError}</FormAlert></div> : null}

      <div className="product-form">
        <div className="product-form__main">
          <Card>
            <CardHeader><CardTitle>Informações do produto</CardTitle></CardHeader>
            <CardContent>
              <div className="form-grid form-grid--2">
                <FormField id="pf-name" label="Nome" error={errors.name} className="form-span">
                  <Input {...f('name')} value={values.name} maxLength={120} onChange={text('name')} placeholder="Ex.: iPhone 11 128 GB" />
                </FormField>
                <FormField id="pf-sku" label="SKU" error={errors.sku} hint="Código interno para você identificar o produto.">
                  <Input {...f('sku', 'x')} value={values.sku} maxLength={40} onChange={text('sku')} />
                </FormField>
                <FormField id="pf-condition" label="Condição">
                  <NativeSelect id="pf-condition" value={values.condition} onChange={(e) => set('condition', e.target.value as ProductFormValues['condition'])}>
                    {(Object.keys(CONDITION_LABEL) as Array<keyof typeof CONDITION_LABEL>).map((c) => <option key={c} value={c}>{CONDITION_LABEL[c]}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField id="pf-categoryId" label="Categoria" error={errors.categoryId} hint={categories.length === 0 ? 'Cadastre uma categoria primeiro (menu Categorias).' : undefined}>
                  <NativeSelect {...f('categoryId')} value={values.categoryId} onChange={text('categoryId')}>
                    <option value="">Selecione…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inativa)'}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField id="pf-brandId" label="Marca" optional>
                  <NativeSelect id="pf-brandId" value={values.brandId} onChange={text('brandId')}>
                    <option value="">Sem marca</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}{b.active ? '' : ' (inativa)'}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField id="pf-shortDescription" label="Descrição curta" optional error={errors.shortDescription} hint={`${values.shortDescription.length}/160 · aparece nos resultados de busca`} className="form-span">
                  <Input {...f('shortDescription', 'x')} value={values.shortDescription} maxLength={170} onChange={text('shortDescription')} />
                </FormField>
                <FormField id="pf-description" label="Descrição completa" optional error={errors.description} className="form-span">
                  <Textarea {...f('description')} rows={6} value={values.description} maxLength={4100} onChange={text('description')} placeholder="Estado do aparelho, itens inclusos, especificações…" />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preço e estoque</CardTitle></CardHeader>
            <CardContent>
              <div className="form-grid form-grid--3">
                <FormField id="pf-price" label="Preço (R$)" error={errors.price}>
                  <Input {...f('price')} inputMode="decimal" value={values.price} onChange={text('price')} placeholder="0,00" />
                </FormField>
                <FormField id="pf-oldPrice" label="Preço anterior (R$)" optional error={errors.oldPrice} hint="Aparece riscado ao lado do preço.">
                  <Input {...f('oldPrice', 'x')} inputMode="decimal" value={values.oldPrice} onChange={text('oldPrice')} placeholder="0,00" />
                </FormField>
                <FormField id="pf-costPrice" label="Preço de custo (R$)" optional error={errors.costPrice} hint="Só você vê. Não aparece na loja.">
                  <Input {...f('costPrice', 'x')} inputMode="decimal" value={values.costPrice} onChange={text('costPrice')} placeholder="0,00" />
                </FormField>
                <FormField id="pf-stock" label="Estoque (unidades)" error={errors.stock}>
                  <Input {...f('stock')} inputMode="numeric" value={values.stock} onChange={text('stock')} />
                </FormField>
                <FormField id="pf-reservedStock" label="Reservado por pedidos" hint="Controlado automaticamente pelos pedidos.">
                  <Input id="pf-reservedStock" aria-describedby="pf-reservedStock-hint" value={values.reservedStock} readOnly disabled />
                </FormField>
                <FormField id="pf-available" label="Disponível para venda" hint="Estoque menos reservado.">
                  <Input id="pf-available" aria-describedby="pf-available-hint" value={String(Math.max(0, (Number(values.stock) || 0) - (Number(values.reservedStock) || 0)))} readOnly disabled />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promoção</CardTitle>
              <CardDescription>Preço promocional com data de início e fim (opcionais).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="switch-row">
                <span className="switch-row__text" id="pf-onSale-label">Produto em promoção</span>
                <Switch id="pf-onSale" aria-labelledby="pf-onSale-label" checked={values.onSale} onCheckedChange={(v) => set('onSale', v)} />
              </div>
              {values.onSale ? (
                <div className="form-grid form-grid--3" style={{ marginTop: 12 }}>
                  <FormField id="pf-promoPrice" label="Preço promocional (R$)" error={errors.promoPrice} hint={promoPct ? `Desconto de ${promoPct}% sobre o preço normal.` : undefined}>
                    <Input {...f('promoPrice', promoPct ? 'x' : undefined)} inputMode="decimal" value={values.promoPrice} onChange={text('promoPrice')} placeholder="0,00" />
                  </FormField>
                  <FormField id="pf-promoStartsAt" label="Início" optional hint="Vazio = começa agora.">
                    <Input id="pf-promoStartsAt" aria-describedby="pf-promoStartsAt-hint" type="datetime-local" value={values.promoStartsAt} onChange={text('promoStartsAt')} />
                  </FormField>
                  <FormField id="pf-promoEndsAt" label="Fim" optional error={errors.promoEndsAt} hint="Vazio = sem data para acabar.">
                    <Input {...f('promoEndsAt', 'x')} type="datetime-local" value={values.promoEndsAt} onChange={text('promoEndsAt')} />
                  </FormField>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="product-form__side">
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>A primeira é a principal. Envie várias para formar a galeria.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader drafts={drafts} onChange={setDrafts} disabled={saving} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Publicação</CardTitle></CardHeader>
            <CardContent>
              <div className="switch-row">
                <span className="switch-row__text" id="pf-active-label">Ativo na loja<small>Desativado, o produto some da loja.</small></span>
                <Switch id="pf-active" aria-labelledby="pf-active-label" checked={values.active} onCheckedChange={(v) => set('active', v)} />
              </div>
              <div className="switch-row">
                <span className="switch-row__text" id="pf-featured-label">Produto em destaque<small>Aparece na página inicial.</small></span>
                <Switch id="pf-featured" aria-labelledby="pf-featured-label" checked={values.featured} onCheckedChange={(v) => set('featured', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="form-sticky-bar">
        {saving && progress && progress.total > 0 ? (
          <div style={{ flex: '1 1 220px' }}>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Enviando imagens"><div className="progress__bar" style={{ width: `${pct}%` }} /></div>
            <p className="form-hint" role="status">Enviando imagens… {pct}%</p>
          </div>
        ) : null}
        <Button asChild variant="outline"><Link to="/admin/products">Cancelar</Link></Button>
        <Button type="submit" loading={saving}>{editing ? 'Salvar alterações' : 'Cadastrar produto'}</Button>
      </div>
    </form>
  );
}
