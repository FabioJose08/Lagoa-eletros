import type { ProductCondition } from '@/types';

/* =====================================================================
   DADOS DEMO — migrados do projeto HTML original (legacy-html/src/data.js).
   NÃO são o estoque real da Lagoa Eletros. Servem só para testar o site.
   São gravados no Firestore com demo: true (botão "Carregar dados DEMO" no painel)
   e podem ser apagados de uma vez com "Remover dados DEMO".
   ===================================================================== */

export const DEMO_CATEGORIES = [
  { id: 'celulares', name: 'Celulares', icon: 'smartphone' },
  { id: 'notebooks', name: 'Notebooks', icon: 'laptop' },
  { id: 'computadores', name: 'Computadores', icon: 'pc-case' },
  { id: 'monitores', name: 'Monitores', icon: 'monitor' },
  { id: 'tablets', name: 'Tablets', icon: 'tablet' },
  { id: 'games', name: 'Games', icon: 'gamepad' },
  { id: 'controles', name: 'Controles', icon: 'joystick' },
  { id: 'acessorios', name: 'Acessórios', icon: 'headphones' },
  { id: 'pecas', name: 'Peças', icon: 'settings' },
  { id: 'eletronicos', name: 'Eletrônicos', icon: 'zap' },
] as const;

export const DEMO_BRANDS = [
  'Apple', 'Samsung', 'Motorola', 'Dell', 'Lenovo', 'Acer', 'Intel', 'LG', 'Sony', 'Microsoft', 'Redragon', 'Kingston',
  'Crucial', 'NVIDIA', 'JBL',
].map((name) => ({ id: name.toLowerCase(), name }));

export interface DemoProduct {
  id: string;
  name: string;
  categoryId: string;
  brandId: string;
  /** Preço normal (de tabela). */
  price: number;
  /** Se existir, o produto está em promoção por este valor (demo de "Ofertas"). */
  promoPrice: number | null;
  condition: ProductCondition;
  stock: number;
  featured: boolean;
  shortDescription: string;
}

const d = (
  id: string, name: string, categoryId: string, brandId: string, price: number, promoPrice: number | null,
  condition: ProductCondition, stock: number, featured: boolean, shortDescription: string,
): DemoProduct => ({ id, name, categoryId, brandId, price, promoPrice, condition, stock, featured, shortDescription });

export const DEMO_PRODUCTS: DemoProduct[] = [
  d('iphone-11-128gb', 'iPhone 11 128 GB', 'celulares', 'apple', 1899, null, 'refurbished', 2, true, 'Smartphone com 128 GB de armazenamento.'),
  d('galaxy-a15-128gb', 'Galaxy A15 128 GB', 'celulares', 'samsung', 949, 849, 'new', 4, true, 'Smartphone com 128 GB de armazenamento.'),
  d('moto-g24-128gb', 'Moto G24 128 GB', 'celulares', 'motorola', 549, null, 'used', 1, true, 'Smartphone com 128 GB de armazenamento.'),
  d('dell-inspiron-15-i5', 'Notebook Dell Inspiron 15 Core i5 8 GB SSD 256 GB', 'notebooks', 'dell', 2199, null, 'refurbished', 1, true, 'Notebook com processador Core i5, 8 GB de memória e SSD de 256 GB.'),
  d('lenovo-ideapad-3-r5', 'Notebook Lenovo IdeaPad 3 Ryzen 5 8 GB SSD 512 GB', 'notebooks', 'lenovo', 3499, 3099, 'new', 2, false, 'Notebook com processador Ryzen 5, 8 GB de memória e SSD de 512 GB.'),
  d('acer-aspire-5-i3', 'Notebook Acer Aspire 5 Core i3 4 GB HD 500 GB', 'notebooks', 'acer', 1299, null, 'used', 1, false, 'Notebook com processador Core i3, 4 GB de memória e HD de 500 GB.'),
  d('desktop-i5-8gb-ssd', 'Computador Desktop Core i5 8 GB SSD 240 GB', 'computadores', 'intel', 1799, null, 'refurbished', 2, true, 'Computador completo com processador Core i5, 8 GB de memória e SSD de 240 GB.'),
  d('monitor-lg-24-fhd', 'Monitor LG 24" Full HD', 'monitores', 'lg', 699, 619, 'new', 5, false, 'Monitor de 24 polegadas com resolução Full HD.'),
  d('monitor-samsung-22', 'Monitor Samsung 22"', 'monitores', 'samsung', 319, null, 'used', 1, false, 'Monitor de 22 polegadas.'),
  d('ipad-10-64gb', 'iPad 10ª geração 64 GB', 'tablets', 'apple', 2799, null, 'refurbished', 1, true, 'Tablet com 64 GB de armazenamento.'),
  d('galaxy-tab-a9-64gb', 'Galaxy Tab A9 64 GB', 'tablets', 'samsung', 999, 899, 'new', 3, false, 'Tablet com 64 GB de armazenamento.'),
  d('ps4-slim-500gb', 'PlayStation 4 Slim 500 GB', 'games', 'sony', 1399, null, 'used', 1, true, 'Console com 500 GB de armazenamento.'),
  d('dualshock-4', 'Controle DualShock 4', 'controles', 'sony', 189, null, 'used', 3, false, 'Controle sem fio para PlayStation 4.'),
  d('controle-xbox-sem-fio', 'Controle Xbox sem fio', 'controles', 'microsoft', 349, null, 'new', 2, false, 'Controle sem fio para Xbox e PC.'),
  d('headset-gamer-usb', 'Headset Gamer USB com microfone', 'acessorios', 'redragon', 149, null, 'new', 6, true, 'Headset com microfone e conexão USB.'),
  d('carregador-turbo-20w', 'Carregador Turbo 20 W USB-C', 'acessorios', 'samsung', 59, null, 'new', 10, false, 'Carregador de parede com saída USB-C de 20 W.'),
  d('ssd-480gb-sata', 'SSD 480 GB SATA', 'pecas', 'kingston', 239, 199, 'new', 7, false, 'SSD de 480 GB com interface SATA.'),
  d('memoria-ddr4-8gb-nb', 'Memória RAM DDR4 8 GB para notebook', 'pecas', 'crucial', 109, null, 'used', 4, false, 'Módulo de memória DDR4 de 8 GB para notebook.'),
  d('placa-video-gtx-1650', 'Placa de vídeo GTX 1650 4 GB', 'pecas', 'nvidia', 749, null, 'used', 0, false, 'Placa de vídeo com 4 GB de memória.'),
  d('caixa-som-bluetooth', 'Caixa de som Bluetooth portátil', 'eletronicos', 'jbl', 249, null, 'new', 5, true, 'Caixa de som portátil com conexão Bluetooth.'),
];

export const DEMO_ORDERS: Array<{ key: string; productIds: string[]; status: 'pending' | 'cancelled' }> = [
  { key: 'demo-pedido-1', productIds: ['galaxy-a15-128gb', 'carregador-turbo-20w'], status: 'pending' },
  { key: 'demo-pedido-2', productIds: ['monitor-lg-24-fhd'], status: 'pending' },
  { key: 'demo-pedido-3', productIds: ['dualshock-4'], status: 'cancelled' },
];
