/* Dados reais da loja (fornecidos pelo proprietário). Nada aqui é inventado. */

export const STORE = {
  name: 'Lagoa Eletros',
  tagline: 'Novos, usados, recondicionados e peças com o melhor custo-benefício.',
  whatsappNumber: '5581997564933',
  whatsappDisplay: '(81) 99756-4933',
  hours: { days: 'Segunda a sexta', time: '08:00 às 17:00' },
  address: {
    street: 'Rodovia Coronel Francisco Heráclio',
    district: 'Centro',
    city: 'Lagoa do Carro',
    uf: 'PE',
    cep: '55820-000',
    country: 'Brasil',
  },
  geo: { lat: -7.847347, lng: -35.317853 },
} as const;

export const MAPS = {
  apple: 'https://maps.apple/p/KuWM~fwbJ7VC_d',
  google: 'https://www.google.com/maps/search/?api=1&query=-7.847347%2C-35.317853',
  /** Quando existir uma URL de mapa incorporável (Google Maps > Compartilhar > Incorporar), coloque aqui. */
  embedUrl: null as string | null,
} as const;

/** Abaixo (ou igual) a este valor o produto aparece como "Estoque baixo". */
export const LOW_STOCK_THRESHOLD = 3;

/** Limite de itens de um pedido (também validado nas Security Rules). */
export const MAX_ORDER_ITEMS = 50;

export const SITE_TITLE = 'Lagoa Eletros | Eletrônicos, Informática e Acessórios em Lagoa do Carro';
export const SITE_DESCRIPTION =
  'Lagoa Eletros em Lagoa do Carro - PE. Produtos novos, usados, recondicionados, peças, informática, eletrônicos e acessórios.';

export const GARANTIA_NOTA = 'Consulte as condições de garantia de cada produto antes da compra.';
