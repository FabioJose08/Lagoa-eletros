/* ==========================================================================
   ASSETS OFICIAIS (logo fornecido pela loja, sem redesenho — apenas recortes/otimização)
   ========================================================================== */
const ASSETS = {
  markSm: '__ASSET_MARK_SM__',   /* emblema + nome, 300px — cabeçalho e menu */
  mark: '__ASSET_MARK__',        /* emblema + nome, 900px — hero */
  full: '__ASSET_FULL__'         /* logo completo com slogan e ícones — sobre e rodapé */
};

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function norm(s) { return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (n) => brl.format(n);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug) || { slug, nome: slug, icone: 'zap', tone: 'blue' };
function indexProduct(p) {
  const cat = catBySlug(p.categoria);
  return { ...p, _idx: norm([p.nome, cat.nome, p.marca, (CONDITIONS[p.condicao] || {}).label].join(' ')) };
}
function searchProducts(list, q) {
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return list;
  return list.filter((p) => tokens.every((t) => p._idx.includes(t)));
}
const discount = (p) => (p.precoAnterior && p.precoAnterior > p.preco ? Math.round((1 - p.preco / p.precoAnterior) * 100) : 0);
const hasStock = (p) => Number(p.estoque) > 0;
const condText = (p) => p.condicaoDescricao || (CONDITIONS[p.condicao] || {}).text || '';

/* WhatsApp — canal principal de venda */
const waLink = (msg) => `https://wa.me/${CONFIG.store.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
const demoSuffix = (p) => (p && p.demo ? ' (Mensagem de teste do site: produto demonstrativo.)' : '');
const MSG = {
  generic: 'Olá! Vim pelo site da Lagoa Eletros e gostaria de mais informações.',
  interest: (p) => `Olá! Tenho interesse no produto ${p.nome} da Lagoa Eletros. Gostaria de saber mais informações e disponibilidade.${demoSuffix(p)}`,
  availability: (p) => `Olá! Gostaria de consultar a disponibilidade do produto ${p.nome} da Lagoa Eletros.${demoSuffix(p)}`
};

/* ==========================================================================
   ESTADO GLOBAL
   ========================================================================== */
const state = { products: null, favs: new Set() };
const FAV_KEY = 'lagoa:favoritos:v1';
function loadFavs() { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch (e) { return new Set(); } }
function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify([...state.favs])); } catch (e) { /* storage indisponível: segue só em memória */ } }
async function getProducts(force) {
  if (!state.products || force) state.products = await ProductStore.list();
  return state.products;
}
let catalog = null;       // instância do catálogo montado (ou null)
let routeToken = 0;

/* ==========================================================================
   COMPONENTES
   ========================================================================== */
function Badge(kind, label, iconName) {
  return `<span class="badge badge--${kind}">${iconName ? icon(iconName) : ''}${esc(label)}</span>`;
}
function ProductBadges(p) {
  const c = CONDITIONS[p.condicao];
  let html = c ? Badge(p.condicao, c.label, c.icon) : '';
  if (p.oferta) html += Badge('oferta', 'Oferta', 'tag');
  if (!hasStock(p)) html += Badge('estoque', 'Sem estoque');
  return `<div class="badges">${html}</div>`;
}
function PriceDisplay(p, { lg = false } = {}) {
  const off = discount(p);
  const old = off ? `<span class="price__old"><span class="sr-only">De </span>${fmt(p.precoAnterior)}</span>` : '';
  const pill = off ? `<span class="price__off"><span aria-hidden="true">-${off}%</span><span class="sr-only">${off}% de desconto</span></span>` : '';
  return `<div class="price${lg ? ' price--lg' : ''}">${old}<span class="price__now"><span class="sr-only">${off ? 'Por ' : 'Preço: '}</span>${fmt(p.preco)}</span>${pill}</div>`;
}
function ProductImage(p, { large = false } = {}) {
  const cat = catBySlug(p.categoria);
  const cls = `pimg${large ? ' pimg--lg' : ''}${cat.tone === 'green' ? ' pimg--green' : ''}`;
  const src = p.imagem || (p.imagens && p.imagens[0]);
  if (src) return `<div class="${cls}" data-gallery-main><img class="pimg__photo" src="${esc(src)}" alt="${esc(p.nome)}" loading="lazy" decoding="async"></div>`;
  return `<div class="${cls}" role="img" aria-label="Imagem ilustrativa de ${esc(p.nome)}"><span class="pimg__art">${icon(cat.icone, { size: 96 })}</span>${p.demo ? '<span class="pimg__tag">Produto demo</span>' : ''}</div>`;
}
function FavButton(p, { inline = false } = {}) {
  const on = state.favs.has(p.id);
  return `<button type="button" class="fav-btn${inline ? ' fav-btn--inline' : ''}" data-action="fav" data-id="${esc(p.id)}" aria-pressed="${on}" aria-label="Favoritar ${esc(p.nome)}">${icon('heart', { size: 22 })}</button>`;
}
function WhatsAppButton({ href, label, cls = '', size = '', aria = '' }) {
  return `<a class="btn btn--whatsapp ${size} ${cls}" href="${esc(href)}" target="_blank" rel="noopener"${aria ? ` aria-label="${esc(aria)}"` : ''}>${icon('whatsapp', { size: 20 })}<span>${esc(label)}</span></a>`;
}
function ProductCard(p) {
  const cat = catBySlug(p.categoria);
  return `<article class="pcard">
    <div class="pcard__media">${ProductImage(p)}${FavButton(p).replace('class="fav-btn"', 'class="fav-btn pcard__fav"')}</div>
    <div class="pcard__body">
      ${ProductBadges(p)}
      <p class="pcard__cat">${esc(cat.nome)}</p>
      <h3 class="pcard__name"><a class="pcard__link" href="#/produtos/${encodeURIComponent(p.id)}">${esc(p.nome)}</a></h3>
      ${PriceDisplay(p)}
    </div>
    <div class="pcard__actions">
      ${WhatsAppButton({ href: waLink(hasStock(p) ? MSG.interest(p) : MSG.availability(p)), label: hasStock(p) ? 'Tenho interesse' : 'Consultar disponibilidade', aria: `${hasStock(p) ? 'Tenho interesse em' : 'Consultar disponibilidade de'} ${p.nome}, abre o WhatsApp` })}
      <a class="btn btn--outline" href="#/produtos/${encodeURIComponent(p.id)}" aria-label="Ver detalhes de ${esc(p.nome)}">Detalhes</a>
    </div>
  </article>`;
}
const ProductGrid = (list, cls = '') => `<div class="product-grid ${cls}">${list.map(ProductCard).join('')}</div>`;

function SectionTitle({ id, title, lead = '', moreHref = '', moreLabel = 'Ver todos', mark = '' }) {
  return `<div class="section-head"><div class="section-head__text">
    <div class="section-title__row">${mark ? `<span class="title-mark">${icon(mark, { size: 20 })}</span>` : ''}<h2 class="section-title" id="${id}">${esc(title)}</h2></div>
    ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ''}</div>
    ${moreHref ? `<a class="link-more" href="${moreHref}">${esc(moreLabel)}${icon('chevron-right', { size: 18 })}</a>` : ''}</div>`;
}
function CategoryCard(c) {
  return `<a class="cat-card" href="#/categoria/${c.slug}"><span class="cat-card__icon">${icon(c.icone, { size: 26 })}</span><span class="cat-card__label">${esc(c.nome)}</span></a>`;
}
function ConditionCard(cond, label, iconName) {
  return `<a class="cat-card cat-card--cond" href="#/produtos?cond=${cond}"><span class="cat-card__icon">${icon(iconName, { size: 26 })}</span><span class="cat-card__label">${esc(label)}</span></a>`;
}
function CategoryGrid() {
  return `<div class="cat-grid">${CATEGORIES.map(CategoryCard).join('')}${ConditionCard('usado', 'Produtos usados', 'package')}${ConditionCard('recondicionado', 'Produtos recondicionados', 'refresh')}</div>`;
}
function Crumbs(items) {
  const lis = items.map((it, i) => (i === items.length - 1
    ? `<li><span aria-current="page">${esc(it.label)}</span></li>`
    : `<li><a href="${it.href}">${esc(it.label)}</a>${icon('chevron-right', { size: 14 })}</li>`)).join('');
  return `<nav aria-label="Você está em"><ol class="crumbs">${lis}</ol></nav>`;
}
function EmptyState({ iconName = 'search', title, text = '', actions = '', error = false }) {
  return `<div class="state${error ? ' state--error' : ''}"><span class="state__icon">${icon(iconName, { size: 28 })}</span><h2 class="state__title">${esc(title)}</h2>${text ? `<p class="state__text">${esc(text)}</p>` : ''}${actions ? `<div class="state__actions">${actions}</div>` : ''}</div>`;
}
function LoadingState(n = 8) {
  const one = '<div class="skeleton" aria-hidden="true"><div class="skeleton__img"></div><div class="skeleton__line"></div><div class="skeleton__line skeleton__line--short"></div><div class="skeleton__line skeleton__line--btn"></div></div>';
  return `<div role="status" aria-live="polite"><span class="sr-only">Carregando produtos…</span><div class="product-grid" aria-hidden="true">${one.repeat(n)}</div></div>`;
}
function LocationCard({ withTitle = true } = {}) {
  const a = CONFIG.store.address;
  const h = CONFIG.store.hours;
  const map = CONFIG.maps.embedUrl
    ? `<iframe class="loc__map" title="Mapa da Lagoa Eletros" src="${esc(CONFIG.maps.embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    : `<a class="loc__map" href="${CONFIG.maps.apple}" target="_blank" rel="noopener" aria-label="Abrir a localização da Lagoa Eletros no mapa">
        <svg class="contours" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M40 150c10-60 80-100 160-96s150 50 160 110-60 102-150 104S30 210 40 150z"/><path d="M75 152c8-42 60-72 124-68s118 38 126 80-46 74-118 76S67 194 75 152z"/><path d="M110 152c6-26 42-46 90-44s88 26 94 54-34 50-88 52-102-30-96-62z"/><path d="M145 154c4-12 26-22 56-20s58 12 60 28-26 26-58 26-62-14-58-34z"/><path d="M-20 60c60 20 90 10 140-20s110-40 180-20"/><path d="M200 320c10-40 60-60 110-70s70-40 120-60"/></svg>
        <span class="loc__pin"><span class="loc__pin-dot">${icon('map-pin', { size: 28 })}</span><span class="loc__pin-city">${esc(a.city)} - ${esc(a.uf)}</span><span class="loc__pin-cta">Abrir no mapa${icon('external-link', { size: 16 })}</span></span></a>`;
  return `<div class="loc"><div class="loc__info">
      ${withTitle ? '<h2 class="loc__title" id="loc-title">Visite nossa loja</h2>' : ''}
      <div class="loc__row"><span class="icon-wrap">${icon('map-pin', { size: 20 })}</span>
        <address class="loc__addr"><strong>${esc(CONFIG.store.name)}</strong>${esc(a.street)}<br>${esc(a.district)}<br>${esc(a.city)} - ${esc(a.uf)}<br>${esc(a.cep)}</address></div>
      <div class="loc__row"><span class="icon-wrap">${icon('clock', { size: 20 })}</span>
        <div class="loc__hours"><strong>Horário</strong>${esc(h.days)}<br>${esc(h.time)}</div></div>
      <div class="loc__actions">
        <a class="btn btn--primary" href="${CONFIG.maps.apple}" target="_blank" rel="noopener">${icon('navigation', { size: 18 })}Como chegar</a>
        <a class="btn btn--outline" href="${CONFIG.maps.apple}" target="_blank" rel="noopener">${icon('map-pin', { size: 18 })}Ver no mapa</a>
      </div>
      <p class="loc__alt">Prefere o Google Maps? <a href="${CONFIG.maps.google}" target="_blank" rel="noopener">Abrir no Google Maps</a></p>
    </div>${map}</div>`;
}
function CtaBand() {
  return `<div class="cta-band"><div><h2 class="cta-band__title">Não encontrou o que procura?</h2><p class="cta-band__text">Chame a gente no WhatsApp e pergunte. Também dá para consultar a disponibilidade de qualquer produto do site.</p></div>${WhatsAppButton({ href: waLink(MSG.generic), label: 'Falar no WhatsApp', size: 'btn--lg' })}</div>`;
}

/* ---------- Busca (SearchBar) ---------- */
function SearchBar({ id, variant = 'page', value = '', live = false, placeholder = 'Buscar produtos' }) {
  const combo = live ? '' : ` role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list"`;
  return `<form class="sb sb--${variant}" role="search" data-live="${live}" action="#" novalidate>
    <label class="sr-only" for="${id}-input">Buscar produtos</label>
    <div class="sb__field">${icon('search', { size: 20, cls: 'sb__icon' })}
      <input id="${id}-input" class="sb__input" type="search" name="q" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"${combo}>
      <button type="submit" class="btn btn--primary sb__submit">Buscar</button></div>
    ${live ? '' : `<ul id="${id}-list" class="sb__list" role="listbox" aria-label="Sugestões" hidden></ul>`}</form>`;
}
function sbHide(form) {
  const list = $('.sb__list', form); const input = $('.sb__input', form);
  if (!list) return;
  list.hidden = true; list.innerHTML = '';
  input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
}
function sbSuggest(form) {
  const input = $('.sb__input', form); const list = $('.sb__list', form);
  const q = input.value.trim();
  if (!list) return;
  if (q.length < 2 || !state.products) { sbHide(form); return; }
  const cats = CATEGORIES.filter((c) => norm(c.nome).includes(norm(q))).slice(0, 2);
  const prods = searchProducts(state.products, q).slice(0, 5);
  const id = form.querySelector('.sb__input').id.replace('-input', '');
  let i = 0;
  const opt = (href, iconName, title, sub, price = '') =>
    `<li class="sb__opt" role="option" id="${id}-opt-${i++}" data-href="${esc(href)}" aria-selected="false"><span class="sb__opt-icon">${icon(iconName, { size: 18 })}</span><span class="sb__opt-text"><span class="sb__opt-title">${esc(title)}</span><span class="sb__opt-sub">${esc(sub)}</span></span>${price ? `<span class="sb__opt-price">${price}</span>` : ''}</li>`;
  let html = cats.map((c) => opt(`#/categoria/${c.slug}`, c.icone, c.nome, 'Categoria')).join('');
  html += prods.map((p) => opt(`#/produtos/${encodeURIComponent(p.id)}`, catBySlug(p.categoria).icone, p.nome, `${catBySlug(p.categoria).nome}, ${CONDITIONS[p.condicao].label.toLowerCase()}`, fmt(p.preco))).join('');
  if (!cats.length && !prods.length) {
    html = `<li class="sb__opt" role="option" aria-disabled="true" id="${id}-opt-none"><span class="sb__opt-text"><span class="sb__opt-title">Nenhum produto encontrado.</span><span class="sb__opt-sub">Experimente buscar por outro nome ou categoria.</span></span></li>`;
  } else {
    html += opt(`#/produtos?q=${encodeURIComponent(q)}`, 'search', `Ver todos os resultados para “${q}”`, '').replace('class="sb__opt"', 'class="sb__opt sb__opt--all"');
  }
  list.innerHTML = html; list.hidden = false;
  input.setAttribute('aria-expanded', 'true'); input.removeAttribute('aria-activedescendant');
}
function sbMove(form, dir) {
  const list = $('.sb__list', form); const input = $('.sb__input', form);
  const opts = $$('.sb__opt:not([aria-disabled])', list);
  if (list.hidden || !opts.length) return;
  let i = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true');
  opts.forEach((o) => o.setAttribute('aria-selected', 'false'));
  i = (i + dir + opts.length) % opts.length;
  if (i < 0) i = opts.length - 1;
  opts[i].setAttribute('aria-selected', 'true');
  input.setAttribute('aria-activedescendant', opts[i].id);
  opts[i].scrollIntoView({ block: 'nearest' });
}

/* ---------- Header, menu, footer ---------- */
const NAV = [
  { label: 'Início', href: '#/', key: 'home', icon: 'home' },
  { label: 'Produtos', href: '#/produtos', key: 'produtos', icon: 'layout-grid' },
  { label: 'Categorias', href: '#/categorias', key: 'categorias', icon: 'tag' },
  { label: 'Ofertas', href: '#/ofertas', key: 'ofertas', icon: 'sparkles' },
  { label: 'Sobre', href: '#/sobre', key: 'sobre', icon: 'info' },
  { label: 'Localização', href: '#/localizacao', key: 'localizacao', icon: 'map-pin' }
];
function Header() {
  return `<div class="container header__inner">
      <a class="header__logo" href="#/"><img src="${ASSETS.markSm}" width="94" height="52" alt="Lagoa Eletros"></a>
      <nav class="header__nav" aria-label="Principal">${NAV.map((n) => `<a class="nav-link" data-key="${n.key}" href="${n.href}">${n.label}</a>`).join('')}</nav>
      <div class="header__actions">
        <button type="button" class="icon-btn" data-action="toggle-search" aria-expanded="false" aria-controls="search-panel" aria-label="Buscar produtos">${icon('search', { size: 22 })}</button>
        <a class="icon-btn" href="#/favoritos" data-key="favoritos" aria-label="Favoritos">${icon('heart', { size: 22 })}<span class="count" data-fav-count hidden></span></a>
        ${WhatsAppButton({ href: waLink(MSG.generic), label: 'WhatsApp', cls: 'header__wa' })}
        <button type="button" class="icon-btn header__menu-btn" data-action="open-menu" aria-haspopup="dialog" aria-label="Abrir menu">${icon('menu', { size: 24 })}</button>
      </div>
    </div>
    <div id="search-panel" class="search-panel" hidden><div class="container">${SearchBar({ id: 'hs', variant: 'panel' })}</div></div>`;
}
function MenuDrawer() {
  return `<div class="drawer__head"><img src="${ASSETS.markSm}" width="94" height="52" alt="Lagoa Eletros"><button type="button" class="icon-btn" data-action="close-drawer" aria-label="Fechar menu">${icon('x', { size: 24 })}</button></div>
    <div class="drawer__body"><nav aria-label="Menu"><ul class="menu-list">
      ${NAV.map((n) => `<li><a class="menu-link" data-key="${n.key}" href="${n.href}">${icon(n.icon, { size: 22 })}${n.label}</a></li>`).join('')}
      <li><a class="menu-link" href="#/produtos?cond=usado,recondicionado">${icon('refresh', { size: 22 })}Usados e recondicionados</a></li>
      <li><a class="menu-link" data-key="favoritos" href="#/favoritos">${icon('heart', { size: 22 })}Favoritos</a></li>
    </ul></nav>
    <div class="menu-foot">${WhatsAppButton({ href: waLink(MSG.generic), label: 'Falar no WhatsApp', size: 'btn--lg btn--block' })}
      <p class="menu-note">${icon('clock', { size: 18 })}<span>${esc(CONFIG.store.hours.days)}: ${esc(CONFIG.store.hours.time)}</span></p>
      <p class="menu-note">${icon('map-pin', { size: 18 })}<span>${esc(CONFIG.store.address.city)} - ${esc(CONFIG.store.address.uf)}</span></p></div></div>`;
}
function Footer() {
  const a = CONFIG.store.address;
  return `<div class="container footer__grid">
      <div><img class="footer__logo" src="${ASSETS.full}" width="190" height="151" alt="Lagoa Eletros" loading="lazy"><p class="footer__tag">${esc(CONFIG.store.tagline)}</p></div>
      <nav aria-label="Rodapé"><h2 class="footer__h">Navegação</h2><ul class="footer__list">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul></nav>
      <div><h2 class="footer__h">Atendimento</h2><div class="footer__text">
        <a class="footer__wa" href="${waLink(MSG.generic)}" target="_blank" rel="noopener">${icon('whatsapp', { size: 20 })}${esc(CONFIG.store.whatsappDisplay)}</a>
        <p>${esc(CONFIG.store.hours.days)}<br>${esc(CONFIG.store.hours.time)}</p></div></div>
      <div><h2 class="footer__h">Localização</h2><div class="footer__text">
        <address>${esc(a.street)}<br>${esc(a.district)}<br>${esc(a.city)} - ${esc(a.uf)}<br>${esc(a.cep)}</address>
        <a href="${CONFIG.maps.apple}" target="_blank" rel="noopener">Ver no mapa</a></div></div>
    </div>
    <div class="footer__rule"><div class="container footer__bottom"><span>© ${new Date().getFullYear()} ${esc(CONFIG.store.name)}. Todos os direitos reservados.</span>${CONFIG.demoMode ? '<span>Versão de demonstração: produtos e preços são exemplos.</span>' : ''}</div></div>`;
}

/* ---------- Filtros (usado no painel lateral e na gaveta mobile) ---------- */
function FiltersForm(prefix, products, { lockCat = '' } = {}) {
  const brands = [...new Set(products.map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const check = (group, value, label) => `<label class="check"><input type="checkbox" data-group="${group}" value="${esc(value)}"><span>${esc(label)}</span></label>`;
  return `<form class="filters" data-filters onsubmit="return false">
    ${lockCat ? '' : `<fieldset class="fgroup"><legend>Categoria</legend>${CATEGORIES.map((c) => check('cat', c.slug, c.nome)).join('')}</fieldset>`}
    <fieldset class="fgroup"><legend>Condição</legend>${Object.entries(CONDITIONS).map(([k, c]) => check('cond', k, c.label)).join('')}</fieldset>
    <fieldset class="fgroup"><legend>Faixa de preço</legend><div class="range">
      <label class="field" for="${prefix}-min">Mínimo (R$)<input id="${prefix}-min" type="number" inputmode="numeric" min="0" step="10" placeholder="0" data-group="min"></label>
      <label class="field" for="${prefix}-max">Máximo (R$)<input id="${prefix}-max" type="number" inputmode="numeric" min="0" step="10" placeholder="Sem limite" data-group="max"></label></div></fieldset>
    ${brands.length ? `<fieldset class="fgroup"><legend>Marca</legend>${brands.map((b) => check('marca', b, b)).join('')}</fieldset>` : ''}
  </form>`;
}

/* ==========================================================================
   DRAWER (dialog nativo) + TOAST
   ========================================================================== */
function openDrawer(dlg) {
  if (!dlg || dlg.open) return;
  dlg.showModal();
  requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('is-open')));
}
function closeDrawer(dlg) {
  if (!dlg || !dlg.open) return;
  dlg.classList.remove('is-open');
  if (reducedMotion()) dlg.close(); else setTimeout(() => dlg.close(), 300);
}
const closeAllDrawers = () => $$('dialog.drawer[open]').forEach(closeDrawer);
let toastTimer;
function toast(msg, iconName = 'circle-check') {
  const el = $('#toast');
  el.innerHTML = `${icon(iconName, { size: 18 })}<span>${esc(msg)}</span>`;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

/* ==========================================================================
   FAVORITOS
   ========================================================================== */
function renderFavCount() {
  const n = state.favs.size;
  $$('[data-fav-count]').forEach((el) => { el.hidden = n === 0; el.textContent = n; });
  const link = $('.header__actions [data-key="favoritos"]');
  if (link) link.setAttribute('aria-label', n ? `Favoritos (${n})` : 'Favoritos');
}
function toggleFav(id) {
  const p = (state.products || []).find((x) => x.id === id);
  const on = !state.favs.has(id);
  if (on) state.favs.add(id); else state.favs.delete(id);
  saveFavs(); renderFavCount();
  $$(`.fav-btn[data-id="${CSS.escape(id)}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
  toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos', on ? 'heart' : 'x');
  if (currentRoute === 'favoritos' && !on) renderFavoritesBody();
}

/* ==========================================================================
   PÁGINAS
   ========================================================================== */
function HomePage(products) {
  const featured = products.filter((p) => p.destaque).slice(0, 8);
  const offers = products.filter((p) => p.oferta).slice(0, 4);
  const news = products.filter((p) => p.condicao === 'novo' && !p.oferta).slice(0, 4);
  const rec = products.filter((p) => p.condicao === 'recondicionado');
  const usd = products.filter((p) => p.condicao === 'usado');
  const reuse = [];
  for (let i = 0; reuse.length < 4 && (rec[i] || usd[i]); i++) { if (rec[i]) reuse.push(rec[i]); if (usd[i] && reuse.length < 4) reuse.push(usd[i]); }
  const a = CONFIG.store.address;
  const benefits = [
    ['sparkles', 'Novos e usados', 'Encontre equipamentos novos e usados no mesmo lugar.'],
    ['refresh', 'Produtos recondicionados', 'Uma opção para quem quer economizar.'],
    ['settings', 'Peças e acessórios', 'Peças, acessórios e itens para informática e games.'],
    ['whatsapp', 'Atendimento pelo WhatsApp', 'Tire dúvidas e consulte a disponibilidade direto na conversa.'],
    ['store', 'Loja física em Lagoa do Carro', 'Venha ver os produtos pessoalmente.']
  ];
  return `
  <section class="hero" aria-labelledby="hero-title">
    <svg class="hero__circuit" viewBox="0 0 640 520" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <path d="M640 34H500l-36 36H380"/><circle cx="371" cy="70" r="6"/><path d="M640 104H566l-30 30H468"/><circle cx="459" cy="134" r="6"/>
      <path d="M640 420H548l-30 30H430"/><circle cx="421" cy="450" r="6"/><path d="M640 486H592l-26 26H500"/><circle cx="491" cy="512" r="6"/></svg>
    <div class="container hero__inner">
      <div class="hero__copy">
        <h1 class="hero__title" id="hero-title" tabindex="-1">Seu próximo eletrônico está aqui.</h1>
        <p class="hero__lead">${esc(CONFIG.store.tagline)}</p>
        <div class="hero__cta">
          ${WhatsAppButton({ href: waLink(MSG.generic), label: 'Falar no WhatsApp', size: 'btn--lg' })}
          <a class="btn btn--ghost-dark btn--lg" href="#/produtos">Ver produtos</a></div>
        <div class="hero__search">${SearchBar({ id: 'hh', variant: 'hero' })}
          <div class="hero__try"><span>Experimente buscar por:</span>${['iPhone', 'Notebook', 'Monitor', 'Controle', 'Tablet'].map((t) => `<a href="#/produtos?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div></div>
      </div>
      <div class="hero__brand"><img src="${ASSETS.mark}" width="500" height="278" alt="Lagoa Eletros: sol sobre a lagoa com circuitos eletrônicos"></div>
    </div>
    <div class="hero__wave" aria-hidden="true"><svg viewBox="0 0 1440 60" preserveAspectRatio="none" fill="currentColor"><path d="M0 60V30C170 8 330 4 510 20s370 36 550 24c140-9 270-26 380-32V60z"/></svg></div>
  </section>

  <section class="section section--tight" aria-labelledby="cat-title"><div class="container">
    ${SectionTitle({ id: 'cat-title', title: 'Categorias', moreHref: '#/categorias', moreLabel: 'Ver todas' })}${CategoryGrid()}</div></section>

  ${featured.length ? `<section class="section section--tight" aria-labelledby="dest-title"><div class="container">
    ${SectionTitle({ id: 'dest-title', title: 'Produtos em destaque', moreHref: '#/produtos', moreLabel: 'Ver todos os produtos' })}${ProductGrid(featured)}</div></section>` : ''}

  ${offers.length ? `<section class="section section--tint" aria-labelledby="of-title"><div class="container">
    ${SectionTitle({ id: 'of-title', title: 'Ofertas da Lagoa', lead: 'Produtos com preço reduzido.', moreHref: '#/ofertas', moreLabel: 'Ver todas as ofertas', mark: 'tag' })}${ProductGrid(offers)}</div></section>` : ''}

  ${news.length ? `<section class="section" aria-labelledby="new-title"><div class="container">
    ${SectionTitle({ id: 'new-title', title: 'Novos produtos', moreHref: '#/produtos?cond=novo', moreLabel: 'Ver novos' })}${ProductGrid(news)}</div></section>` : ''}

  <section class="section section--tight" aria-labelledby="reuse-title"><div class="container"><div class="reuse">
    <div class="reuse__panel"><span class="reuse__mark">${icon('refresh', { size: 24 })}</span>
      <h2 class="reuse__title" id="reuse-title">Usados e Recondicionados</h2>
      <p class="reuse__text">Opções para quem busca economia sem abrir mão de equipamentos selecionados.</p>
      <p class="reuse__note">${icon('info', { size: 16 })}<span>Consulte as condições de garantia de cada produto antes da compra.</span></p>
      <div class="reuse__cta"><a class="btn btn--ghost-dark" href="#/produtos?cond=usado">Ver usados</a><a class="btn btn--ghost-dark" href="#/produtos?cond=recondicionado">Ver recondicionados</a></div></div>
    ${ProductGrid(reuse, 'product-grid--reuse')}</div></div></section>

  <section class="section" aria-labelledby="why-title"><div class="container">
    ${SectionTitle({ id: 'why-title', title: 'Por que Lagoa Eletros?' })}
    <ul class="benefits">${benefits.map(([ic, t, d]) => `<li class="benefit"><span class="benefit__icon">${icon(ic, { size: 22 })}</span><div><h3 class="benefit__title">${t}</h3><p class="benefit__text">${d}</p></div></li>`).join('')}</ul></div></section>

  <section class="section section--tight" aria-labelledby="about-title"><div class="container"><div class="about">
    <div class="about__text"><h2 class="section-title" id="about-title">Sobre a Lagoa Eletros</h2>
      <p>A Lagoa Eletros é uma loja localizada em Lagoa do Carro, Pernambuco, especializada em produtos eletrônicos, informática, acessórios, peças e equipamentos novos, usados e recondicionados.</p>
      <div class="about__cta"><a class="btn btn--outline" href="#/sobre">Conhecer a loja</a></div></div>
    <div class="about__logo"><img src="${ASSETS.full}" width="420" height="335" alt="Logo da Lagoa Eletros: novos, usados, recondicionados e peças com o melhor custo-benefício" loading="lazy"></div></div></div></section>

  <section class="section section--tight" aria-labelledby="loc-title"><div class="container">${LocationCard()}</div></section>
  <section class="section section--tight"><div class="container">${CtaBand()}</div></section>`;
}

/* ---------- Catálogo (Produtos, Categoria, Ofertas) ---------- */
const listParam = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
function mountCatalog(products, opts, params) {
  const main = $('#conteudo');
  const s = {
    q: params.get('q') || '', cat: listParam(params.get('cat')), cond: listParam(params.get('cond')),
    marca: listParam(params.get('marca')), min: params.get('min') || '', max: params.get('max') || '', ord: params.get('ord') || 'relevancia'
  };
  if (opts.lockCat) s.cat = [opts.lockCat];
  const base = products.filter((p) => (opts.onlyOffer ? p.oferta : true));
  const drawer = $('#filter-drawer');

  let title = opts.title; let lead = opts.lead || '';
  if (opts.kind === 'produtos' && s.cond.length && !s.q) {
    const key = s.cond.slice().sort().join(',');
    if (key === 'usado') title = 'Produtos usados';
    else if (key === 'recondicionado') title = 'Produtos recondicionados';
    else if (key === 'recondicionado,usado') { title = 'Usados e recondicionados'; }
    if (s.cond.every((c) => c !== 'novo') && s.cond.length) lead = 'Opções para quem busca economia sem abrir mão de equipamentos selecionados. Consulte as condições de garantia de cada produto antes da compra.';
  }

  main.innerHTML = `
    <div class="container page-head">${Crumbs(opts.crumbs)}<h1 class="page-title" tabindex="-1">${esc(title)}</h1>${lead ? `<p class="page-lead">${esc(lead)}</p>` : ''}</div>
    <div class="container catalog">
      <aside class="catalog__filters" aria-label="Filtros"><div class="filters-panel">
        <div class="filters-panel__head"><h2 class="filters-panel__title">Filtros</h2><button type="button" class="btn btn--text" data-action="clear-filters">Limpar</button></div>
        ${FiltersForm('fd', products, { lockCat: opts.lockCat })}</div></aside>
      <section class="catalog__main" aria-label="Lista de produtos">
        <div class="toolbar">
          <div class="toolbar__search">${SearchBar({ id: 'cs', variant: 'page', value: s.q, live: true, placeholder: 'Buscar nesta lista' })}</div>
          <button type="button" class="btn btn--outline toolbar__filter-btn" data-action="open-filters" aria-haspopup="dialog">${icon('sliders', { size: 18 })}<span>Filtros</span><span data-filter-count></span></button>
          <label class="toolbar__sort"><span>Ordenar</span><select class="select" data-sort>
            <option value="relevancia">Relevância</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">Nome (A a Z)</option></select></label>
        </div>
        <div class="results-meta"><p class="results-status" role="status" data-status></p><div class="chips" data-chips aria-label="Filtros ativos"></div></div>
        <div data-results></div>
      </section>
    </div>`;
  $('.drawer__body', drawer).innerHTML = FiltersForm('fm', products, { lockCat: opts.lockCat });

  const results = $('[data-results]', main); const status = $('[data-status]', main);
  const chipsEl = $('[data-chips]', main); const sortEl = $('[data-sort]', main);
  sortEl.value = s.ord;

  const activeFilterCount = () => (opts.lockCat ? 0 : (s.cat.length ? 1 : 0)) + (s.cond.length ? 1 : 0) + (s.marca.length ? 1 : 0) + (s.min !== '' || s.max !== '' ? 1 : 0);
  const anyActive = () => s.q || activeFilterCount() > 0;

  function compute() {
    let list = base;
    if (s.q) list = searchProducts(list, s.q);
    if (s.cat.length) list = list.filter((p) => s.cat.includes(p.categoria));
    if (s.cond.length) list = list.filter((p) => s.cond.includes(p.condicao));
    if (s.marca.length) list = list.filter((p) => s.marca.includes(p.marca));
    const min = parseFloat(s.min); const max = parseFloat(s.max);
    if (!isNaN(min)) list = list.filter((p) => p.preco >= min);
    if (!isNaN(max)) list = list.filter((p) => p.preco <= max);
    list = list.slice();
    if (s.ord === 'menor') list.sort((a, b) => a.preco - b.preco);
    else if (s.ord === 'maior') list.sort((a, b) => b.preco - a.preco);
    else if (s.ord === 'nome') list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    else list.sort((a, b) => (b.destaque - a.destaque) || (b.oferta - a.oferta) || (hasStock(b) - hasStock(a)));
    return list;
  }
  function chips() {
    const out = [];
    if (s.q) out.push({ g: 'q', v: '', label: `Busca: “${s.q}”` });
    if (!opts.lockCat) s.cat.forEach((v) => out.push({ g: 'cat', v, label: catBySlug(v).nome }));
    s.cond.forEach((v) => out.push({ g: 'cond', v, label: (CONDITIONS[v] || { label: v }).label }));
    s.marca.forEach((v) => out.push({ g: 'marca', v, label: v }));
    if (s.min !== '' || s.max !== '') {
      const a = s.min !== '' ? fmt(+s.min) : 'R$ 0'; const b = s.max !== '' ? fmt(+s.max) : 'sem limite';
      out.push({ g: 'price', v: '', label: `Preço: ${a} a ${b}` });
    }
    return out;
  }
  function syncUrl() {
    const q = new URLSearchParams();
    if (s.q) q.set('q', s.q);
    if (!opts.lockCat && s.cat.length) q.set('cat', s.cat.join(','));
    if (s.cond.length) q.set('cond', s.cond.join(','));
    if (s.marca.length) q.set('marca', s.marca.join(','));
    if (s.min !== '') q.set('min', s.min);
    if (s.max !== '') q.set('max', s.max);
    if (s.ord !== 'relevancia') q.set('ord', s.ord);
    const qs = q.toString();
    history.replaceState(null, '', `#${opts.path}${qs ? '?' + qs : ''}`);
  }
  function syncInputs() {
    $$('[data-filters]').forEach((form) => {
      $$('input[type="checkbox"]', form).forEach((i) => { i.checked = s[i.dataset.group].includes(i.value); });
      $$('input[type="number"]', form).forEach((i) => { if (document.activeElement !== i) i.value = s[i.dataset.group]; });
    });
  }
  function update({ animate = true } = {}) {
    const list = compute();
    const n = list.length;
    status.textContent = `${n} ${n === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    const cs = chips();
    chipsEl.innerHTML = cs.map((c) => `<button type="button" class="chip" data-action="remove-chip" data-group="${c.g}" data-value="${esc(c.v)}" aria-label="Remover filtro: ${esc(c.label)}">${esc(c.label)}${icon('x', { size: 16 })}</button>`).join('')
      + (cs.length > 1 ? '<button type="button" class="chip chip--clear" data-action="clear-filters">Limpar tudo</button>' : '');
    if (!n) {
      results.innerHTML = EmptyState({
        title: 'Nenhum produto encontrado.', text: 'Experimente buscar por outro nome ou categoria.',
        actions: `${anyActive() ? '<button type="button" class="btn btn--outline" data-action="clear-filters">Limpar filtros</button>' : ''}${WhatsAppButton({ href: waLink(MSG.generic), label: 'Perguntar no WhatsApp' })}`
      });
    } else {
      results.innerHTML = `<div class="${animate && !reducedMotion() ? 'fade-in' : ''}">${ProductGrid(list, 'product-grid--cols3')}</div>`;
    }
    const fc = activeFilterCount();
    $('[data-filter-count]', main).textContent = fc ? `(${fc})` : '';
    const apply = $('[data-action="apply-filters"]', drawer);
    if (apply) apply.textContent = n ? `Ver ${n} ${n === 1 ? 'produto' : 'produtos'}` : 'Nenhum produto';
    syncInputs(); syncUrl();
  }
  // preço: min e max são acumulados e aplicados juntos (um debounce compartilhado perderia um deles)
  let pendingPrice = {};
  const flushPrice = debounce(() => {
    Object.entries(pendingPrice).forEach(([g, v]) => { s[g] = v === '' ? '' : String(Math.max(0, parseFloat(v) || 0)); });
    pendingPrice = {}; update({ animate: false });
  }, 350);
  const setQueryDebounced = debounce((v) => { s.q = v.trim(); update({ animate: false }); }, 220);
  catalog = {
    update,
    setQuery(v) { s.q = v.trim(); update({ animate: false }); },
    setQueryDebounced,
    toggle(group, value, on) { const a = s[group]; const i = a.indexOf(value); if (on && i < 0) a.push(value); if (!on && i >= 0) a.splice(i, 1); update(); },
    setPrice(g, v) { pendingPrice[g] = v; flushPrice(); },
    setSort(v) { s.ord = v; update(); },
    remove(group, value) {
      if (group === 'q') { s.q = ''; const i = $('#cs-input'); if (i) i.value = ''; }
      else if (group === 'price') { s.min = ''; s.max = ''; }
      else { s[group] = s[group].filter((x) => x !== value); }
      update();
    },
    clear() {
      s.q = ''; s.cond = []; s.marca = []; s.min = ''; s.max = ''; if (!opts.lockCat) s.cat = [];
      const i = $('#cs-input'); if (i) i.value = '';
      update();
    }
  };
  update({ animate: false });
  return title;
}

/* ---------- Página do produto ---------- */
function ProductPage(p, products) {
  const cat = catBySlug(p.categoria);
  const inStock = hasStock(p);
  const imgs = (p.imagens && p.imagens.length ? p.imagens : (p.imagem ? [p.imagem] : []));
  const gallery = imgs.length > 1
    ? `${ProductImage({ ...p, imagens: [imgs[0]], imagem: imgs[0] }, { large: true })}<div class="pdp__thumbs">${imgs.map((src, i) => `<button type="button" class="pdp__thumb" data-action="gallery" data-src="${esc(src)}" aria-label="Ver imagem ${i + 1} de ${imgs.length}" aria-current="${i === 0}"><img src="${esc(src)}" alt="" width="72" height="54" loading="lazy"></button>`).join('')}</div>`
    : ProductImage(p, { large: true });
  const related = products.filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 4);
  const more = related.length ? related : products.filter((x) => x.id !== p.id && x.destaque).slice(0, 4);
  const buyHref = waLink(inStock ? MSG.interest(p) : MSG.availability(p));
  return `<div class="container pdp pdp-has-sticky">
    <div class="page-head">${Crumbs([{ label: 'Início', href: '#/' }, { label: 'Produtos', href: '#/produtos' }, { label: cat.nome, href: `#/categoria/${cat.slug}` }, { label: p.nome }])}</div>
    <div class="pdp__grid">
      <div class="pdp__media">${gallery}</div>
      <div class="pdp__info">
        ${ProductBadges(p)}
        <h1 class="pdp__title" tabindex="-1">${esc(p.nome)}</h1>
        ${PriceDisplay(p, { lg: true })}
        <p class="pdp__avail ${inStock ? 'pdp__avail--ok' : 'pdp__avail--no'}">${icon(inStock ? 'circle-check' : 'circle-alert', { size: 20 })}<span>${inStock ? 'Em estoque. Confirme a disponibilidade pelo WhatsApp antes de vir à loja.' : 'Sem estoque no momento. Consulte a disponibilidade pelo WhatsApp.'}</span></p>
        <div class="pdp__cta">
          ${inStock ? WhatsAppButton({ href: buyHref, label: 'Comprar pelo WhatsApp', size: 'btn--lg btn--block' }) : WhatsAppButton({ href: buyHref, label: 'Consultar disponibilidade', size: 'btn--lg btn--block' })}
          <div class="pdp__cta-row">${inStock ? `<a class="btn btn--outline btn--lg" href="${waLink(MSG.availability(p))}" target="_blank" rel="noopener">Consultar disponibilidade</a>` : ''}${FavButton(p, { inline: true })}</div>
        </div>
        <p class="pdp__note">${icon('info', { size: 18 })}<span>Consulte as condições de garantia de cada produto antes da compra.</span></p>
        ${p.demo ? `<p class="demo-note">${icon('info', { size: 18 })}<span><strong>Produto de demonstração.</strong> Nome, preço e disponibilidade são exemplos e não representam o estoque real da loja.</span></p>` : ''}
      </div>
    </div>
    <div class="pdp__sections">
      <section aria-labelledby="desc-title"><h2 class="pdp__h2" id="desc-title">Descrição</h2><p class="pdp__desc">${esc(p.descricao || 'Descrição em breve.')}</p></section>
      <section aria-labelledby="info-title"><h2 class="pdp__h2" id="info-title">Informações</h2>
        <dl class="spec">
          <div class="spec__row"><dt>Marca</dt><dd>${esc(p.marca || 'Não informada')}</dd></div>
          <div class="spec__row"><dt>Categoria</dt><dd><a href="#/categoria/${cat.slug}">${esc(cat.nome)}</a></dd></div>
          <div class="spec__row"><dt>Condição</dt><dd>${esc((CONDITIONS[p.condicao] || {}).label || '')}</dd></div>
          <div class="spec__row"><dt>Sobre a condição</dt><dd>${esc(condText(p))}</dd></div>
          <div class="spec__row"><dt>Disponibilidade</dt><dd>${inStock ? 'Em estoque' : 'Sem estoque no momento'}</dd></div>
        </dl></section>
      ${more.length ? `<section aria-labelledby="rel-title"><h2 class="pdp__h2" id="rel-title">${related.length ? 'Mais em ' + esc(cat.nome) : 'Você também pode gostar'}</h2>${ProductGrid(more)}</section>` : ''}
    </div>
  </div>
  <div class="sticky-buy"><div class="sticky-buy__price">${PriceDisplay(p)}</div>${WhatsAppButton({ href: buyHref, label: inStock ? 'Comprar pelo WhatsApp' : 'Consultar disponibilidade' })}</div>`;
}

function CategoriesPage() {
  return `<div class="container page-head">${Crumbs([{ label: 'Início', href: '#/' }, { label: 'Categorias' }])}<h1 class="page-title" tabindex="-1">Categorias</h1><p class="page-lead">Escolha uma categoria para ver os produtos.</p></div>
    <div class="container section--tight section">${CategoryGrid()}</div>`;
}
function AboutPage() {
  const list = ['Produtos novos', 'Produtos usados', 'Produtos recondicionados', 'Peças e acessórios', 'Informática, eletrônicos e games'];
  return `<div class="container page-head">${Crumbs([{ label: 'Início', href: '#/' }, { label: 'Sobre' }])}</div>
    <div class="container section section--tight"><div class="about">
      <div class="about__text"><h1 class="page-title" tabindex="-1">Sobre a Lagoa Eletros</h1>
        <p>A Lagoa Eletros é uma loja localizada em Lagoa do Carro, Pernambuco, especializada em produtos eletrônicos, informática, acessórios, peças e equipamentos novos, usados e recondicionados.</p>
        <p>Aqui você encontra:</p>
        <ul class="about__list">${list.map((t) => `<li>${icon('check', { size: 18 })}<span>${t}</span></li>`).join('')}</ul>
        <div class="about__cta">${WhatsAppButton({ href: waLink(MSG.generic), label: 'Falar no WhatsApp', size: 'btn--lg' })}<a class="btn btn--outline btn--lg" href="#/localizacao">Como chegar</a></div></div>
      <div class="about__logo"><img src="${ASSETS.full}" width="420" height="335" alt="Logo da Lagoa Eletros: novos, usados, recondicionados e peças com o melhor custo-benefício"></div></div></div>`;
}
function LocationPage() {
  return `<div class="container page-head">${Crumbs([{ label: 'Início', href: '#/' }, { label: 'Localização' }])}<h1 class="page-title" tabindex="-1">Visite nossa loja</h1><p class="page-lead">Antes de vir, você pode consultar a disponibilidade dos produtos pelo WhatsApp.</p></div>
    <div class="container section section--tight">${LocationCard({ withTitle: false })}<div style="margin-top:24px">${CtaBand()}</div></div>`;
}
function FavoritesPage() {
  return `<div class="container page-head">${Crumbs([{ label: 'Início', href: '#/' }, { label: 'Favoritos' }])}<h1 class="page-title" tabindex="-1">Favoritos</h1><p class="page-lead">Produtos que você salvou neste aparelho.</p></div>
    <div class="container section section--tight" data-fav-body></div>`;
}
function renderFavoritesBody() {
  const body = $('[data-fav-body]'); if (!body) return;
  const list = (state.products || []).filter((p) => state.favs.has(p.id));
  body.innerHTML = list.length ? ProductGrid(list)
    : EmptyState({ iconName: 'heart', title: 'Você ainda não tem favoritos.', text: 'Toque no coração de um produto para salvá-lo aqui.', actions: '<a class="btn btn--primary" href="#/produtos">Ver produtos</a>' });
}

/* ==========================================================================
   ROTEADOR (hash: funciona em qualquer hospedagem estática)
   ========================================================================== */
let currentRoute = '';
let firstRender = true;
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [p, qs = ''] = raw.split('?');
  return { path: (p.startsWith('/') ? p : '/' + p).replace(/\/+$/, '') || '/', params: new URLSearchParams(qs) };
}
const TITLES = {
  home: 'Lagoa Eletros | Eletrônicos, Informática e Acessórios em Lagoa do Carro',
  categorias: 'Categorias | Lagoa Eletros', ofertas: 'Ofertas da Lagoa | Lagoa Eletros', sobre: 'Sobre a loja | Lagoa Eletros',
  localizacao: 'Como chegar | Lagoa Eletros', favoritos: 'Favoritos | Lagoa Eletros', produtos: 'Produtos | Lagoa Eletros'
};
function NotFound() {
  return `<div class="container section">${EmptyState({ iconName: 'search', title: 'Página não encontrada.', text: 'O endereço pode ter mudado. Volte para o início ou veja os produtos.', actions: '<a class="btn btn--primary" href="#/">Ir para o início</a><a class="btn btn--outline" href="#/produtos">Ver produtos</a>' })}</div>`;
}
async function route() {
  if (location.hash && !location.hash.startsWith('#/')) return;
  const { path, params } = parseHash();
  const token = ++routeToken;
  const main = $('#conteudo');
  closeAllDrawers(); toggleSearch(false);
  catalog = null; $('#filter-drawer .drawer__body').innerHTML = '';

  let name = 'notfound'; let arg = '';
  let m;
  if (path === '/') name = 'home';
  else if (path === '/produtos') name = 'produtos';
  else if ((m = path.match(/^\/produtos\/([^/]+)$/))) { name = 'produto'; arg = decodeURIComponent(m[1]); }
  else if (path === '/categorias') name = 'categorias';
  else if ((m = path.match(/^\/categoria\/([^/]+)$/))) { name = 'categoria'; arg = decodeURIComponent(m[1]); }
  else if (path === '/ofertas') name = 'ofertas';
  else if (path === '/sobre') name = 'sobre';
  else if (path === '/localizacao') name = 'localizacao';
  else if (path === '/favoritos') name = 'favoritos';
  currentRoute = name;
  document.body.dataset.route = name;
  const navKey = { produto: 'produtos', categoria: 'categorias' }[name] || name;
  $$('[data-key]').forEach((el) => { if (el.dataset.key === navKey) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });

  if (!state.products) {
    main.innerHTML = `<div class="container section">${LoadingState(8)}</div>`;
    try { await getProducts(); }
    catch (e) {
      if (token !== routeToken) return;
      main.innerHTML = `<div class="container section">${EmptyState({ iconName: 'circle-alert', error: true, title: 'Não foi possível carregar os produtos.', text: 'Verifique sua conexão e tente de novo.', actions: '<button type="button" class="btn btn--primary" data-action="retry">Tentar de novo</button>' })}</div>`;
      return;
    }
    if (token !== routeToken) return;
  }
  const products = state.products;
  let title = TITLES[name] || 'Lagoa Eletros';

  if (name === 'home') main.innerHTML = HomePage(products);
  else if (name === 'produtos') {
    title = mountCatalog(products, { kind: 'produtos', path: '/produtos', title: 'Produtos', crumbs: [{ label: 'Início', href: '#/' }, { label: 'Produtos' }] }, params) + ' | Lagoa Eletros';
  } else if (name === 'categoria') {
    const cat = CATEGORIES.find((c) => c.slug === arg);
    if (!cat) main.innerHTML = NotFound();
    else { mountCatalog(products, { kind: 'categoria', path: `/categoria/${cat.slug}`, lockCat: cat.slug, title: cat.nome, crumbs: [{ label: 'Início', href: '#/' }, { label: 'Categorias', href: '#/categorias' }, { label: cat.nome }] }, params); title = `${cat.nome} | Lagoa Eletros`; }
  } else if (name === 'ofertas') {
    mountCatalog(products, { kind: 'ofertas', path: '/ofertas', onlyOffer: true, title: 'Ofertas da Lagoa', lead: 'Produtos com preço reduzido.', crumbs: [{ label: 'Início', href: '#/' }, { label: 'Ofertas' }] }, params);
  } else if (name === 'produto') {
    const p = products.find((x) => x.id === arg);
    if (!p) main.innerHTML = NotFound(); else { main.innerHTML = ProductPage(p, products); title = `${p.nome} | Lagoa Eletros`; }
  } else if (name === 'categorias') main.innerHTML = CategoriesPage();
  else if (name === 'sobre') main.innerHTML = AboutPage();
  else if (name === 'localizacao') main.innerHTML = LocationPage();
  else if (name === 'favoritos') { main.innerHTML = FavoritesPage(); renderFavoritesBody(); }
  else main.innerHTML = NotFound();

  document.title = title;
  if (!firstRender) {
    window.scrollTo(0, 0);
    const h1 = $('h1', main); if (h1) h1.focus({ preventScroll: true });
  }
  firstRender = false;
}

/* ==========================================================================
   INTERAÇÕES GLOBAIS (delegação de eventos: nada é reatado a cada renderização)
   ========================================================================== */
const searchPanel = () => $('#search-panel');
function toggleSearch(force, returnFocus) {
  const panel = searchPanel(); if (!panel) return;
  const open = typeof force === 'boolean' ? force : panel.hidden;
  const btn = $('[data-action="toggle-search"]');
  if (open === !panel.hidden) return;
  panel.hidden = !open;
  if (btn) btn.setAttribute('aria-expanded', String(open));
  if (open) $('.sb__input', panel).focus();
  else { sbHide($('.sb', panel)); if (returnFocus && btn) btn.focus(); }
}
const goto = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

document.addEventListener('click', (e) => {
  const opt = e.target.closest('.sb__opt[data-href]');
  if (opt) { const form = opt.closest('.sb'); sbHide(form); goto(opt.dataset.href); return; }

  const el = e.target.closest('[data-action]');
  if (el) {
    const a = el.dataset.action;
    if (a === 'fav') { e.preventDefault(); toggleFav(el.dataset.id); return; }
    if (a === 'open-menu') { openDrawer($('#menu-drawer')); return; }
    if (a === 'close-drawer') { closeDrawer(el.closest('dialog')); return; }
    if (a === 'toggle-search') { toggleSearch(); return; }
    if (a === 'open-filters') { openDrawer($('#filter-drawer')); return; }
    if (a === 'apply-filters') { closeDrawer($('#filter-drawer')); return; }
    if (a === 'clear-filters') { catalog && catalog.clear(); return; }
    if (a === 'remove-chip') { catalog && catalog.remove(el.dataset.group, el.dataset.value); return; }
    if (a === 'retry') { state.products = null; route(); return; }
    if (a === 'gallery') {
      const main = $('[data-gallery-main] img');
      if (main) main.src = el.dataset.src;
      $$('.pdp__thumb').forEach((b) => b.setAttribute('aria-current', String(b === el)));
      return;
    }
  }
  const link = e.target.closest('a[href^="#/"]');
  if (link && link.getAttribute('href') === location.hash) { e.preventDefault(); route(); }   // mesmo destino: recarrega a vista

  // clique fora: fecha o painel de busca e as sugestões
  const panel = searchPanel();
  if (panel && !panel.hidden && !e.target.closest('#search-panel') && !e.target.closest('[data-action="toggle-search"]')) toggleSearch(false);
  $$('.sb').forEach((f) => { if (!f.contains(e.target)) sbHide(f); });
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('.sb'); if (!form) return;
  e.preventDefault();
  const q = $('.sb__input', form).value.trim();
  if (form.dataset.live === 'true') { catalog && catalog.setQuery(q); return; }
  sbHide(form);
  goto(q ? `#/produtos?q=${encodeURIComponent(q)}` : '#/produtos');
});
document.addEventListener('input', (e) => {
  const t = e.target;
  const form = t.closest && t.closest('.sb');
  if (form && t.classList.contains('sb__input')) {
    if (form.dataset.live === 'true') catalog && catalog.setQueryDebounced(t.value); else sbSuggest(form);
    return;
  }
  if (catalog && t.matches && t.matches('[data-filters] input[type="number"]')) catalog.setPrice(t.dataset.group, t.value);
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!catalog) return;
  if (t.matches('[data-filters] input[type="checkbox"]')) catalog.toggle(t.dataset.group, t.value, t.checked);
  else if (t.matches('[data-sort]')) catalog.setSort(t.value);
});
document.addEventListener('keydown', (e) => {
  const input = e.target.closest && e.target.closest('.sb__input');
  if (input) {
    const form = input.closest('.sb'); const list = $('.sb__list', form);
    if (list && !list.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sbMove(form, 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); sbMove(form, -1); return; }
      if (e.key === 'Enter') { const sel = $('.sb__opt[aria-selected="true"]', list); if (sel && sel.dataset.href) { e.preventDefault(); sbHide(form); goto(sel.dataset.href); return; } }
      if (e.key === 'Escape') { e.preventDefault(); sbHide(form); return; }
    }
  }
  if (e.key === 'Escape' && searchPanel() && !searchPanel().hidden) toggleSearch(false, true);
});
document.addEventListener('focusout', (e) => {
  const form = e.target.closest && e.target.closest('.sb'); if (!form) return;
  setTimeout(() => { if (!form.contains(document.activeElement)) sbHide(form); }, 0);
});
window.addEventListener('hashchange', route);

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
function init() {
  state.favs = loadFavs();
  const demo = $('#demo-bar');
  if (CONFIG.demoMode) demo.innerHTML = `<div class="container demo-bar__inner">${icon('info', { size: 18 })}<p><strong>Versão de demonstração.</strong> Produtos e preços são exemplos.</p></div>`;
  else demo.remove();
  $('#site-header').innerHTML = Header();
  $('#site-footer').innerHTML = Footer();
  const menu = $('#menu-drawer'); menu.innerHTML = MenuDrawer();
  const fdrawer = $('#filter-drawer');
  fdrawer.innerHTML = `<div class="drawer__head"><h2 class="drawer__title">Filtros</h2><button type="button" class="icon-btn" data-action="close-drawer" aria-label="Fechar filtros">${icon('x', { size: 24 })}</button></div>
    <div class="drawer__body"></div>
    <div class="drawer__foot"><button type="button" class="btn btn--outline" data-action="clear-filters">Limpar</button><button type="button" class="btn btn--primary" data-action="apply-filters">Ver produtos</button></div>`;
  [menu, fdrawer].forEach((dlg) => {
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDrawer(dlg); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDrawer(dlg); });
    dlg.addEventListener('close', () => dlg.classList.remove('is-open'));
  });
  const fab = $('#fab-whatsapp'); fab.href = waLink(MSG.generic);
  fab.innerHTML = `${icon('whatsapp', { size: 28 })}<span class="fab__label" aria-hidden="true">Falar no WhatsApp</span>`;
  $('.skip-link').addEventListener('click', (e) => { e.preventDefault(); $('#conteudo').focus(); });
  renderFavCount();
  // sombra do cabeçalho ao rolar
  const header = $('#site-header'); let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { header.style.boxShadow = window.scrollY > 8 ? '0 6px 20px -10px rgba(0,0,0,.7)' : 'none'; ticking = false; });
  }, { passive: true });
  route();
}
init();
