'use strict';

const STORAGE_KEY = 'vb_store_v1';
const DONUT_CORES = ['#4E0C1C', '#c5a059', '#b23957', '#4a9f8e', '#7c4a8b'];
const CAT_EMOJIS  = { Perfumes: '🌸', Maquiagem: '💄', Cuidados: '🧴' };
const BADGE_CLASS = {
  Entregue: 'badge-green', Processando: 'badge-orange', Cancelado: 'badge-red',
  Enviado:  'badge-blue',  Emitida: 'badge-green',      Pendente:  'badge-orange',
  Cancelada:'badge-red',   OK: 'badge-green',            Baixo: 'badge-orange',
  Crítico:  'badge-red',
};
const PAGES_WITH_SELECTS = new Set(['dashboard','vendas','estoque','fiscal','clientes','produtos']);

// ─── Persistência ────────────────────────────────────────────────────────────

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      clientes:     Store.clientes,
      produtos:     Store.produtos,
      vendas:       Store.vendas,
      notificacoes: Store.notificacoes,
      nextId:       Store.nextId,
    }));
  } catch (e) {
    console.warn('localStorage indisponível:', e);
  }
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

const _defaults = {
  clientes: [
    { id: 1, nome: 'Jasina Plato',   cpf: '123.456.789-00', tel: '(27) 99812-3456', email: 'jasina@email.com',  cidade: 'Vila Velha', estado: 'ES', avatar: 'c-av-rose'   },
    { id: 2, nome: 'Amiza Bonrsz',   cpf: '234.567.890-11', tel: '(27) 98200-4456', email: 'amiza@email.com',   cidade: 'Vila Velha', estado: 'ES', avatar: 'c-av-purple' },
    { id: 3, nome: 'Marza Etagão',   cpf: '345.678.901-22', tel: '(27) 97001-2233', email: 'marza@email.com',   cidade: 'Serra',      estado: 'ES', avatar: 'c-av-teal'   },
    { id: 4, nome: 'Amıza Gravez',   cpf: '456.789.012-33', tel: '(27) 98765-0001', email: 'amizag@email.com',  cidade: 'Vitória',    estado: 'ES', avatar: 'c-av-gold'   },
    { id: 5, nome: 'Jonna Rvonanto', cpf: '567.890.123-44', tel: '(27) 99100-8877', email: 'jonna@email.com',   cidade: 'Cariacica',  estado: 'ES', avatar: 'c-av-blue'   },
  ],
  produtos: [
    { id: 1, nome: 'Bleu de Chanel EDP', categoria: 'Perfumes',  preco: 389, qtd: 18, validade: '2026-09-30', fornecedor: 'Chanel Distribuidora', emoji: '🌸' },
    { id: 2, nome: 'La Vie est Belle',   categoria: 'Perfumes',  preco: 320, qtd: 11, validade: '2026-11-30', fornecedor: 'Lancôme Brasil',       emoji: '✨' },
    { id: 3, nome: 'Batom Matte Ruby',   categoria: 'Maquiagem', preco: 65,  qtd: 2,  validade: '2026-06-30', fornecedor: 'MAC Cosméticos',       emoji: '💄' },
    { id: 4, nome: 'Hidratante Natura',  categoria: 'Cuidados',  preco: 89,  qtd: 24, validade: '2027-03-31', fornecedor: 'Natura',               emoji: '🧴' },
    { id: 5, nome: 'Perfume Árabe Oud',  categoria: 'Perfumes',  preco: 219, qtd: 3,  validade: '2026-07-31', fornecedor: 'Arabian Oud',          emoji: '🌿' },
    { id: 6, nome: 'Esmalte Gel Top',    categoria: 'Maquiagem', preco: 28,  qtd: 42, validade: '2028-01-31', fornecedor: 'OPI Brasil',            emoji: '💅' },
    { id: 7, nome: 'Base Líquida Nars',  categoria: 'Maquiagem', preco: 145, qtd: 5,  validade: '2026-08-31', fornecedor: 'Nars Cosmetics',        emoji: '🎨' },
  ],
  vendas: [
    { id: 42, clienteId: 2, produtoId: 1, qtd: 1, desconto: 0,  pagamento: 'PIX',              status: 'Entregue',    data: '2026-05-20', nf: true  },
    { id: 41, clienteId: 1, produtoId: 3, qtd: 1, desconto: 5,  pagamento: 'Cartão de Crédito', status: 'Processando', data: '2026-05-20', nf: false },
    { id: 40, clienteId: 3, produtoId: 2, qtd: 1, desconto: 0,  pagamento: 'Dinheiro',          status: 'Cancelado',   data: '2026-05-19', nf: false },
    { id: 39, clienteId: 4, produtoId: 6, qtd: 2, desconto: 10, pagamento: 'PIX',               status: 'Enviado',     data: '2026-05-19', nf: true  },
    { id: 38, clienteId: 1, produtoId: 5, qtd: 1, desconto: 0,  pagamento: 'Cartão de Débito',  status: 'Entregue',    data: '2026-05-18', nf: true  },
    { id: 37, clienteId: 5, produtoId: 1, qtd: 1, desconto: 0,  pagamento: 'PIX',               status: 'Enviado',     data: '2026-05-18', nf: true  },
  ],
  notificacoes: [
    { tipo: 'warn', icone: 'ti-alert-triangle',       msg: 'Batom Matte Ruby com <strong>2 unidades</strong> restantes', tempo: 'Há 10 minutos' },
    { tipo: 'warn', icone: 'ti-calendar-exclamation', msg: '3 produtos vencem nos próximos <strong>30 dias</strong>',    tempo: 'Hoje, 09:15'   },
    { tipo: 'info', icone: 'ti-shopping-cart',        msg: 'Nova venda registrada — <strong>R$ 239,00</strong>',         tempo: 'Hoje, 08:42'   },
  ],
  nextId: { cliente: 6, produto: 8, venda: 43 },
};

const _saved = loadStore();
const Store = {
  clientes:     _saved?.clientes     ?? _defaults.clientes.map(c => ({ ...c })),
  produtos:     _saved?.produtos     ?? _defaults.produtos.map(p => ({ ...p })),
  vendas:       _saved?.vendas       ?? _defaults.vendas.map(v => ({ ...v })),
  notificacoes: _saved?.notificacoes ?? _defaults.notificacoes.map(n => ({ ...n })),
  nextId:       _saved?.nextId       ?? { ..._defaults.nextId },

  _vendasIdx: null,

  getCliente: function(id) { return this.clientes.find(c => c.id === id); },
  getProduto: function(id) { return this.produtos.find(p => p.id === id); },
  getVenda:   function(id) { return this.vendas.find(v => v.id === id); },

  addCliente(c) { c.id = this.nextId.cliente++; this.clientes.push(c);  saveStore(); return c; },
  addProduto(p) { p.id = this.nextId.produto++; this.produtos.push(p);  saveStore(); return p; },
  addVenda(v)   { v.id = this.nextId.venda++;   this.vendas.unshift(v); saveStore(); return v; },

  _buildIdx() {
    this._vendasIdx = new Map();
    for (const v of this.vendas) {
      if (!this._vendasIdx.has(v.clienteId)) this._vendasIdx.set(v.clienteId, []);
      this._vendasIdx.get(v.clienteId).push(v);
    }
  },
  vendasDoCliente(clienteId) {
    if (!this._vendasIdx) this._buildIdx();
    return this._vendasIdx.get(clienteId) ?? [];
  },
  _invalidateIdx() { this._vendasIdx = null; },

  updateEstoque(produtoId, delta) {
    const p = this.getProduto(produtoId);
    if (p) { p.qtd += delta; saveStore(); }
  },

  cancelarVenda(vendaId) {
    const v = this.getVenda(vendaId);
    if (!v || v.status === 'Cancelado') return false;
    v.status = 'Cancelado';
    this.updateEstoque(v.produtoId, v.qtd);
    this._invalidateIdx();
    saveStore();
    return true;
  },

  vendasAtivas()    { return this.vendas.filter(v => v.status !== 'Cancelado'); },
  vendasPendentes() { return this.vendas.filter(v => !v.nf && v.status !== 'Cancelado'); },

  totalHoje() {
    const hoje = todayStr();
    return this.vendas
      .filter(v => v.data === hoje && v.status !== 'Cancelado')
      .reduce((s, v) => s + vendaTotal(v), 0);
  },

  produtosVencendo() {
    const hoje  = new Date(); hoje.setHours(0, 0, 0, 0);
    const fim   = new Date(hoje); fim.setDate(fim.getDate() + 30);
    return this.produtos.filter(p => { const d = new Date(p.validade); return d >= hoje && d <= fim; });
  },

  produtosEstoqueBaixo() { return this.produtos.filter(p => p.qtd <= 5); },

  distribuicaoCategorias() {
    const totais = {};
    let soma = 0;
    for (const v of this.vendas) {
      if (v.status === 'Cancelado') continue;
      const p = this.getProduto(v.produtoId);
      if (!p) continue;
      const val = vendaTotal(v);
      totais[p.categoria] = (totais[p.categoria] ?? 0) + val;
      soma += val;
    }
    if (!soma) return [];
    return Object.entries(totais)
      .map(([cat, val]) => ({ cat, val, pct: Math.round((val / soma) * 100) }))
      .sort((a, b) => b.val - a.val);
  },

  avatarColors: ['c-av-rose','c-av-gold','c-av-teal','c-av-blue','c-av-purple','c-av-red'],
  randomAvatar() { return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)]; },
};

// ─── Utilitários ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function brl(val) {
  const n = Number(val);
  return isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ —';
}

function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function initials(nome) {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map(n => n[0].toUpperCase()).join('') : '?';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86_400_000);
}

function vendaTotal(v) {
  const p = Store.getProduto(v.produtoId);
  return p ? p.preco * v.qtd * (1 - v.desconto / 100) : 0;
}

function clampPct(n) { return Math.max(0, Math.min(100, Number(n) || 0)); }

function badge(status) {
  return `<span class="badge ${BADGE_CLASS[status] ?? 'badge-blue'}">${esc(status)}</span>`;
}

function nfNum(id) { return `NF-${String(id).padStart(4, '0')}`; }

// ─── Toast ────────────────────────────────────────────────────────────────────

function toast(msg, tipo = 'success') {
  const icons = { success: 'ti-circle-check', error: 'ti-circle-x', info: 'ti-info-circle' };
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = `<i class="ti ${icons[tipo] ?? icons.info}"></i><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3200);
}

// ─── Modais ──────────────────────────────────────────────────────────────────

function openModal(id) {
  $(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(id).classList.remove('open');
  document.body.style.overflow = '';
  const form = $(id).querySelector('form');
  if (form) {
    form.reset();
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  }
}

function confirm(message, onOk) {
  $('confirmMessage').textContent = message;
  openModal('confirmModal');

  const okBtn     = $('btnConfirmOk');
  const cancelBtn = $('btnConfirmCancel');
  const newOk     = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);

  okBtn.replaceWith(newOk);
  cancelBtn.replaceWith(newCancel);

  newOk.addEventListener('click', () => { closeModal('confirmModal'); onOk?.(); }, { once: true });
  newCancel.addEventListener('click', () => closeModal('confirmModal'), { once: true });
}

$$('.form-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
});
$$('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// ─── Produto modal (cadastro + edição) ───────────────────────────────────────

let _editingProduto = null;

function openProdutoModal(produtoId = null) {
  const modal     = $('produtoModal');
  const title     = modal.querySelector('h3');
  const submitBtn = modal.querySelector('button[type="submit"]');

  if (produtoId) {
    const p = Store.getProduto(produtoId);
    if (!p) return;
    _editingProduto = produtoId;
    title.innerHTML     = '<i class="ti ti-bottle"></i> Editar Produto';
    submitBtn.innerHTML = '<i class="ti ti-check"></i> Salvar Alterações';
    $('prodNome').value       = p.nome;
    $('prodCategoria').value  = p.categoria;
    $('prodPreco').value      = p.preco;
    $('prodQtd').value        = p.qtd;
    $('prodValidade').value   = p.validade;
    $('prodFornecedor').value = p.fornecedor ?? '';
  } else {
    _editingProduto = null;
    title.innerHTML     = '<i class="ti ti-bottle"></i> Cadastrar Produto';
    submitBtn.innerHTML = '<i class="ti ti-plus"></i> Cadastrar Produto';
    $('formProduto').reset();
    $('formProduto').querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  }

  openModal('produtoModal');
}

function deleteProduto(id) {
  const p = Store.getProduto(id);
  if (!p) return;

  if (Store.vendas.some(v => v.produtoId === id && v.status !== 'Cancelado')) {
    toast(`"${esc(p.nome)}" possui vendas ativas e não pode ser excluído.`, 'error');
    return;
  }

  confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`, () => {
    Store.produtos.splice(Store.produtos.findIndex(x => x.id === id), 1);
    saveStore();
    toast(`"${esc(p.nome)}" excluído.`);
    populateSelects();
    refreshCurrentPage(['produtos', 'estoque', 'dashboard']);
  });
}

// ─── Validação ───────────────────────────────────────────────────────────────

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(input => {
    const empty = !input.value.trim();
    input.closest('.form-group')?.classList.toggle('has-error', empty);
    if (empty) valid = false;
  });
  return valid;
}

// ─── Selects dos modais ──────────────────────────────────────────────────────

function makeSelect(sel, items, placeholder, itemFn) {
  if (!sel) return;
  const frag = document.createDocumentFragment();
  const ph   = document.createElement('option');
  ph.value = ''; ph.textContent = placeholder;
  frag.appendChild(ph);
  items.forEach(item => {
    const opt = document.createElement('option');
    const [val, text] = itemFn(item);
    opt.value = val; opt.textContent = text;
    frag.appendChild(opt);
  });
  sel.innerHTML = '';
  sel.appendChild(frag);
}

function populateSelects() {
  const prevCliente = $('vendaCliente')?.value;

  makeSelect($('vendaCliente'), Store.clientes, 'Selecione um cliente',
    c => [c.id, c.nome]);

  if (prevCliente) $('vendaCliente').value = prevCliente;

  ['vendaProduto', 'entProduto'].forEach(id =>
    makeSelect($(id), Store.produtos, 'Selecione um produto',
      p => [p.id, `${p.nome} — ${brl(p.preco)}`]));

  makeSelect($('nfVenda'), Store.vendasPendentes(), 'Selecione a venda', v => {
    const c = Store.getCliente(v.clienteId);
    const p = Store.getProduto(v.produtoId);
    return [v.id, `#${String(v.id).padStart(4,'0')} — ${c?.nome ?? '?'} — ${p?.nome ?? '?'}`];
  });
}

// ─── Notificações ────────────────────────────────────────────────────────────

function renderNotificacoes() {
  const list = $('notifList');
  const dot  = $('notifDot');
  if (!list) return;

  if (!Store.notificacoes.length) {
    list.innerHTML = '<div class="notif-empty"><i class="ti ti-bell-off"></i>Nenhuma notificação</div>';
    dot?.classList.add('hidden');
    return;
  }

  dot?.classList.remove('hidden');
  list.innerHTML = Store.notificacoes.map(n => `
    <div class="notif-item ${esc(n.tipo)}">
      <i class="ti ${esc(n.icone)}"></i>
      <div>
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-time">${esc(n.tempo)}</div>
      </div>
    </div>`).join('');
}

$('notifBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('notifPanel').classList.toggle('open');
});

$('clearNotifs').addEventListener('click', () => {
  Store.notificacoes = [];
  saveStore();
  renderNotificacoes();
  toast('Notificações limpas', 'info');
});

document.addEventListener('click', e => {
  if (!e.target.closest('#notifPanel, #notifBtn')) $('notifPanel').classList.remove('open');
});

// ─── Busca ───────────────────────────────────────────────────────────────────

const searchInput   = $('searchInput');
const searchResults = $('searchResults');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) { searchResults.classList.remove('open'); return; }

  const results = [
    ...Store.clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 3)
      .map(c => ({ tipo: 'Cliente', texto: c.nome, icone: 'ti-user', page: 'clientes' })),
    ...Store.produtos.filter(p => p.nome.toLowerCase().includes(q)).slice(0, 3)
      .map(p => ({ tipo: 'Produto', texto: `${p.nome} — ${brl(p.preco)}`, icone: 'ti-bottle', page: 'produtos' })),
  ];

  if (!results.length) {
    searchResults.innerHTML = '<div class="search-result-item"><i class="ti ti-search"></i> Nenhum resultado encontrado</div>';
  } else {
    searchResults.innerHTML = results.map(r => `
      <div class="search-result-item" data-page="${esc(r.page)}">
        <i class="ti ${esc(r.icone)}"></i>${esc(r.texto)}
        <span class="sr-type">${esc(r.tipo)}</span>
      </div>`).join('');

    searchResults.querySelectorAll('[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        navigateTo(item.dataset.page);
        searchResults.classList.remove('open');
        searchInput.value = '';
      });
    });
  }

  searchResults.classList.add('open');
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.classList.remove('open');
});

// ─── Navegação ───────────────────────────────────────────────────────────────

let currentPage = 'dashboard';

function navigateTo(page) {
  currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');

  const content = $('mainContent');
  content.innerHTML = '';
  content.style.animation = 'none';
  requestAnimationFrame(() => {
    content.style.animation = '';
    if (pages[page]) pages[page]();
    else content.innerHTML = '<div class="empty-state"><i class="ti ti-construction"></i><p>Página em desenvolvimento</p></div>';
  });

  if (PAGES_WITH_SELECTS.has(page)) populateSelects();
}

function refreshCurrentPage(accepts) {
  if (accepts.includes(currentPage)) pages[currentPage]();
}

$$('.nav-item').forEach(el => el.addEventListener('click', () => navigateTo(el.dataset.page)));

// ─── Builders ────────────────────────────────────────────────────────────────

function buildProductCard(p) {
  const low = p.qtd <= 5;
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-actions">
        <button class="product-action-btn edit"   data-id="${p.id}" title="Editar"><i class="ti ti-pencil"></i></button>
        <button class="product-action-btn delete" data-id="${p.id}" title="Excluir"><i class="ti ti-trash"></i></button>
      </div>
      <div class="product-emoji">${p.emoji ?? '📦'}</div>
      <div class="product-name">${esc(p.nome)}</div>
      <div class="product-cat">${esc(p.categoria)}</div>
      <div class="product-price">${brl(p.preco)}</div>
      <div class="product-stock ${low ? 'low' : ''}">
        ${low ? '⚠ ' : ''}Estoque: ${p.qtd} un. | Val: ${fmtDate(p.validade)}
      </div>
    </div>`;
}

function buildDonut() {
  const dist = Store.distribuicaoCategorias();

  if (!dist.length) return `
    <svg class="donut-svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="55" fill="none" stroke="#f0e8ec" stroke-width="22"/>
      <text x="80" y="84" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="11" fill="#aa98a0">Sem dados</text>
    </svg>`;

  const C = 2 * Math.PI * 55;
  let offset = 0;
  const arcs = dist.map((item, i) => {
    const len = (item.pct / 100) * C;
    const arc = `<circle cx="80" cy="80" r="55" fill="none" stroke="${DONUT_CORES[i % DONUT_CORES.length]}"
      stroke-width="22" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"
      stroke-dashoffset="${(-offset).toFixed(1)}" stroke-linecap="round"/>`;
    offset += len;
    return arc;
  });

  return `
    <svg class="donut-svg" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="55" fill="none" stroke="#f0e8ec" stroke-width="22"/>
      ${arcs.join('')}
      <text x="80" y="76" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="22" font-weight="700" fill="#1f1418">${dist[0].pct}%</text>
      <text x="80" y="94" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="10" fill="#aa98a0">${dist[0].cat.toLowerCase()}</text>
    </svg>`;
}

function buildDonutLegend() {
  const dist = Store.distribuicaoCategorias();
  if (!dist.length) return '<div style="font-size:12px;color:var(--text-light);text-align:center;padding:8px 0;">Nenhuma venda registrada</div>';
  return dist.map((item, i) => `
    <div class="legend-item">
      <div class="legend-left"><div class="legend-dot" style="background:${DONUT_CORES[i % DONUT_CORES.length]}"></div>${esc(item.cat)}</div>
      <span class="legend-pct" style="color:${DONUT_CORES[i % DONUT_CORES.length]}">${item.pct}%</span>
    </div>`).join('');
}

function buildBarChart() {
  const now  = new Date();
  const meses = [], vals = [];

  for (let i = 7; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
    meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
    vals.push(
      Store.vendas
        .filter(v => v.status !== 'Cancelado' && v.data?.startsWith(key))
        .reduce((s, v) => s + vendaTotal(v), 0)
    );
  }

  const max  = Math.max(...vals, 1);
  const barW = 50, gap = 25, h = 160;
  const svgW = vals.length * (barW + gap);

  const bars = vals.map((v, i) => {
    const bh = Math.round((v / max) * h);
    const x  = i * (barW + gap) + 10;
    const y  = h - bh;
    const last = i === vals.length - 1;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${last ? '#4E0C1C' : '#c5a059'}" rx="4" opacity="${last ? 1 : 0.5}"/>
      <text x="${x + barW / 2}" y="${h + 16}" text-anchor="middle" font-family="Plus Jakarta Sans" font-size="11"
        fill="${last ? '#4E0C1C' : '#aa98a0'}" font-weight="${last ? '600' : '400'}">${meses[i]}</text>
      ${v > 0 || last ? `<text x="${x + barW / 2}" y="${Math.max(y - 6, 12)}" text-anchor="middle"
        font-family="Plus Jakarta Sans" font-size="10" fill="#4E0C1C" font-weight="600">${brl(v).replace('R$\u00a0', 'R$')}</text>` : ''}`;
  }).join('');

  return `<svg viewBox="0 0 ${svgW} ${h + 24}" style="width:100%;height:auto;">${bars}</svg>`;
}

function buildTopProdutos() {
  const contagem = {};
  Store.vendas.filter(v => v.status !== 'Cancelado').forEach(v => {
    contagem[v.produtoId] = (contagem[v.produtoId] ?? 0) + v.qtd;
  });

  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qtdVendida]) => {
      const p = Store.getProduto(Number(id));
      return p ? `
        <tr>
          <td>${p.emoji ?? '📦'} ${esc(p.nome)}</td>
          <td style="color:var(--text-mid)">${esc(p.categoria)}</td>
          <td class="value-cell">${qtdVendida} un.</td>
          <td class="value-cell">${brl(p.preco * qtdVendida)}</td>
        </tr>` : '';
    }).join('');
}

// ─── Páginas ─────────────────────────────────────────────────────────────────

const pages = {

  dashboard() {
    const totalHoje    = Store.totalHoje();
    const vencendo     = Store.produtosVencendo().length;
    const estoqueBaixo = Store.produtosEstoqueBaixo().length;

    $('mainContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-sub"><i class="ti ti-calendar"></i> Visão Geral &bull; ${new Date().getFullYear()}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card rose">
          <div class="kpi-icon-wrap"><i class="ti ti-coin"></i></div>
          <div class="kpi-label">Vendas do Dia</div>
          <div class="kpi-value">${brl(totalHoje)}</div>
          <div class="kpi-trend up"><i class="ti ti-trending-up"></i> Atualizado em tempo real</div>
          <div class="sparkline">
            ${[30,50,40,70,55,80,100].map(h => `<div class="spark-bar" style="height:${h}%"></div>`).join('')}
          </div>
        </div>

        <div class="kpi-card gold">
          <div class="kpi-icon-wrap"><i class="ti ti-calendar-event"></i></div>
          <div class="kpi-label">Próximos ao Vencimento</div>
          <div class="kpi-value">${String(vencendo).padStart(2,'0')}</div>
          <div class="kpi-trend warn"><i class="ti ti-clock"></i> Próximos 30 dias</div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.min(vencendo*12,100)}%"></div></div>
        </div>

        <div class="kpi-card danger">
          <div class="kpi-icon-wrap"><i class="ti ti-alert-triangle"></i></div>
          <div class="kpi-label">Estoque Baixo</div>
          <div class="kpi-value">${String(estoqueBaixo).padStart(2,'0')}</div>
          <div class="kpi-trend down"><i class="ti ti-alert-circle"></i> Produtos com alerta</div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.min(estoqueBaixo*10,100)}%"></div></div>
        </div>

        <div class="kpi-card teal">
          <div class="kpi-icon-wrap"><i class="ti ti-users"></i></div>
          <div class="kpi-label">Clientes Ativos</div>
          <div class="kpi-value">${Store.clientes.length}</div>
          <div class="kpi-trend up"><i class="ti ti-user-plus"></i> Total cadastrado</div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width:75%"></div></div>
        </div>
      </div>

      <div class="lower-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Últimas Vendas</div>
            <span class="card-action" id="verTodasVendas">Ver todas →</span>
          </div>
          <table>
            <thead><tr><th>Cliente</th><th>Produto</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              ${Store.vendas.slice(0, 6).map(v => {
                const c = Store.getCliente(v.clienteId);
                const p = Store.getProduto(v.produtoId);
                return `
                  <tr>
                    <td><div class="client-cell">
                      <div class="client-avatar ${esc(c?.avatar ?? 'c-av-rose')}">${initials(c?.nome)}</div>
                      ${esc(c?.nome ?? '—')}
                    </div></td>
                    <td><span class="product-tag">${esc(p?.nome ?? '—')}</span></td>
                    <td class="value-cell">${brl(vendaTotal(v))}</td>
                    <td>${badge(v.status)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="right-col">
          <div class="card">
            <div class="card-header"><div class="card-title">Vendas por Categoria</div></div>
            <div class="donut-wrap">${buildDonut()}</div>
            <div class="donut-legend">${buildDonutLegend()}</div>
            <div class="quick-actions">
              <button class="qa-btn primary" id="qaNovaVenda"><i class="ti ti-plus"></i> Nova Venda</button>
              <button class="qa-btn" id="qaNovoProduto"><i class="ti ti-bottle"></i> Produto</button>
              <button class="qa-btn" id="qaNovoCliente"><i class="ti ti-user-plus"></i> Cliente</button>
            </div>
          </div>
        </div>
      </div>`;

    $('verTodasVendas').addEventListener('click', () => navigateTo('vendas'));
    $('qaNovaVenda').addEventListener('click', () => openModal('novaVendaModal'));
    $('qaNovoProduto').addEventListener('click', () => openProdutoModal());
    $('qaNovoCliente').addEventListener('click', () => openModal('clienteModal'));
  },

  produtos() {
    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Produtos</div>
          <div class="page-sub"><i class="ti ti-package"></i> ${Store.produtos.length} produtos cadastrados</div>
        </div>
        <button class="btn-primary" id="btnNovoProd"><i class="ti ti-plus"></i> Novo Produto</button>
      </div>
      <div class="product-grid">${Store.produtos.map(buildProductCard).join('')}</div>`;

    $('btnNovoProd').addEventListener('click', () => openProdutoModal());
    $$('.product-action-btn.edit').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); openProdutoModal(Number(btn.dataset.id)); }));
    $$('.product-action-btn.delete').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); deleteProduto(Number(btn.dataset.id)); }));
  },

  clientes() {
    Store._buildIdx();

    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Clientes</div>
          <div class="page-sub"><i class="ti ti-users"></i> ${Store.clientes.length} clientes cadastrados</div>
        </div>
        <button class="btn-primary" id="btnNovoCliente"><i class="ti ti-user-plus"></i> Novo Cliente</button>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Cliente</th><th>Telefone</th><th>Cidade</th><th>Total Compras</th><th>Última Compra</th></tr></thead>
          <tbody>
            ${Store.clientes.map(c => {
              const compras = Store.vendasDoCliente(c.id).filter(v => v.status !== 'Cancelado');
              const total   = compras.reduce((s, v) => s + vendaTotal(v), 0);
              const ultima  = compras[0];
              return `
                <tr>
                  <td><div class="client-cell">
                    <div class="client-avatar ${esc(c.avatar)}">${initials(c.nome)}</div>
                    ${esc(c.nome)}
                  </div></td>
                  <td style="color:var(--text-mid)">${esc(c.tel)}</td>
                  <td style="color:var(--text-mid)">${esc(c.cidade)}</td>
                  <td class="value-cell">${brl(total)}</td>
                  <td>${ultima ? `<span style="color:var(--text-mid);font-size:12px;">${fmtDate(ultima.data)}</span>` : '—'}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    $('btnNovoCliente').addEventListener('click', () => openModal('clienteModal'));
  },

  vendas() {
    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Vendas</div>
          <div class="page-sub"><i class="ti ti-shopping-cart"></i> ${Store.vendas.length} registros</div>
        </div>
        <button class="btn-primary" id="btnNovaVenda"><i class="ti ti-plus"></i> Nova Venda</button>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr><th>Nº</th><th>Cliente</th><th>Produto</th><th>Desconto</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Data</th><th>Ação</th></tr>
          </thead>
          <tbody>
            ${Store.vendas.map(v => {
              const c = Store.getCliente(v.clienteId);
              const p = Store.getProduto(v.produtoId);
              const cancelavel = v.status !== 'Cancelado' && v.status !== 'Entregue';
              return `
                <tr>
                  <td style="color:var(--accent2);font-weight:600;">#${String(v.id).padStart(4,'0')}</td>
                  <td><div class="client-cell">
                    <div class="client-avatar ${esc(c?.avatar ?? 'c-av-rose')}">${initials(c?.nome)}</div>
                    ${esc(c?.nome ?? '—')}
                  </div></td>
                  <td><span class="product-tag">${esc(p?.nome ?? '—')}</span></td>
                  <td style="color:${v.desconto ? 'var(--status-green)' : 'var(--text-light)'}">
                    ${v.desconto ? `-${v.desconto}%` : '—'}
                  </td>
                  <td class="value-cell">${brl(vendaTotal(v))}</td>
                  <td style="color:var(--text-mid);font-size:12px;">${esc(v.pagamento)}</td>
                  <td>${badge(v.status)}</td>
                  <td style="color:var(--text-light);font-size:12px;">${fmtDate(v.data)}</td>
                  <td>${cancelavel
                    ? `<button class="btn-cancelar-venda" data-id="${v.id}" style="font-size:11px;background:none;border:1px solid var(--status-red);color:var(--status-red);padding:3px 8px;border-radius:6px;cursor:pointer;">Cancelar</button>`
                    : '—'}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    $('btnNovaVenda').addEventListener('click', () => openModal('novaVendaModal'));

    $$('.btn-cancelar-venda').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = Number(btn.dataset.id);
        const v   = Store.getVenda(vid);
        if (!v) return;
        const p = Store.getProduto(v.produtoId);
        confirm(
          `Cancelar venda #${String(vid).padStart(4,'0')}? O estoque de "${p?.nome ?? '?'}" será reposto.`,
          () => {
            Store.cancelarVenda(vid);
            toast(`Venda #${String(vid).padStart(4,'0')} cancelada. Estoque reposto.`, 'info');
            pages.vendas();
          }
        );
      });
    });
  },

  estoque() {
    const seen    = new Set();
    const alertas = [...Store.produtosEstoqueBaixo(), ...Store.produtosVencendo()]
      .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Controle de Estoque</div>
          <div class="page-sub"><i class="ti ti-package"></i> ${alertas.length} alertas ativos</div>
        </div>
        <button class="btn-primary" id="btnEntrada"><i class="ti ti-truck-delivery"></i> Entrada de Produto</button>
      </div>
      <div class="lower-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">Todos os Produtos</div></div>
          <table>
            <thead><tr><th>Produto</th><th>Categoria</th><th>Qtd.</th><th>Validade</th><th>Status</th></tr></thead>
            <tbody>
              ${Store.produtos.map(p => {
                const dias     = daysUntil(p.validade);
                const statusE  = p.qtd <= 2 ? 'Crítico' : p.qtd <= 5 ? 'Baixo' : 'OK';
                const qtdColor = p.qtd <= 2 ? 'var(--status-red)' : p.qtd <= 5 ? 'var(--status-orange)' : 'var(--text-dark)';
                const valColor = dias < 0 ? 'var(--status-red)' : dias <= 30 ? 'var(--status-orange)' : 'var(--text-mid)';
                const valLabel = dias < 0 ? `Vencido (${fmtDate(p.validade)})` : fmtDate(p.validade);
                return `
                  <tr>
                    <td>${esc(p.nome)}</td>
                    <td style="color:var(--text-mid)">${esc(p.categoria)}</td>
                    <td style="color:${qtdColor};font-weight:600;">${p.qtd}</td>
                    <td style="color:${valColor};font-size:12px;">${valLabel}</td>
                    <td>${badge(statusE)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="right-col">
          <div class="card">
            <div class="card-header"><div class="card-title">Alertas Críticos</div></div>
            ${!alertas.length
              ? '<div class="empty-state"><i class="ti ti-circle-check"></i><p>Nenhum alerta</p></div>'
              : alertas.map(p => {
                  const critico    = p.qtd <= 2;
                  const dias       = daysUntil(p.validade);
                  const vencendo   = dias >= 0 && dias <= 30;
                  return `
                    <div class="alert-item">
                      <div class="alert-icon ${critico ? '' : 'warn'}">
                        <i class="ti ${critico ? 'ti-alert-triangle' : 'ti-clock-exclamation'}"></i>
                      </div>
                      <div class="alert-info">
                        <div class="alert-name">${esc(p.nome)}</div>
                        <div class="alert-detail">${vencendo ? `Vence em ${dias}d` : 'Estoque baixo'}</div>
                      </div>
                      <div class="alert-qty ${critico ? '' : 'warn'}">${p.qtd} un.</div>
                    </div>`;
                }).join('')}
          </div>
        </div>
      </div>`;

    $('btnEntrada').addEventListener('click', () => openModal('entradaModal'));
  },

  relatorios() {
    const ativas      = Store.vendasAtivas();
    const totalMes    = ativas.reduce((s, v) => s + vendaTotal(v), 0);
    const ticketMedio = totalMes / (ativas.length || 1);
    const canceladas  = Store.vendas.length - ativas.length;

    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Relatórios</div>
          <div class="page-sub"><i class="ti ti-chart-bar"></i> Dados gerenciais</div>
        </div>
        <button class="btn-primary" id="btnExportarPDF"><i class="ti ti-download"></i> Exportar PDF</button>
      </div>

      <div class="report-grid">
        <div class="report-kpi">
          <div class="report-kpi-label">Faturamento Registrado</div>
          <div class="report-kpi-val">${brl(totalMes)}</div>
          <div class="report-kpi-trend"><i class="ti ti-trending-up"></i> ${ativas.length} vendas ativas</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-label">Ticket Médio</div>
          <div class="report-kpi-val">${brl(ticketMedio)}</div>
          <div class="report-kpi-trend"><i class="ti ti-chart-bar"></i> Por venda ativa</div>
        </div>
        <div class="report-kpi">
          <div class="report-kpi-label">Total de Pedidos</div>
          <div class="report-kpi-val">${Store.vendas.length} pedidos</div>
          <div class="report-kpi-trend"><i class="ti ti-trending-up"></i> ${canceladas} cancelados</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Vendas por Período (últimos 8 meses)</div></div>
        <div style="padding:24px 24px 16px;">${buildBarChart()}</div>
      </div>

      <div style="margin-top:20px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Produtos Mais Vendidos</div></div>
          <table>
            <thead><tr><th>Produto</th><th>Categoria</th><th>Qtd. Vendida</th><th>Faturamento</th></tr></thead>
            <tbody>${buildTopProdutos()}</tbody>
          </table>
        </div>
      </div>`;

    $('btnExportarPDF').addEventListener('click', () => toast('Exportação para PDF em desenvolvimento.', 'info'));
  },

  fiscal() {
    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Notas Fiscais</div>
          <div class="page-sub"><i class="ti ti-receipt-2"></i> Emissão e controle</div>
        </div>
        <button class="btn-primary" id="btnEmitirNF"><i class="ti ti-file-plus"></i> Emitir NF</button>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr><th>Nº NF</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Data</th><th>Status</th><th>Ação</th></tr>
          </thead>
          <tbody>
            ${Store.vendas.map(v => {
              const c       = Store.getCliente(v.clienteId);
              const p       = Store.getProduto(v.produtoId);
              const statusNF = v.status === 'Cancelado' ? 'Cancelada' : v.nf ? 'Emitida' : 'Pendente';
              const acao = v.nf
                ? `<span class="download-nf-btn" data-id="${v.id}" style="color:var(--accent2);cursor:pointer;font-size:12px;"><i class="ti ti-download" style="font-size:15px;vertical-align:-2px;"></i> PDF</span>`
                : v.status !== 'Cancelado'
                  ? `<span class="emitir-nf-btn" data-id="${v.id}" style="color:var(--accent2);cursor:pointer;font-size:12px;"><i class="ti ti-send" style="font-size:15px;vertical-align:-2px;"></i> Emitir</span>`
                  : '—';
              return `
                <tr>
                  <td style="color:${v.nf ? 'var(--accent2)' : 'var(--text-light)'};font-weight:600;">
                    ${v.nf ? nfNum(v.id) : '—'}
                  </td>
                  <td>${esc(c?.nome ?? '—')}</td>
                  <td><span class="product-tag">${esc(p?.nome ?? '—')}</span></td>
                  <td class="value-cell">${brl(vendaTotal(v))}</td>
                  <td style="color:var(--text-mid);font-size:12px;">${fmtDate(v.data)}</td>
                  <td>${badge(statusNF)}</td>
                  <td>${acao}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    $('btnEmitirNF').addEventListener('click', () => openModal('nfModal'));

    $$('.emitir-nf-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const venda = Store.getVenda(Number(btn.dataset.id));
        if (!venda) return;
        venda.nf = true;
        saveStore();
        toast(`${nfNum(venda.id)} emitida com sucesso!`);
        pages.fiscal();
      }));

    $$('.download-nf-btn').forEach(btn =>
      btn.addEventListener('click', () =>
        toast(`Download de ${nfNum(Number(btn.dataset.id))} em desenvolvimento.`, 'info')));
  },

  configuracoes() {
    $('mainContent').innerHTML = `
      <div class="section-row">
        <div>
          <div class="section-title">Configurações</div>
          <div class="page-sub"><i class="ti ti-settings"></i> Preferências do sistema</div>
        </div>
      </div>

      <div class="config-section">
        <h4>Dados da Empresa</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Razão Social</label>
            <input type="text" class="form-input" id="cfgRazao" value="VB Cosméticos LTDA">
          </div>
          <div class="form-group">
            <label class="form-label">CNPJ</label>
            <input type="text" class="form-input" id="cfgCnpj" value="00.000.000/0001-00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Responsável</label>
            <input type="text" class="form-input" id="cfgResp" value="Priscilla de Freitas Venturin">
          </div>
          <div class="form-group">
            <label class="form-label">Cidade / UF</label>
            <input type="text" class="form-input" id="cfgCidade" value="Vila Velha / ES">
          </div>
        </div>
        <button class="btn-primary" id="btnSalvarConfig" style="margin-top:8px;">
          <i class="ti ti-device-floppy"></i> Salvar Alterações
        </button>
      </div>

      <div class="config-section">
        <h4>Preferências do Sistema</h4>
        <div class="config-row">
          <label>Alertas de estoque baixo</label>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="config-row">
          <label>Alertas de vencimento</label>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="config-row">
          <label>Notificações por WhatsApp</label>
          <label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label>
        </div>
        <div class="config-row">
          <label>Limite de estoque baixo (unidades)</label>
          <input type="number" class="form-input" value="5" style="width:80px;text-align:center;">
        </div>
      </div>

      <div class="config-section">
        <h4>Dados e Armazenamento</h4>
        <div class="config-row">
          <label>Limpar todos os dados cadastrados</label>
          <button class="btn-secondary" id="btnResetStore" style="font-size:12px;padding:6px 14px;">
            <i class="ti ti-trash"></i> Resetar
          </button>
        </div>
      </div>

      <div class="config-section">
        <h4>Sobre o Sistema</h4>
        <div class="config-row">
          <label>Versão</label>
          <span style="color:var(--text-light);font-size:13px;">1.1.0 — Mai/2026</span>
        </div>
        <div class="config-row">
          <label>Desenvolvido para</label>
          <span style="color:var(--text-light);font-size:13px;">VB Cosméticos — Vila Velha, ES</span>
        </div>
      </div>`;

    $('btnSalvarConfig').addEventListener('click', () => toast('Dados salvos com sucesso!'));
    $('btnResetStore').addEventListener('click', () =>
      confirm('Apagar todos os dados cadastrados? Esta ação não pode ser desfeita.', () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }));
  },
};

// ─── Handlers de formulário ──────────────────────────────────────────────────

$('formVenda').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm($('formVenda'))) return;

  const produtoId = Number($('vendaProduto').value);
  const clienteId = Number($('vendaCliente').value);
  const qtd       = Number($('vendaQtd').value);
  const desconto  = clampPct($('vendaDesconto').value);
  const pagamento = $('vendaPagamento').value;
  const produto   = Store.getProduto(produtoId);

  if (produto?.qtd < qtd) {
    toast(`Estoque insuficiente! Disponível: ${produto.qtd} un.`, 'error');
    return;
  }

  Store.addVenda({ clienteId, produtoId, qtd, desconto, pagamento, status: 'Processando', data: todayStr(), nf: false });
  Store.updateEstoque(produtoId, -qtd);
  Store._invalidateIdx();

  const total = vendaTotal({ produtoId, qtd, desconto });
  closeModal('novaVendaModal');
  toast(`Venda registrada — ${brl(total)}`);
  refreshCurrentPage(['dashboard', 'vendas']);
});

['vendaProduto','vendaQtd','vendaDesconto'].forEach(id => {
  $(id)?.addEventListener('input', () => {
    const total = vendaTotal({
      produtoId: Number($('vendaProduto').value),
      qtd:       Number($('vendaQtd').value) || 1,
      desconto:  clampPct($('vendaDesconto').value),
    });
    $('vendaTotal').innerHTML = `Total: <strong>${brl(total)}</strong>`;
  });
});

$('formProduto').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm($('formProduto'))) return;

  const preco = Number($('prodPreco').value);
  const qtd   = Number($('prodQtd').value);

  if (preco < 0) { toast('Preço não pode ser negativo.', 'error'); return; }
  if (qtd < 0)   { toast('Quantidade não pode ser negativa.', 'error'); return; }

  const cat     = $('prodCategoria').value;
  const prodData = {
    nome:       $('prodNome').value.trim(),
    categoria:  cat,
    preco,
    qtd,
    validade:   $('prodValidade').value,
    fornecedor: $('prodFornecedor').value.trim(),
    emoji:      CAT_EMOJIS[cat] ?? '📦',
  };

  if (_editingProduto) {
    const p = Store.getProduto(_editingProduto);
    if (p) { Object.assign(p, prodData); saveStore(); toast(`"${esc(p.nome)}" atualizado!`); }
    _editingProduto = null;
  } else {
    Store.addProduto(prodData);
    toast(`"${esc(prodData.nome)}" cadastrado!`);
  }

  closeModal('produtoModal');
  populateSelects();
  refreshCurrentPage(['produtos', 'estoque', 'dashboard']);
});

$('formCliente').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm($('formCliente'))) return;

  const nome = $('cliNome').value.trim();
  Store.addCliente({
    nome,
    cpf:    $('cliCpf').value.trim(),
    tel:    $('cliTel').value.trim(),
    email:  $('cliEmail').value.trim(),
    cidade: $('cliCidade').value.trim() || 'Vila Velha',
    estado: $('cliEstado').value,
    avatar: Store.randomAvatar(),
  });
  Store._invalidateIdx();
  closeModal('clienteModal');
  toast(`"${esc(nome)}" cadastrado!`);
  populateSelects();
  if (currentPage === 'clientes') pages.clientes();
});

$('formEntrada').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm($('formEntrada'))) return;

  const produtoId = Number($('entProduto').value);
  if (!produtoId) { toast('Selecione um produto.', 'error'); return; }

  const produto = Store.getProduto(produtoId);
  if (!produto)  { toast('Produto não encontrado.', 'error'); return; }

  const qtd = Number($('entQtd').value);
  Store.updateEstoque(produtoId, qtd);
  if ($('entValidade').value) { produto.validade = $('entValidade').value; saveStore(); }

  closeModal('entradaModal');
  toast(`Entrada de ${qtd} un. de "${esc(produto.nome)}" registrada!`);
  if (currentPage === 'estoque') pages.estoque();
});

$('formNF').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm($('formNF'))) return;

  const vendaId = Number($('nfVenda').value);
  if (!vendaId) { toast('Selecione uma venda.', 'error'); return; }

  const venda = Store.getVenda(vendaId);
  if (venda) { venda.nf = true; saveStore(); }

  closeModal('nfModal');
  toast(`${nfNum(vendaId)} emitida com sucesso!`);
  populateSelects();
  if (currentPage === 'fiscal') pages.fiscal();
});

// ─── Sidebar mobile ──────────────────────────────────────────────────────────

$('hamburgerBtn').addEventListener('click', () => {
  $('sidebar').classList.toggle('open');
  $('sidebarOverlay').classList.toggle('open');
});

$('sidebarOverlay').addEventListener('click', () => {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
});

// ─── Init ─────────────────────────────────────────────────────────────────────

renderNotificacoes();
populateSelects();
pages.dashboard();