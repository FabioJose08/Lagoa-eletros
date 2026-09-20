const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatBRL = (value: number): string => brl.format(value);

export function formatDate(d: Date | null): string {
  return d ? d.toLocaleDateString('pt-BR') : '—';
}

export function formatDateTime(d: Date | null): string {
  return d ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Date -> valor de <input type="datetime-local"> (horário local). */
export function toInputDateTime(d: Date | null): string {
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> -> Date (ou null se vazio/ inválido). */
export function fromInputDateTime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Número em string PT-BR ("1.299,90" ou "1299.90") -> number. Retorna null se inválido/vazio. */
export function parseMoney(input: string): number | null {
  let s = input.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** number -> texto para campo de formulário ("" quando null). */
export function moneyToInput(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n).replace('.', ',');
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export function formatPhone(raw: string): string {
  const d = onlyDigits(raw);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

/** Código curto e legível de um pedido (a partir do id do documento). */
export function formatOrderCode(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}
