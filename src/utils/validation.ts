import type { FormErrors, ProductFormValues } from '@/types';
import { fromInputDateTime, onlyDigits, parseMoney } from './format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (s: string): boolean => EMAIL_RE.test(s.trim());

const isInt = (s: string): boolean => /^\d+$/.test(s.trim());

export function validateProductForm(v: ProductFormValues): FormErrors<ProductFormValues> {
  const e: FormErrors<ProductFormValues> = {};
  const name = v.name.trim();
  if (name.length < 3) e.name = 'Informe o nome do produto (mínimo 3 letras).';
  else if (name.length > 120) e.name = 'O nome pode ter no máximo 120 caracteres.';

  const sku = v.sku.trim();
  if (sku.length < 2) e.sku = 'Informe o SKU (código interno do produto).';
  else if (sku.length > 40) e.sku = 'O SKU pode ter no máximo 40 caracteres.';

  if (v.shortDescription.length > 160) e.shortDescription = 'A descrição curta pode ter no máximo 160 caracteres.';
  if (v.description.length > 4000) e.description = 'A descrição completa pode ter no máximo 4000 caracteres.';
  if (!v.categoryId) e.categoryId = 'Escolha uma categoria.';

  const price = parseMoney(v.price);
  if (price === null || price <= 0) e.price = 'Informe um preço maior que zero.';

  if (v.oldPrice.trim()) {
    const old = parseMoney(v.oldPrice);
    if (old === null || old <= 0) e.oldPrice = 'Preço anterior inválido.';
    else if (price !== null && old <= price) e.oldPrice = 'O preço anterior deve ser maior que o preço atual.';
  }
  if (v.costPrice.trim()) {
    const cost = parseMoney(v.costPrice);
    if (cost === null || cost < 0) e.costPrice = 'Preço de custo inválido.';
  }

  if (!isInt(v.stock)) e.stock = 'Informe o estoque com um número inteiro (0 ou mais).';
  const reserved = v.reservedStock.trim() === '' ? '0' : v.reservedStock;
  if (!isInt(reserved)) e.reservedStock = 'Estoque reservado deve ser um número inteiro.';
  else if (isInt(v.stock) && Number(reserved) > Number(v.stock)) e.stock = `O estoque não pode ser menor que o reservado por pedidos (${Number(reserved)}).`;

  if (v.onSale) {
    const promo = parseMoney(v.promoPrice);
    if (promo === null || promo <= 0) e.promoPrice = 'Informe o preço promocional.';
    else if (price !== null && promo >= price) e.promoPrice = 'O preço promocional deve ser menor que o preço normal.';
    const s = fromInputDateTime(v.promoStartsAt);
    const en = fromInputDateTime(v.promoEndsAt);
    if (s && en && en <= s) e.promoEndsAt = 'O fim da promoção deve ser depois do início.';
  }
  return e;
}

export interface NameForm {
  name: string;
}
export function validateCategoryName(name: string): string | null {
  const n = name.trim();
  if (n.length < 2) return 'Informe o nome (mínimo 2 letras).';
  if (n.length > 60) return 'O nome pode ter no máximo 60 caracteres.';
  return null;
}

export interface PromotionFormValues {
  productId: string;
  promoPrice: string;
  startsAt: string;
  endsAt: string;
}
export function validatePromotionForm(v: PromotionFormValues, regularPrice: number | null): FormErrors<PromotionFormValues> {
  const e: FormErrors<PromotionFormValues> = {};
  if (!v.productId) e.productId = 'Escolha o produto.';
  const promo = parseMoney(v.promoPrice);
  if (promo === null || promo <= 0) e.promoPrice = 'Informe o preço promocional.';
  else if (regularPrice !== null && promo >= regularPrice) e.promoPrice = 'O preço promocional deve ser menor que o preço normal.';
  const s = fromInputDateTime(v.startsAt);
  const en = fromInputDateTime(v.endsAt);
  if (s && en && en <= s) e.endsAt = 'O fim deve ser depois do início.';
  return e;
}

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
}
export function validateRegister(v: AuthFormValues): FormErrors<AuthFormValues> {
  const e: FormErrors<AuthFormValues> = {};
  if (v.name.trim().length < 2) e.name = 'Informe seu nome.';
  if (!isEmail(v.email)) e.email = 'Informe um e-mail válido.';
  if (v.password.length < 6) e.password = 'A senha precisa ter pelo menos 6 caracteres.';
  if (v.confirm !== v.password) e.confirm = 'As senhas não conferem.';
  if (v.phone.trim()) {
    const d = onlyDigits(v.phone);
    if (d.length < 10 || d.length > 13) e.phone = 'Telefone inválido. Use DDD + número.';
  }
  return e;
}
export function validateLogin(v: Pick<AuthFormValues, 'email' | 'password'>): FormErrors<AuthFormValues> {
  const e: FormErrors<AuthFormValues> = {};
  if (!isEmail(v.email)) e.email = 'Informe um e-mail válido.';
  if (!v.password) e.password = 'Informe a senha.';
  return e;
}
