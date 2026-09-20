import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeAllProducts } from '@/services/productService';
import { removePromotion, savePromotion, setPromotionActive, subscribePromotions } from '@/services/promotionService';
import type { FormErrors, Product, Promotion } from '@/types';
import { formatBRL, formatDateTime, fromInputDateTime, moneyToInput, parseMoney, toInputDateTime } from '@/utils/format';
import { calcDiscountPercent } from '@/utils/pricing';
import { validatePromotionForm, type PromotionFormValues } from '@/utils/validation';

type PromoState = 'active' | 'scheduled' | 'ended' | 'disabled';
export function promoState(p: Promotion, now: Date = new Date()): PromoState {
  if (!p.active) return 'disabled';
  if (p.startsAt && now < p.startsAt) return 'scheduled';
  if (p.endsAt && now > p.endsAt) return 'ended';
  return 'active';
}
const STATE_BADGE: Record<PromoState, { label: string; variant: 'success' | 'info' | 'neutral' | 'danger' }> = {
  active: { label: 'Ativa', variant: 'success' }, scheduled: { label: 'Agendada', variant: 'info' }, ended: { label: 'Encerrada', variant: 'danger' }, disabled: { label: 'Desativada', variant: 'neutral' },
};

function PromotionDialog({ promotion, products, open, onClose }: { promotion: Promotion | null; products: Product[]; open: boolean; onClose: () => void }): JSX.Element {
  const [v, setV] = useState<PromotionFormValues>({ productId: '', promoPrice: '', startsAt: '', endsAt: '' });
  const [percent, setPercent] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<FormErrors<PromotionFormValues>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setV(promotion ? { productId: promotion.productId, promoPrice: moneyToInput(promotion.promoPrice), startsAt: toInputDateTime(promotion.startsAt), endsAt: toInputDateTime(promotion.endsAt) } : { productId: '', promoPrice: '', startsAt: '', endsAt: '' });
    setPercent(promotion ? String(promotion.discountPercentage) : '');
    setActive(promotion?.active ?? true); setErrors({}); setFormError('');
  }, [open, promotion]);

  const product = products.find((p) => p.id === v.productId) ?? null;
  const regular = product?.price ?? null;

  // Preço e percentual andam juntos: digitar um calcula o outro.
  const onPrice = (val: string): void => {
    setV((c) => ({ ...c, promoPrice: val }));
    const n = parseMoney(val);
    setPercent(n && regular && n < regular ? String(calcDiscountPercent(regular, n)) : '');
  };
  const onPercent = (val: string): void => {
    setPercent(val);
    const pc = Number(val);
    if (regular && pc > 0 && pc < 100) setV((c) => ({ ...c, promoPrice: moneyToInput(Math.round(regular * (1 - pc / 100) * 100) / 100) }));
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const errs = validatePromotionForm(v, regular);
    setErrors(errs);
    if (Object.keys(errs).length || !product) return;
    setBusy(true);
    setFormError('');
    try {
      await savePromotion({ product, promoPrice: parseMoney(v.promoPrice) ?? 0, startsAt: fromInputDateTime(v.startsAt), endsAt: fromInputDateTime(v.endsAt), active });
      toast.success('Promoção salva. Já vale na loja.');
      onClose();
    } catch (e2) { setFormError(firebaseErrorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(x) => { if (!x) onClose(); }} title={promotion ? 'Editar promoção' : 'Nova promoção'}
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" form="promo-form" loading={busy}>Salvar promoção</Button></>}>
      <form id="promo-form" className="form-grid form-grid--2" onSubmit={(e) => void submit(e)} noValidate>
        {formError ? <div className="form-span"><FormAlert>{formError}</FormAlert></div> : null}
        <FormField id="pr-product" label="Produto" error={errors.productId} className="form-span" hint={regular !== null ? `Preço normal: ${formatBRL(regular)}` : undefined}>
          <NativeSelect {...fieldA11y('pr-product', errors.productId, regular !== null)} disabled={promotion !== null} value={v.productId} onChange={(e) => setV((c) => ({ ...c, productId: e.target.value }))}>
            <option value="">Selecione…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </FormField>
        <FormField id="pr-price" label="Preço promocional (R$)" error={errors.promoPrice}>
          <Input {...fieldA11y('pr-price', errors.promoPrice)} inputMode="decimal" value={v.promoPrice} onChange={(e) => onPrice(e.target.value)} placeholder="0,00" />
        </FormField>
        <FormField id="pr-percent" label="ou Desconto (%)" optional>
          <Input id="pr-percent" inputMode="numeric" value={percent} onChange={(e) => onPercent(e.target.value)} placeholder="Ex.: 10" />
        </FormField>
        <FormField id="pr-start" label="Início" optional hint="Vazio = começa agora."><Input id="pr-start" aria-describedby="pr-start-hint" type="datetime-local" value={v.startsAt} onChange={(e) => setV((c) => ({ ...c, startsAt: e.target.value }))} /></FormField>
        <FormField id="pr-end" label="Fim" optional error={errors.endsAt} hint="Vazio = sem data para acabar."><Input {...fieldA11y('pr-end', errors.endsAt, true)} type="datetime-local" value={v.endsAt} onChange={(e) => setV((c) => ({ ...c, endsAt: e.target.value }))} /></FormField>
        <div className="switch-row form-span"><span className="switch-row__text" id="pr-active-label">Promoção ativa</span><Switch aria-labelledby="pr-active-label" checked={active} onCheckedChange={setActive} /></div>
      </form>
    </Dialog>
  );
}

export function PromotionsAdminPage(): JSX.Element {
  const { data: promos, loading, error } = useSubscription<Promotion[]>(subscribePromotions, []);
  const { data: products } = useSubscription<Product[]>(subscribeAllProducts, []);
  const [editing, setEditing] = useState<{ promotion: Promotion | null } | null>(null);
  const [toRemove, setToRemove] = useState<Promotion | null>(null);
  const [busy, setBusy] = useState(false);
  const available = useMemo(() => (editing?.promotion ? products : products.filter((p) => !promos.some((x) => x.productId === p.id))), [products, promos, editing]);

  const toggle = async (p: Promotion): Promise<void> => {
    try { await setPromotionActive(p, !p.active); toast.success(p.active ? 'Promoção desativada.' : 'Promoção ativada.'); } catch (e) { toast.error(firebaseErrorMessage(e)); }
  };
  const confirmRemove = async (): Promise<void> => {
    if (!toRemove) return;
    setBusy(true);
    try { await removePromotion(toRemove); toast.success('Promoção removida. O produto voltou ao preço normal.'); } catch (e) { toast.error(firebaseErrorMessage(e)); } finally { setBusy(false); setToRemove(null); }
  };

  return (
    <>
      <AdminPageHead title="Promoções" lead="Defina preço promocional, desconto e o período. O cliente vê o preço anterior riscado, o novo preço e a porcentagem."
        actions={<Button onClick={() => setEditing({ promotion: null })}><Icon as={Plus} size={18} />Nova promoção</Button>} />
      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando promoções…" /> : null}
      {!loading && !error && promos.length === 0 ? <EmptyState title="Nenhuma promoção." text="Crie uma promoção para um produto." actions={<Button onClick={() => setEditing({ promotion: null })}>Nova promoção</Button>} /> : null}
      {promos.length > 0 ? (
        <Table aria-label="Lista de promoções">
          <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="data-table__num">Normal</TableHead><TableHead className="data-table__num">Promocional</TableHead><TableHead className="data-table__num">Desconto</TableHead><TableHead>Período</TableHead><TableHead>Situação</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {promos.map((p) => {
              const st = STATE_BADGE[promoState(p)];
              return (
                <TableRow key={p.id}>
                  <TableCell><div className="cell-product__name">{p.productName}</div>{p.demo ? <div className="data-table__muted">DEMO</div> : null}</TableCell>
                  <TableCell className="data-table__num">{formatBRL(p.regularPrice)}</TableCell>
                  <TableCell className="data-table__num data-table__strong">{formatBRL(p.promoPrice)}</TableCell>
                  <TableCell className="data-table__num">-{p.discountPercentage}%</TableCell>
                  <TableCell>{p.startsAt || p.endsAt ? `${p.startsAt ? formatDateTime(p.startsAt) : 'Agora'} → ${p.endsAt ? formatDateTime(p.endsAt) : 'sem fim'}` : 'Sem data'}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell>
                    <div className="data-table__actions">
                      <Button variant="ghost" size="icon" aria-label={`Editar promoção de ${p.productName}`} onClick={() => setEditing({ promotion: p })}><Icon as={Pencil} size={18} /></Button>
                      <Button variant="ghost" size="icon" aria-label={p.active ? `Desativar promoção de ${p.productName}` : `Ativar promoção de ${p.productName}`} aria-pressed={p.active} onClick={() => void toggle(p)}><Icon as={Power} size={18} /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Remover promoção de ${p.productName}`} onClick={() => setToRemove(p)}><Icon as={Trash2} size={18} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}
      <PromotionDialog open={editing !== null} promotion={editing?.promotion ?? null} products={available} onClose={() => setEditing(null)} />
      <ConfirmDialog open={toRemove !== null} onOpenChange={(v) => { if (!v) setToRemove(null); }} title="Remover promoção?" description={`O produto “${toRemove?.productName ?? ''}” volta ao preço normal.`} confirmLabel="Remover" destructive loading={busy} onConfirm={() => void confirmRemove()} />
    </>
  );
}
