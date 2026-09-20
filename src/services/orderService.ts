import {
  collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where,
  type Unsubscribe,
} from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import type { CartLine, Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { getPriceInfo } from '@/utils/pricing';
import { applyStockDelta, isPurchasable, stockDeltaFor, targetStockApplied } from '@/utils/stock';
import { orderFromDoc, productFromDoc } from './mappers';

type OnError = (err: Error) => void;

/** Erro de negócio com mensagem pronta para mostrar ao cliente. */
export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface CreateOrderInput {
  customer: { uid: string; name: string; email: string; phone: string };
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  notes: string;
  shipping?: number;
}

/**
 * Cria o pedido no Firestore.
 * Os produtos são LIDOS DE NOVO do banco (preço e estoque atuais), não do carrinho do navegador.
 * O pedido guarda uma FOTO dos dados (nome, preço, quantidade, imagem), então o histórico não muda se o produto mudar depois.
 * O estoque NÃO é alterado aqui: isso acontece quando o administrador confirma o pedido.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = getDb();
  const items: OrderItem[] = [];
  let subtotal = 0;
  let payable = 0;

  for (const line of input.lines) {
    const qty = line.item.quantity;
    const snap = await getDoc(doc(db, COL.products, line.item.productId));
    if (!snap.exists()) throw new OrderError(`"${line.product?.name ?? 'Um produto'}" não está mais disponível. Remova-o do carrinho.`);
    const p = productFromDoc(snap.id, snap.data());
    if (!isPurchasable(p)) throw new OrderError(`"${p.name}" não está disponível para compra no momento.`);
    if (p.availableStock < qty) {
      throw new OrderError(`Só temos ${p.availableStock} unidade(s) de "${p.name}". Ajuste a quantidade no carrinho.`);
    }
    const price = getPriceInfo(p);
    items.push({
      productId: p.id,
      name: p.name,
      price: price.current,
      originalPrice: price.previous ?? price.current,
      quantity: qty,
      imageUrl: p.thumbUrl || p.imageUrl,
      sku: p.sku,
    });
    subtotal += (price.previous ?? price.current) * qty;
    payable += price.current * qty;
  }

  const shipping = input.shipping ?? 0;
  const orderRef = doc(collection(db, COL.orders));
  const data = {
    userId: input.customer.uid,
    customer: { name: input.customer.name, email: input.customer.email, phone: input.customer.phone },
    items,
    subtotal: round2(subtotal),
    discount: round2(subtotal - payable),
    shipping,
    total: round2(payable + shipping),
    paymentMethod: input.paymentMethod,
    paymentStatus: 'pending' as PaymentStatus,
    orderStatus: 'pending' as OrderStatus,
    stockApplied: 'none' as const,
    notes: input.notes.trim().slice(0, 500),
    demo: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(orderRef, data);
  return { ...orderFromDoc(orderRef.id, data), createdAt: new Date(), updatedAt: new Date() };
}

/** Cliente: apenas os próprios pedidos (a ordenação é feita no navegador para não exigir índice composto). */
export function subscribeUserOrders(uid: string, cb: (list: Order[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.orders), where('userId', '==', uid));
  return onSnapshot(
    q,
    (s) => cb(s.docs.map((d) => orderFromDoc(d.id, d.data())).sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now()))),
    onError,
  );
}

/** Painel: todos os pedidos, do mais novo para o mais antigo. */
export function subscribeAllOrders(cb: (list: Order[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.orders), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => orderFromDoc(d.id, d.data()))), onError);
}

/** Cliente cancela um pedido que ainda está pendente (as Security Rules só permitem isso). */
export async function cancelOwnOrder(order: Order): Promise<void> {
  await updateDoc(doc(getDb(), COL.orders, order.id), {
    orderStatus: 'cancelled',
    paymentStatus: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

export interface StatusChange {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * Admin altera o status. Em UMA transação:
 *  - lê o pedido e os produtos;
 *  - reserva / baixa / devolve o estoque conforme o novo status (ver utils/stock.ts);
 *  - grava o pedido.
 * Se não houver estoque suficiente, nada é alterado e a mensagem explica o motivo.
 */
export async function updateOrderStatus(orderId: string, change: StatusChange): Promise<void> {
  const db = getDb();
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, COL.orders, orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new OrderError('Pedido não encontrado.');
    const order = orderFromDoc(orderSnap.id, orderSnap.data());

    const nextStatus = change.orderStatus ?? order.orderStatus;
    let nextPayment = change.paymentStatus ?? order.paymentStatus;
    if (nextStatus === 'cancelled' && nextPayment === 'pending') nextPayment = 'cancelled';

    const from = order.stockApplied;
    const to = targetStockApplied(nextStatus);

    const updates: Array<{ id: string; values: { stock: number; reservedStock: number; availableStock: number } }> = [];
    if (from !== to) {
      // Todas as leituras primeiro (regra das transações do Firestore)...
      const snaps = await Promise.all(order.items.map((i) => tx.get(doc(db, COL.products, i.productId))));
      snaps.forEach((ps, idx) => {
        if (!ps.exists()) return; // produto excluído: não há estoque para ajustar
        const item = order.items[idx];
        const p = productFromDoc(ps.id, ps.data());
        updates.push({ id: p.id, values: applyStockDelta(p, stockDeltaFor(from, to, item.quantity)) });
      });
    }
    // ...depois todas as escritas.
    for (const u of updates) {
      tx.update(doc(db, COL.products, u.id), { ...u.values, updatedAt: serverTimestamp() });
    }
    tx.update(orderRef, {
      orderStatus: nextStatus,
      paymentStatus: nextPayment,
      stockApplied: to,
      updatedAt: serverTimestamp(),
    });
  });
}
