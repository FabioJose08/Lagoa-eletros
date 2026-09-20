import { useState } from 'react';
import { CircleAlert, CircleCheck, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FormAlert } from '@/components/common/FormField';
import { EmptyState } from '@/components/common/PageState';
import { Icon } from '@/components/icons';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ProductImage } from '@/components/store/ProductImage';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { createOrder, OrderError } from '@/services/orderService';
import type { CartLine, Order, PaymentMethod } from '@/types';
import { formatBRL, formatOrderCode } from '@/utils/format';
import { PAYMENT_METHOD_LABEL } from '@/utils/labels';
import { WA_MESSAGES } from '@/utils/whatsapp';

const PROBLEM_TEXT: Record<NonNullable<CartLine['problem']>, string> = {
  unavailable: 'Este produto não está mais disponível. Remova-o do carrinho.',
  out_of_stock: 'Este produto ficou sem estoque. Remova-o do carrinho.',
  insufficient_stock: 'A quantidade escolhida é maior que o estoque disponível. Diminua a quantidade.',
};

const METHODS: Array<{ value: PaymentMethod; hint: string }> = [
  { value: 'arrange_whatsapp', hint: 'Você e a loja combinam o pagamento e a entrega/retirada pelo WhatsApp.' },
  { value: 'pay_on_pickup', hint: 'Você paga na loja, quando retirar o produto.' },
];

export function CartPage(): JSX.Element {
  useDocumentMeta({ title: 'Carrinho', noindex: true });
  const cart = useCart();
  const { user, profile } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>('arrange_whatsapp');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);

  const crumbs = <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Carrinho' }]} />;

  const checkout = async (): Promise<void> => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder({
        customer: { uid: user.uid, name: profile?.name || user.displayName || 'Cliente', email: user.email, phone: profile?.phone ?? '' },
        lines: cart.lines,
        paymentMethod: method,
        notes,
      });
      cart.clear();
      setDone(order);
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof OrderError ? e.message : firebaseErrorMessage(e, 'Não foi possível criar o pedido. Tente novamente.'));
      toast.error('Não foi possível finalizar o pedido.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const code = formatOrderCode(done.id);
    return (
      <div className="container section section--tight">
        <div className="success-box" role="status">
          <span className="success-box__icon"><Icon as={CircleCheck} size={32} /></span>
          <h1 className="page-title" tabIndex={-1}>Pedido {code} registrado!</h1>
          <p className="page-lead">Total: <strong>{formatBRL(done.total)}</strong>. A loja vai confirmar o seu pedido. O pagamento é combinado com a Lagoa Eletros ({PAYMENT_METHOD_LABEL[done.paymentMethod].toLowerCase()}).</p>
          <div className="state__actions">
            <WhatsAppButton message={WA_MESSAGES.order(code, formatBRL(done.total))} label="Combinar pelo WhatsApp" size="lg" />
            <Button asChild variant="outline" size="lg"><Link to="/orders">Acompanhar meus pedidos</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <>
        <div className="container page-head">{crumbs}<h1 className="page-title" tabIndex={-1}>Carrinho</h1></div>
        <div className="container section section--tight">
          <EmptyState icon={ShoppingCart} title="Seu carrinho está vazio." text="Escolha um produto e adicione ao carrinho."
            actions={<Button asChild><Link to="/products">Ver produtos</Link></Button>} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container page-head">{crumbs}<h1 className="page-title" tabIndex={-1}>Carrinho</h1></div>
      <div className="container section section--tight">
        <div className="cart">
          <div className="cart__lines">
            {cart.lines.map((l) => (
              <div key={l.item.productId} className={`cart-line${l.problem ? ' cart-line--problem' : ''}`}>
                <div className="cart-line__img">
                  {l.product ? <ProductImage product={l.product} /> : <div className="pimg" aria-hidden="true" />}
                </div>
                <div>
                  {l.product ? <Link className="cart-line__name" to={`/products/${l.product.slug}`}>{l.product.name}</Link> : <span className="cart-line__name">Produto indisponível</span>}
                  {l.product ? <div style={{ marginTop: 4 }}><PriceDisplay product={l.product} /></div> : null}
                  {l.problem ? <p className="form-error" role="alert" style={{ marginTop: 8 }}><Icon as={CircleAlert} size={16} /><span>{PROBLEM_TEXT[l.problem]}</span></p> : null}
                  <div className="cart-line__row">
                    <div className="qty" role="group" aria-label={`Quantidade de ${l.product?.name ?? 'produto'}`}>
                      <button type="button" aria-label="Diminuir quantidade" disabled={l.item.quantity <= 1} onClick={() => cart.setQuantity(l.item.productId, l.item.quantity - 1)}><Icon as={Minus} size={18} /></button>
                      <output aria-live="polite">{l.item.quantity}</output>
                      <button type="button" aria-label="Aumentar quantidade" disabled={l.item.quantity >= l.maxQuantity} onClick={() => cart.setQuantity(l.item.productId, l.item.quantity + 1)}><Icon as={Plus} size={18} /></button>
                    </div>
                    <strong>{l.problem ? '—' : formatBRL(l.lineTotal)}</strong>
                    <Button variant="ghost" onClick={() => cart.remove(l.item.productId)} aria-label={`Remover ${l.product?.name ?? 'produto'} do carrinho`}><Icon as={Trash2} size={18} />Remover</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="summary" aria-label="Resumo do pedido">
            <h2 className="summary__title">Resumo do pedido</h2>
            <div className="summary__row"><span>Subtotal ({cart.count} {cart.count === 1 ? 'item' : 'itens'})</span><span>{formatBRL(cart.subtotal)}</span></div>
            {cart.discount > 0 ? <div className="summary__row summary__row--muted"><span>Desconto</span><span>- {formatBRL(cart.discount)}</span></div> : null}
            <div className="summary__row summary__row--muted"><span>Frete</span><span>A combinar</span></div>
            <div className="summary__row summary__total"><span>Total</span><span>{formatBRL(cart.total)}</span></div>

            <FormAlert tone="info">
              Pagamento online (Pix e cartão) ainda não está disponível. O pedido é registrado e o pagamento é combinado com a loja.
            </FormAlert>

            {user ? (
              <>
                <fieldset className="radio-list">
                  <legend className="label">Como você prefere pagar?</legend>
                  {METHODS.map((m) => (
                    <label className="radio" key={m.value}>
                      <input type="radio" name="payment" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
                      <span><strong>{PAYMENT_METHOD_LABEL[m.value]}</strong><small>{m.hint}</small></span>
                    </label>
                  ))}
                </fieldset>
                <div className="form-field">
                  <label className="label" htmlFor="order-notes">Observações <span className="label__opt">(opcional)</span></label>
                  <Textarea id="order-notes" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: prefiro retirar na sexta-feira" />
                </div>
                {error ? <FormAlert>{error}</FormAlert> : null}
                <Button size="lg" block loading={busy} disabled={cart.hasProblems || cart.count === 0} onClick={() => void checkout()}>Finalizar pedido</Button>
                {cart.hasProblems ? <p className="form-hint">Resolva os avisos em vermelho para finalizar.</p> : null}
              </>
            ) : (
              <>
                <p className="form-hint">Para finalizar, entre na sua conta (ou crie uma em um minuto). Seu carrinho fica guardado.</p>
                <Button asChild size="lg" block><Link to="/login" state={{ from: '/cart' }}>Entrar para finalizar</Link></Button>
                <Button asChild variant="outline" block><Link to="/register" state={{ from: '/cart' }}>Criar conta</Link></Button>
              </>
            )}
            <WhatsAppButton message={WA_MESSAGES.generic} label="Prefiro falar no WhatsApp" block />
          </aside>
        </div>
      </div>
    </>
  );
}
