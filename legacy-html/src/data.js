/* ==========================================================================
   CONFIGURAÇÃO DA LOJA — tudo que é "dado do negócio" fica aqui.
   ========================================================================== */
const CONFIG = {
  /* true = mostra o aviso de demonstração e marca a mensagem de WhatsApp como teste.
     Quando os produtos reais forem cadastrados (demo: false), o aviso some sozinho. */
  demoMode: true,
  /* Só existe para o estado "carregando" ser visível na demo. Com backend real, remover. */
  simulatedLatencyMs: 220,
  store: {
    name: 'Lagoa Eletros',
    tagline: 'Novos, usados, recondicionados e peças com o melhor custo-benefício.',
    whatsapp: '5581997564933',
    whatsappDisplay: '(81) 99756-4933',
    hours: { days: 'Segunda a sexta', time: '08:00 às 17:00' },
    address: {
      street: 'Rodovia Coronel Francisco Heráclio',
      district: 'Centro',
      city: 'Lagoa do Carro',
      uf: 'PE',
      cep: '55820-000',
      country: 'Brasil'
    },
    geo: { lat: -7.847347, lng: -35.317853 }
  },
  maps: {
    apple: 'https://maps.apple/p/KuWM~fwbJ7VC_d',
    google: 'https://www.google.com/maps/search/?api=1&query=-7.847347%2C-35.317853',
    googleDirections: 'https://www.google.com/maps/dir/?api=1&destination=-7.847347%2C-35.317853',
    /* Estrutura pronta: quando houver uma URL de mapa incorporável (Google Maps "Incorporar"),
       basta colocá-la aqui que o LocationCard passa a exibir o mapa no lugar do painel. */
    embedUrl: null
  }
};

/* Categorias — editáveis futuramente pelo painel. `tone` só escolhe a cor do placeholder. */
const CATEGORIES = [
  { slug: 'celulares',    nome: 'Celulares',    icone: 'smartphone', tone: 'blue' },
  { slug: 'notebooks',    nome: 'Notebooks',    icone: 'laptop',     tone: 'blue' },
  { slug: 'computadores', nome: 'Computadores', icone: 'pc-case',    tone: 'blue' },
  { slug: 'monitores',    nome: 'Monitores',    icone: 'monitor',    tone: 'blue' },
  { slug: 'tablets',      nome: 'Tablets',      icone: 'tablet',     tone: 'blue' },
  { slug: 'games',        nome: 'Games',        icone: 'gamepad-2',  tone: 'green' },
  { slug: 'controles',    nome: 'Controles',    icone: 'joystick',   tone: 'green' },
  { slug: 'acessorios',   nome: 'Acessórios',   icone: 'headphones', tone: 'green' },
  { slug: 'pecas',        nome: 'Peças',        icone: 'settings',   tone: 'green' },
  { slug: 'eletronicos',  nome: 'Eletrônicos',  icone: 'zap',        tone: 'blue' }
];

const CONDITIONS = {
  novo:           { label: 'Novo',           icon: 'sparkles', text: 'Produto novo.' },
  usado:          { label: 'Usado',          icon: 'package',  text: 'Produto usado. A loja informa o estado do item (marcas de uso, acessórios inclusos) em cada anúncio.' },
  recondicionado: { label: 'Recondicionado', icon: 'refresh',  text: 'Produto recondicionado. O que foi feito no equipamento é informado pela loja em cada anúncio.' }
};

/* ==========================================================================
   PRODUTOS — 20 itens DEMO (demo: true). NÃO são o estoque real da loja.
   Modelo (o mesmo que o painel administrativo vai gravar):
   {
     id, nome, categoria (slug), marca, preco, precoAnterior|null,
     condicao: 'novo' | 'usado' | 'recondicionado',
     descricao, condicaoDescricao?, imagem|null, imagens[], estoque (número),
     destaque (bool), oferta (bool), demo (bool)
   }
   ========================================================================== */
const P = (id, nome, categoria, marca, preco, precoAnterior, condicao, estoque, flags, descricao) => ({
  id, nome, categoria, marca, preco, precoAnterior, condicao, descricao,
  imagem: null, imagens: [], estoque,
  destaque: flags.includes('d'), oferta: flags.includes('o'), demo: true
});

const SEED_PRODUCTS = [
  P('iphone-11-128gb',      'iPhone 11 128 GB',                             'celulares',    'Apple',     1899, null, 'recondicionado', 2, 'd', 'Smartphone com 128 GB de armazenamento.'),
  P('galaxy-a15-128gb',     'Galaxy A15 128 GB',                            'celulares',    'Samsung',    849,  949, 'novo',           4, 'do', 'Smartphone com 128 GB de armazenamento.'),
  P('moto-g24-128gb',       'Moto G24 128 GB',                              'celulares',    'Motorola',   549, null, 'usado',          1, 'd', 'Smartphone com 128 GB de armazenamento.'),
  P('dell-inspiron-15-i5',  'Notebook Dell Inspiron 15 Core i5 8 GB SSD 256 GB', 'notebooks', 'Dell',   2199, null, 'recondicionado', 1, 'd', 'Notebook com processador Core i5, 8 GB de memória e SSD de 256 GB.'),
  P('lenovo-ideapad-3-r5',  'Notebook Lenovo IdeaPad 3 Ryzen 5 8 GB SSD 512 GB', 'notebooks', 'Lenovo', 3099, 3499, 'novo',           2, 'o', 'Notebook com processador Ryzen 5, 8 GB de memória e SSD de 512 GB.'),
  P('acer-aspire-5-i3',     'Notebook Acer Aspire 5 Core i3 4 GB HD 500 GB', 'notebooks',   'Acer',      1299, null, 'usado',          1, '',  'Notebook com processador Core i3, 4 GB de memória e HD de 500 GB.'),
  P('desktop-i5-8gb-ssd',   'Computador Desktop Core i5 8 GB SSD 240 GB',   'computadores', 'Intel',     1799, null, 'recondicionado', 2, 'd', 'Computador completo com processador Core i5, 8 GB de memória e SSD de 240 GB.'),
  P('monitor-lg-24-fhd',    'Monitor LG 24" Full HD',                       'monitores',    'LG',         619,  699, 'novo',           5, 'do', 'Monitor de 24 polegadas com resolução Full HD.'),
  P('monitor-samsung-22',   'Monitor Samsung 22"',                          'monitores',    'Samsung',    319, null, 'usado',          1, '',  'Monitor de 22 polegadas.'),
  P('ipad-10-64gb',         'iPad 10ª geração 64 GB',                       'tablets',      'Apple',     2799, null, 'recondicionado', 1, 'd', 'Tablet com 64 GB de armazenamento.'),
  P('galaxy-tab-a9-64gb',   'Galaxy Tab A9 64 GB',                          'tablets',      'Samsung',    899,  999, 'novo',           3, 'o', 'Tablet com 64 GB de armazenamento.'),
  P('ps4-slim-500gb',       'PlayStation 4 Slim 500 GB',                    'games',        'Sony',      1399, null, 'usado',          1, 'd', 'Console com 500 GB de armazenamento.'),
  P('dualshock-4',          'Controle DualShock 4',                         'controles',    'Sony',       189, null, 'usado',          3, '',  'Controle sem fio para PlayStation 4.'),
  P('controle-xbox-sem-fio','Controle Xbox sem fio',                        'controles',    'Microsoft',  349, null, 'novo',           2, '',  'Controle sem fio para Xbox e PC.'),
  P('headset-gamer-usb',    'Headset Gamer USB com microfone',              'acessorios',   'Redragon',   149, null, 'novo',           6, 'd', 'Headset com microfone e conexão USB.'),
  P('carregador-turbo-20w', 'Carregador Turbo 20 W USB-C',                  'acessorios',   'Samsung',     59, null, 'novo',          10, '',  'Carregador de parede com saída USB-C de 20 W.'),
  P('ssd-480gb-sata',       'SSD 480 GB SATA',                              'pecas',        'Kingston',   199,  239, 'novo',           7, 'o', 'SSD de 480 GB com interface SATA.'),
  P('memoria-ddr4-8gb-nb',  'Memória RAM DDR4 8 GB para notebook',          'pecas',        'Crucial',    109, null, 'usado',          4, '',  'Módulo de memória DDR4 de 8 GB para notebook.'),
  P('placa-video-gtx-1650', 'Placa de vídeo GTX 1650 4 GB',                 'pecas',        'NVIDIA',     749, null, 'usado',          0, '',  'Placa de vídeo com 4 GB de memória.'),
  P('caixa-som-bluetooth',  'Caixa de som Bluetooth portátil',              'eletronicos',  'JBL',        249, null, 'novo',           5, 'd', 'Caixa de som portátil com conexão Bluetooth.')
];

/* ==========================================================================
   PRODUCT STORE — única porta de entrada para dados de produto.
   Hoje lê da lista acima (memória). Para ligar um backend, troque o corpo
   destes métodos por fetch('/api/produtos...'). O restante do site não muda.
   Os métodos create/update/remove já existem para o futuro painel administrativo.
   ========================================================================== */
const ProductStore = (() => {
  let db = SEED_PRODUCTS.map((p) => ({ ...p }));
  let firstLoad = true;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextId = (nome) => norm(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produto-' + Date.now();

  return {
    async list() {
      if (firstLoad && CONFIG.simulatedLatencyMs) { firstLoad = false; await wait(CONFIG.simulatedLatencyMs); }
      return db.map(indexProduct);
    },
    async get(id) {
      const p = db.find((x) => x.id === id);
      return p ? indexProduct(p) : null;
    },
    async create(data) {
      const p = { imagem: null, imagens: [], estoque: 0, destaque: false, oferta: false, precoAnterior: null, demo: false, ...data };
      p.id = p.id || nextId(p.nome);
      db.push(p);
      return indexProduct(p);
    },
    async update(id, patch) {
      const i = db.findIndex((x) => x.id === id);
      if (i < 0) return null;
      db[i] = { ...db[i], ...patch, id };
      return indexProduct(db[i]);
    },
    async remove(id) {
      db = db.filter((x) => x.id !== id);
      return true;
    }
  };
})();
