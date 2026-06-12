'use strict';
/* ════════════════════════════════════════════════════════
   VB COSMÉTICOS — app.js
   Shell da aplicação: navegação, páginas, PDV, fiscal,
   formulários, busca global, notificações e a integração
   do Assistente VB (ai.js) com a interface.
════════════════════════════════════════════════════════ */

/* ── atalhos ── */
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function brlCurto(v) {
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + ' mil';
  return fmtBRL(v);
}

/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
function toast(msg, tipo = 'success') {
  const icons = { success: 'circle-check', error: 'circle-x', info: 'info' };
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = `<i data-lucide="${icons[tipo]}"></i><span>${msg}</span>`;
  $('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, 3400);
}

/* ════════════════════════════════════════
   DIÁLOGO DE CONFIRMAÇÃO
════════════════════════════════════════ */
function confirmar(titulo, subtitulo, onConfirm) {
  let overlay = document.getElementById('confirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirmOverlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-icon"><i data-lucide="triangle-alert"></i></div>
        <div class="confirm-body">
          <strong id="confirmTitle"></strong>
          <span id="confirmSub"></span>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary btn-rounded" id="confirmCancel">Cancelar</button>
          <button class="btn btn-danger btn-rounded" id="confirmOk">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('confirmCancel').addEventListener('click', () => { overlay.classList.remove('open'); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  }
  document.getElementById('confirmTitle').textContent = titulo;
  document.getElementById('confirmSub').textContent = subtitulo;
  const okBtn = document.getElementById('confirmOk');
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', () => { overlay.classList.remove('open'); onConfirm(); });
  overlay.classList.add('open');
  if (window.lucide) window.lucide.createIcons({ nodes: [overlay] });
}

/* ════════════════════════════════════════
   MODAIS
════════════════════════════════════════ */
let editandoProdutoId = null;
let editandoClienteId = null;

function abrirModal(id) {
  $(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function fecharModal(id) {
  $(id).classList.remove('open');
  document.body.style.overflow = '';
  const form = $(id).querySelector('form');
  if (form) {
    form.reset();
    form.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));
  }
  if (id === 'produtoModal') editandoProdutoId = null;
  if (id === 'clienteModal') editandoClienteId = null;
}
$$('.modal-overlay').forEach(ov => ov.addEventListener('click', e => { if (e.target === ov) fecharModal(ov.id); }));
$$('[data-close]').forEach(b => b.addEventListener('click', () => fecharModal(b.dataset.close)));

function validarForm(form) {
  let ok = true;
  form.querySelectorAll('[required]').forEach(input => {
    const field = input.closest('.field');
    if (!input.value.trim()) { field && field.classList.add('has-error'); ok = false; }
    else field && field.classList.remove('has-error');
  });
  return ok;
}

/* ════════════════════════════════════════
   APP — estado e navegação
════════════════════════════════════════ */
const App = {
  page: 'dashboard',
  dashView: 'operacional',
  state: {
    produtos: { busca: '', cat: 'Todas' },
    clientes: { busca: '', classe: 'todos', pagina: 1, ordem: 'nome' },
    notas:    { filtro: 'todas', pagina: 1, sel: null },
    validade: { filtro: '90' },
    pdv:      { carrinho: [], clienteId: '', pagamento: 'Pix', cupom: null, busca: '', cat: 'Todas', sucesso: null },
    cfg:      { notifs: { notifValidade: true, notifEstoque: true, notifNFRejeitada: true, notifAniversario: true } },
  },
};

const PAGINAS = {
  dashboard:     { secao: 'Principal',    titulo: 'Dashboard' },
  pdv:           { secao: 'Principal',    titulo: 'PDV / Nova venda' },
  produtos:      { secao: 'Cadastros',    titulo: 'Produtos' },
  clientes:      { secao: 'Cadastros',    titulo: 'Clientes' },
  entradas:      { secao: 'Estoque',      titulo: 'Entrada de produtos' },
  validade:      { secao: 'Estoque',      titulo: 'Controle de validade' },
  notas:         { secao: 'Fiscal',       titulo: 'Notas Fiscais' },
  configuracoes: { secao: 'Sistema',      titulo: 'Configurações' },
};

function navegar(page) {
  App.page = page;
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  $('crumbSection').textContent = PAGINAS[page].secao;
  $('crumbPage').textContent = PAGINAS[page].titulo;
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
  render();
  const c = $('pageContent');
  c.classList.remove('page-enter');
  void c.offsetWidth;
  c.classList.add('page-enter');
  window.scrollTo({ top: 0 });
}

function render() {
  Paginas[App.page]();
  atualizarBadges();
}

function atualizarBadges() {
  $('badgeValidade').textContent = DB.produtosVencendo(90).length;
}

/* ════════════════════════════════════════
   COMPONENTES REUTILIZÁVEIS
════════════════════════════════════════ */
function buildSparkSVG(data) {
  if (!data || data.length < 2) return '';
  const W = 100, H = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 4 - ((v - min) / range) * (H - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastY = (H - 4 - ((data[data.length - 1] - min) / range) * (H - 10)).toFixed(1);
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <polyline points="${pts}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
    <circle cx="${W}" cy="${lastY}" r="3" fill="currentColor" opacity="0.85"/>
  </svg>`;
}

function kpiCard({ label, valor, icone, cor, delta, deltaTipo, nota, featured, sparkline }) {
  const deltaArrow = deltaTipo === 'up' ? '↑' : deltaTipo === 'down' ? '↓' : '';
  return `<div class="kpi-card${featured ? ' featured' : ''}">
    <div class="kpi-head">
      <div class="kpi-icon ${cor}"><i data-lucide="${icone}"></i></div>
      ${delta !== undefined ? `<span class="kpi-delta ${deltaTipo}">${deltaArrow} ${delta}</span>` : ''}
      ${nota ? `<span class="kpi-delta alert">${nota}</span>` : ''}
    </div>
    <div class="kpi-value">${valor}</div>
    <span class="kpi-label">${label}</span>
    ${delta !== undefined ? `<div class="kpi-sub">vs. mês anterior</div>` : ''}
    ${sparkline ? `<div class="kpi-spark">${buildSparkSVG(sparkline)}</div>` : ''}
  </div>`;
}

function badgeStatusNF(status) {
  const map = {
    autorizada:  ['badge-success', 'Autorizada'],
    processando: ['badge-warning', 'Processando'],
    rejeitada:   ['badge-danger',  'Rejeitada'],
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function badgeClasse(classe) {
  if (classe === 'vip') return '<span class="badge badge-vip">★ VIP</span>';
  if (classe === 'cliente') return '<span class="badge badge-success">Cliente</span>';
  return '<span class="badge badge-lead">Lead</span>';
}

function badgeValidade(dias) {
  if (dias < 0) return '<span class="badge badge-danger"><span class="badge-dot"></span>Vencido</span>';
  if (dias <= 30) return `<span class="badge badge-warning">${dias} dias</span>`;
  if (dias <= 90) return `<span class="badge badge-neutral">${dias} dias</span>`;
  return `<span class="badge badge-success">OK</span>`;
}

function nomeCliente(v) {
  if (!v.clienteId) return 'Consumidor';
  const c = DB.cliente(v.clienteId);
  return c ? c.nome : 'Consumidor';
}

function precoHTML(p) {
  if (p.promoDe) {
    return `<span class="promo-de">${fmtBRL(p.promoDe)}</span><strong>${fmtBRL(p.preco)}</strong> <span class="badge badge-discount">-${p.promoPct}%</span>`;
  }
  return `<strong>${fmtBRL(p.preco)}</strong>`;
}

const CAT_ICON = {
  'Perfumaria':      { icon: 'wind',     cls: 'cat-prf' },
  'Maquiagem':       { icon: 'palette',  cls: 'cat-maq' },
  'Skincare':        { icon: 'leaf',     cls: 'cat-skn' },
  'Cabelos & outros':{ icon: 'scissors', cls: 'cat-cab' },
};
function prodThumb(p) {
  const cat = CAT_ICON[p.categoria] || { icon: 'package', cls: 'cat-prf' };
  const iconName = p.icon || cat.icon;
  return `<div class="prod-thumb ${cat.cls}"><i data-lucide="${iconName}"></i></div>`;
}

/* ════════════════════════════════════════
   PÁGINAS
════════════════════════════════════════ */
const Paginas = {

  /* ────────────────────────────────
     DASHBOARD
  ──────────────────────────────── */
  dashboard() {
    const vendasJun = DB.vendasDoMes();
    const receitaJun = DB.receita(vendasJun);
    const vendasMaio10 = DB.vendasNoPeriodo('2026-05-01', '2026-05-10');
    const receitaMaio10 = DB.receita(vendasMaio10);
    const dReceita = receitaMaio10 ? (receitaJun - receitaMaio10) / receitaMaio10 * 100 : 0;
    const dVendas = vendasMaio10.length ? (vendasJun.length - vendasMaio10.length) / vendasMaio10.length * 100 : 0;
    const ticket = vendasJun.length ? receitaJun / vendasJun.length : 0;
    const ticketMaio = vendasMaio10.length ? receitaMaio10 / vendasMaio10.length : 0;
    const dTicket = ticketMaio ? (ticket - ticketMaio) / ticketMaio * 100 : 0;
    const vencendo = DB.produtosVencendo(90);
    const vencendo30 = vencendo.filter(x => x.dias <= 30);

    const fmtDelta = d => `${d >= 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')}%`;
    const sparkData = DB.receitaPorMes().map(s => s.valor);

    const kpis = `<div class="kpi-grid">
      ${kpiCard({ label: 'Receita do mês', valor: fmtBRL(receitaJun).replace(/,\d\d$/, ''), icone: 'circle-dollar-sign', cor: 'blue', delta: fmtDelta(dReceita), deltaTipo: dReceita >= 0 ? 'up' : 'down', featured: true, sparkline: sparkData })}
      ${kpiCard({ label: 'Vendas no mês', valor: fmtNum(vendasJun.length), icone: 'shopping-cart', cor: 'green', delta: fmtDelta(dVendas), deltaTipo: dVendas >= 0 ? 'up' : 'down' })}
      ${kpiCard({ label: 'Ticket médio', valor: fmtBRL(ticket).replace(/,\d\d$/, ''), icone: 'receipt', cor: 'purple', delta: fmtDelta(dTicket), deltaTipo: dTicket >= 0 ? 'up' : 'down' })}
      ${kpiCard({ label: 'Produtos a vencer', valor: vencendo.length, icone: 'triangle-alert', cor: 'amber', nota: `${vencendo30.length} em ≤ 30 dias` })}
    </div>`;

    const toggle = `<div class="seg-toggle">
      <button data-view="operacional" class="${App.dashView === 'operacional' ? 'active' : ''}">Operacional</button>
      <button data-view="visaogeral" class="${App.dashView === 'visaogeral' ? 'active' : ''}">Visão geral</button>
    </div>`;

    const greeting = `<div class="dash-greeting">
      <div class="dash-greeting-text">
        <h1>Olá, Priscilla 👋</h1>
        <p>Resumo da loja · Hoje, 10 de junho de 2026</p>
      </div>
      <div class="dash-quick-actions">
        <button class="quick-action" data-nav="pdv">
          <div class="qa-icon blue"><i data-lucide="shopping-cart"></i></div>
          <span>Nova venda</span>
        </button>
        <button class="quick-action" data-nav="entradas">
          <div class="qa-icon green"><i data-lucide="package-plus"></i></div>
          <span>Entrada</span>
        </button>
        <button class="quick-action" id="qaAssistente">
          <div class="qa-icon amber"><i data-lucide="sparkles"></i></div>
          <span>Assistente IA</span>
        </button>
        <button class="quick-action" data-nav="configuracoes">
          <div class="qa-icon neutral"><i data-lucide="settings-2"></i></div>
          <span>Config.</span>
        </button>
      </div>
      ${toggle}
    </div>`;

    $('pageContent').innerHTML = greeting + kpis +
      (App.dashView === 'operacional' ? this._dashOperacional(vendasJun, vencendo) : this._dashVisaoGeral(vendasJun, receitaJun));

    $$('.seg-toggle button').forEach(b => b.addEventListener('click', () => {
      App.dashView = b.dataset.view;
      this.dashboard();
    }));

    if (App.dashView === 'operacional') this._bindDashOperacional();
    document.querySelectorAll('[data-nav]').forEach(el =>
      el.addEventListener('click', () => navegar(el.dataset.nav)));
  },

  _dashOperacional(vendasJun, vencendo) {
    /* card da IA */
    const insights = AI.insights();
    const aiCard = `<div class="ai-card">
      <div class="ai-card-head">
        <div class="ai-orb"><i data-lucide="sparkles"></i></div>
        <div style="flex:1">
          <strong>Assistente VB <span class="ai-beta">IA · beta</span></strong>
        </div>
      </div>
      <div class="ai-insight"><i data-lucide="lightbulb"></i><span id="aiInsightText">${insights[0] || ''}</span></div>
      <form class="ai-card-form" id="aiCardForm">
        <input type="text" id="aiCardInput" placeholder="Pergunte qualquer coisa…">
        <button type="submit" class="ai-card-send" aria-label="Enviar"><i data-lucide="arrow-up"></i></button>
      </form>
      <div class="ai-card-chips">
        ${AI.sugestoes.slice(0, 3).map(s => `<button class="ai-chip" data-q="${esc(s)}">${esc(s)}</button>`).join('')}
      </div>
    </div>`;

    /* vendas recentes */
    const recentes = [...DB.vendas].sort((a, b) => (a.data + a.hora) < (b.data + b.hora) ? 1 : -1).slice(0, 5);
    const vendasCard = `<div class="card">
      <div class="card-header">
        <div class="card-title">Vendas recentes</div>
        <button class="link-btn" data-nav="notas">Ver notas →</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Venda</th><th>Cliente</th><th>Itens</th><th class="right">Total</th><th>Status NFC-e</th></tr></thead>
        <tbody>${recentes.map(v => `<tr>
          <td class="td-mono">#${String(v.num).padStart(5, '0')}</td>
          <td class="td-bold">${esc(nomeCliente(v))}</td>
          <td class="td-muted">${v.itens.length} ${v.itens.length > 1 ? 'itens' : 'item'}</td>
          <td class="right td-bold">${fmtBRL(totalVenda(v))}</td>
          <td>${badgeStatusNF(v.nf)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;

    /* mais vendidos */
    const top = DB.topProdutos(vendasJun, 5);
    const receitaJun = DB.receita(vendasJun);
    const maisVendidos = `<div class="card">
      <div class="card-header">
        <div class="card-title">Mais vendidos no mês</div>
        <span class="td-muted">Junho / 2026</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Produto</th><th>Categoria</th><th>Vendidos</th><th class="right">Receita</th><th>Participação</th></tr></thead>
        <tbody>${top.map(t => {
          const p = DB.produto(t.produtoId);
          const share = t.receita / receitaJun * 100;
          return `<tr>
            <td><div class="cell-prod">${prodThumb(p)}<strong>${esc(p.nome)}</strong></div></td>
            <td><span class="badge badge-neutral">${p.categoria}</span></td>
            <td class="td-muted">${t.qtd} un.</td>
            <td class="right td-bold">${fmtBRL(t.receita)}</td>
            <td><div class="share-bar"><div class="progress-track"><div class="progress-fill" style="width:${Math.min(share * 4, 100)}%"></div></div><span>${share.toFixed(1).replace('.', ',')}%</span></div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;

    /* validade · atenção */
    const validadeCard = `<div class="card side-card accent-warn">
      <div class="side-head">Validade · atenção <span class="badge badge-warning">${vencendo.length} itens</span></div>
      <div class="side-list">
        ${vencendo.slice(0, 3).map(x => `<div class="side-item">
          <div><strong>${esc(x.p.nome)}</strong><small>${x.p.sku} · Lote ${x.p.lote}</small></div>
          ${badgeValidade(x.dias)}
        </div>`).join('')}
      </div>
      <div class="side-foot"><button class="btn btn-secondary btn-rounded btn-sm btn-block" data-nav="validade">Ver controle de validade</button></div>
    </div>`;

    /* estoque baixo */
    const baixo = DB.estoqueBaixo();
    const estoqueCard = `<div class="card side-card accent-danger">
      <div class="side-head">Estoque baixo <span class="badge badge-danger">${baixo.length} itens</span></div>
      <div class="side-list">
        ${baixo.slice(0, 4).map(p => `<div class="side-item">
          <div><strong>${esc(p.nome)}</strong><small>${p.sku} · mín. ${p.estoqueMin}</small></div>
          <span class="badge ${p.estoque <= 3 ? 'badge-danger' : 'badge-warning'}">${p.estoque} un.</span>
        </div>`).join('')}
      </div>
      <div class="side-foot"><button class="btn btn-secondary btn-rounded btn-sm btn-block" id="dashEntradaBtn">Registrar entrada</button></div>
    </div>`;

    return `<div class="dash-grid">
      <div class="dash-col">${vendasCard}${maisVendidos}</div>
      <div class="dash-col">${validadeCard}${estoqueCard}${aiCard}</div>
    </div>`;
  },

  _bindDashOperacional() {
    const qa = $('qaAssistente');
    if (qa) qa.addEventListener('click', () => abrirAI());

    const form = $('aiCardForm');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const q = $('aiCardInput').value.trim();
      if (!q) { abrirAI(); return; }
      $('aiCardInput').value = '';
      abrirAI(q);
    });
    $$('.ai-chip[data-q]').forEach(ch => ch.addEventListener('click', () => abrirAI(ch.dataset.q)));
    const btn = $('dashEntradaBtn');
    if (btn) btn.addEventListener('click', () => { popularSelectEntrada(); abrirModal('entradaModal'); });

    /* insight rotativo */
    const insights = AI.insights();
    let i = 0;
    clearInterval(App._insightTimer);
    App._insightTimer = setInterval(() => {
      const el = $('aiInsightText');
      if (!el) { clearInterval(App._insightTimer); return; }
      i = (i + 1) % insights.length;
      el.innerHTML = insights[i];
    }, 7000);
  },

  _dashVisaoGeral(vendasJun, receitaJun) {
    /* receita por mês */
    const serie = DB.receitaPorMes();
    const max = Math.max(...serie.map(s => s.valor));
    const barras = `<div class="card">
      <div class="card-header">
        <div class="card-title">Receita por mês<small>Últimos 7 meses · Jun é parcial (até dia 10)</small></div>
        <span class="badge badge-success">↗ ritmo +18% vs maio</span>
      </div>
      <div class="card-body">
        <div class="chart-bars">
          ${serie.map((s, i) => {
            const ultimo = i === serie.length - 1;
            return `<div class="chart-col">
              <div class="chart-bar ${ultimo ? 'partial current' : ''}" style="height:${Math.max(s.valor / max * 100, 4)}%">
                <span class="bar-tip">${brlCurto(s.valor)}</span>
              </div>
              <span class="chart-label ${ultimo ? 'current' : ''}">${s.label}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

    /* donut categorias */
    const cat = DB.vendasPorCategoria(vendasJun);
    const totalUn = Object.values(cat).reduce((a, b) => a + b, 0) || 1;
    const cores = ['#1E9BF0', '#8B5CF6', '#F59E0B', '#10B981'];
    const ordem = Object.entries(cat).sort((a, b) => b[1] - a[1]);
    const C = 2 * Math.PI * 70;
    let off = 0;
    const segs = ordem.map(([nome, qtd], i) => {
      const frac = qtd / totalUn;
      const seg = `<circle cx="85" cy="85" r="70" fill="none" stroke="${cores[i]}" stroke-width="26"
        stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}"/>`;
      off += frac;
      return seg;
    }).join('');
    const donut = `<div class="card">
      <div class="card-header"><div class="card-title">Vendas por categoria<small>Junho · participação na receita</small></div></div>
      <div class="card-body donut-wrap">
        <div class="donut-box">
          <svg width="170" height="170" viewBox="0 0 170 170">${segs}</svg>
          <div class="donut-center"><strong>${fmtNum(vendasJun.length)}</strong><span>vendas</span></div>
        </div>
        <div class="legend">
          ${ordem.map(([nome, qtd], i) => `<div class="legend-item">
            <span class="legend-dot" style="background:${cores[i]}"></span>${nome}
            <b>${Math.round(qtd / totalUn * 100)}%</b>
          </div>`).join('')}
        </div>
      </div>
    </div>`;

    /* top clientes */
    const top = DB.topClientes(4);
    const topClientes = `<div class="card">
      <div class="card-header"><div class="card-title">Top clientes</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
        ${top.map((x, i) => `<div class="side-item">
          <div class="cell-person">
            <div class="avatar av-${x.c.id % 6}">${iniciais(x.c.nome)}</div>
            <div><strong>${esc(x.c.nome)}</strong><small>${x.a.compras} compras</small></div>
          </div>
          <span class="td-bold">${fmtBRL(x.a.gasto).replace(/,\d\d$/, '')}</span>
        </div>`).join('')}
      </div>
    </div>`;

    /* formas de pagamento */
    const pag = DB.pagamentos(vendasJun);
    const ordemPag = [['Crédito', 'credit-card', ''], ['Pix', 'qr-code', 'green'], ['Débito', 'layers', 'purple'], ['Dinheiro', 'banknote', 'amber']];
    const pagamentos = `<div class="card">
      <div class="card-header"><div class="card-title">Formas de pagamento<small>Junho · % das vendas</small></div></div>
      <div class="card-body progress-list">
        ${ordemPag.map(([nome, icone, cor]) => {
          const pct = Math.round((pag[nome] || 0) / vendasJun.length * 100);
          return `<div class="progress-item">
            <div class="progress-top"><span><i data-lucide="${icone}"></i> ${nome}</span><b>${pct}%</b></div>
            <div class="progress-track"><div class="progress-fill ${cor}" style="width:${pct}%"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

    /* metas */
    const pctReceita = Math.min(receitaJun / DB.metas.receita * 100, 100);
    const novos = DB.novosClientesNoMes().length;
    const pctNovos = Math.min(novos / DB.metas.novosClientes * 100, 100);
    const metas = `<div class="card">
      <div class="card-header"><div class="card-title">Metas do mês</div></div>
      <div class="card-body progress-list">
        <div class="progress-item">
          <div class="progress-top"><span>Receita · ${fmtBRL(DB.metas.receita).replace(',00', '')}</span><b>${pctReceita.toFixed(0)}%</b></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pctReceita}%"></div></div>
        </div>
        <div class="progress-item">
          <div class="progress-top"><span>Novos clientes · ${DB.metas.novosClientes}</span><b>${pctNovos.toFixed(0)}%</b></div>
          <div class="progress-track"><div class="progress-fill purple" style="width:${pctNovos}%"></div></div>
        </div>
        <div class="ai-insight" style="margin:4px 0 0"><i data-lucide="lightbulb"></i>
          <span>No ritmo atual, junho fecha em <strong>${brlCurto(receitaJun / 10 * 30)}</strong>.</span>
        </div>
      </div>
    </div>`;

    return `<div class="dash-grid" style="grid-template-columns:1fr 360px">
        <div class="dash-col">${barras}</div>
        <div class="dash-col">${donut}</div>
      </div>
      <div class="grid-3" style="margin-top:16px">${topClientes}${pagamentos}${metas}</div>`;
  },

  /* ────────────────────────────────
     PDV / NOVA VENDA
  ──────────────────────────────── */
  pdv() {
    const st = App.state.pdv;
    const cats = ['Todas', ...DB.categorias];
    const busca = AI.norm(st.busca);
    const produtos = DB.produtos.filter(p =>
      (st.cat === 'Todas' || p.categoria === st.cat) &&
      (!busca || AI.norm(p.nome + ' ' + p.sku).includes(busca)) &&
      diasAte(p.validade) >= 0);

    const grid = produtos.map(p => `<div class="pdv-prod ${p.estoque <= 0 ? 'out' : ''}" data-add="${p.id}">
      ${prodThumb(p)}
      <strong>${esc(p.nome)}</strong>
      <div class="pdv-price">${p.promoDe ? `<span class="promo-de">${fmtBRL(p.promoDe)}</span>` : ''}${fmtBRL(p.preco)}</div>
      <small class="${p.estoque <= p.estoqueMin ? 'low' : ''}">${p.estoque > 0 ? p.estoque + ' em estoque' : 'Sem estoque'}</small>
    </div>`).join('');

    const itensHTML = st.carrinho.length ? st.carrinho.map(item => {
      const p = DB.produto(item.produtoId);
      return `<div class="cart-item">
        ${prodThumb(p)}
        <div class="ci-info"><strong>${esc(p.nome)}</strong><small>${fmtBRL(p.preco)} un.</small></div>
        <div class="qty-stepper">
          <button data-menos="${p.id}">−</button><span>${item.qtd}</span><button data-mais="${p.id}">+</button>
        </div>
        <span class="ci-total">${fmtBRL(p.preco * item.qtd)}</span>
        <button class="ci-remove" data-rm="${p.id}"><i data-lucide="trash-2"></i></button>
      </div>`;
    }).join('') : '<div class="empty-state" style="padding:28px 10px"><i data-lucide="shopping-cart"></i>Clique nos produtos para adicionar</div>';

    const subtotal = st.carrinho.reduce((s, i) => s + DB.produto(i.produtoId).preco * i.qtd, 0);
    const descPct = st.cupom ? st.cupom.pct : 0;
    const desconto = subtotal * descPct / 100;
    const total = subtotal - desconto;

    const clientesOpts = DB.topClientes(30).map(x =>
      `<option value="${x.c.id}" ${String(st.clienteId) === String(x.c.id) ? 'selected' : ''}>${esc(x.c.nome)}</option>`).join('');

    const pagamentos = [['Pix', 'qr-code'], ['Crédito', 'credit-card'], ['Débito', 'layers'], ['Dinheiro', 'banknote']];

    const carrinho = st.sucesso ? this._pdvSucesso(st.sucesso) : `
      <div class="card-header"><div class="card-title">Carrinho <small>${st.carrinho.length} ${st.carrinho.length === 1 ? 'item' : 'itens'}</small></div></div>
      <div class="card-body">
        <div class="field" style="margin-bottom:14px">
          <label>Cliente</label>
          <select id="pdvCliente">
            <option value="">Consumidor (sem cadastro)</option>
            ${clientesOpts}
          </select>
        </div>
        <div class="cart-items">${itensHTML}</div>
        <div class="coupon-row">
          <input class="input-inline" id="pdvCupom" placeholder="Cupom (ex.: VB10VIP)" value="${st.cupom ? st.cupom.codigo : ''}">
          <button class="btn btn-secondary btn-rounded btn-sm" id="pdvAplicarCupom">Aplicar</button>
        </div>
        <div class="pay-options">
          ${pagamentos.map(([nome, icone]) => `<button class="pay-opt ${st.pagamento === nome ? 'active' : ''}" data-pag="${nome}"><i data-lucide="${icone}"></i>${nome}</button>`).join('')}
        </div>
        <div class="cart-summary">
          <div class="row"><span>Subtotal</span><span>${fmtBRL(subtotal)}</span></div>
          ${st.cupom ? `<div class="row discount"><span>Desconto ${st.cupom.codigo} (−${descPct}%)</span><span>−${fmtBRL(desconto)}</span></div>` : ''}
          <div class="row total"><span>Total</span><span>${fmtBRL(total)}</span></div>
        </div>
        <button class="btn btn-primary btn-rounded btn-block" id="pdvFinalizar" style="margin-top:14px" ${st.carrinho.length ? '' : 'disabled'}>
          <i data-lucide="check"></i> Finalizar venda · emitir NFC-e
        </button>
      </div>`;

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">PDV · Nova venda</div>
          <div class="page-sub">Toque nos produtos para montar o carrinho — a NFC-e é emitida ao finalizar</div>
        </div>
      </div>
      <div class="pdv-grid">
        <div>
          <div class="filter-row">
            <input class="input-inline" id="pdvBusca" placeholder="Buscar produto ou SKU…" value="${esc(st.busca)}" style="min-width:220px">
            ${cats.map(c => `<button class="chip ${st.cat === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
          </div>
          <div class="pdv-products">${grid || '<div class="empty-state"><i data-lucide="search-x"></i>Nenhum produto encontrado</div>'}</div>
        </div>
        <div class="card cart">${carrinho}</div>
      </div>`;

    this._bindPDV();
  },

  _pdvSucesso(info) {
    const nota = DB.notaDaVenda(info.vendaId);
    return `<div class="card-body pdv-success">
      <div class="ok-circle"><i data-lucide="check"></i></div>
      <h4>Venda #${String(info.vendaId).padStart(5, '0')} registrada!</h4>
      <p>Total de <strong>${fmtBRL(info.total)}</strong> · ${info.pagamento}<br>
      NFC-e: <span id="pdvNfStatus">${badgeStatusNF(nota ? nota.status : 'processando')}</span></p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary btn-rounded btn-block" id="pdvVerNota"><i data-lucide="file-text"></i> Ver NFC-e</button>
        <button class="btn btn-primary btn-rounded btn-block" id="pdvNovaVenda"><i data-lucide="plus"></i> Nova venda</button>
      </div>
    </div>`;
  },

  _bindPDV() {
    const st = App.state.pdv;
    $$('[data-add]').forEach(el => el.addEventListener('click', () => {
      const id = +el.dataset.add;
      const p = DB.produto(id);
      const item = st.carrinho.find(i => i.produtoId === id);
      const noCarrinho = item ? item.qtd : 0;
      if (noCarrinho >= p.estoque) { toast(`Só há ${p.estoque} un. de "${p.nome}" em estoque.`, 'error'); return; }
      if (item) item.qtd++;
      else st.carrinho.push({ produtoId: id, qtd: 1 });
      this.pdv();
    }));
    $$('[data-mais]').forEach(el => el.addEventListener('click', () => {
      const item = st.carrinho.find(i => i.produtoId === +el.dataset.mais);
      const p = DB.produto(item.produtoId);
      if (item.qtd >= p.estoque) { toast(`Estoque máximo de "${p.nome}" atingido.`, 'error'); return; }
      item.qtd++; this.pdv();
    }));
    $$('[data-menos]').forEach(el => el.addEventListener('click', () => {
      const item = st.carrinho.find(i => i.produtoId === +el.dataset.menos);
      item.qtd--;
      if (item.qtd <= 0) st.carrinho = st.carrinho.filter(i => i !== item);
      this.pdv();
    }));
    $$('[data-rm]').forEach(el => el.addEventListener('click', () => {
      st.carrinho = st.carrinho.filter(i => i.produtoId !== +el.dataset.rm);
      this.pdv();
    }));
    $$('[data-cat]').forEach(el => el.addEventListener('click', () => { st.cat = el.dataset.cat; this.pdv(); }));
    $$('[data-pag]').forEach(el => el.addEventListener('click', () => { st.pagamento = el.dataset.pag; this.pdv(); }));

    const busca = $('pdvBusca');
    if (busca) busca.addEventListener('input', () => {
      st.busca = busca.value;
      clearTimeout(App._pdvTimer);
      App._pdvTimer = setTimeout(() => {
        if (App.page !== 'pdv') return;
        this.pdv();
        const b = $('pdvBusca');
        if (b) { b.focus(); b.setSelectionRange(999, 999); }
      }, 350);
    });

    const sel = $('pdvCliente');
    if (sel) sel.addEventListener('change', () => st.clienteId = sel.value);

    const cupomBtn = $('pdvAplicarCupom');
    if (cupomBtn) cupomBtn.addEventListener('click', e => {
      e.preventDefault();
      const cod = $('pdvCupom').value.trim().toUpperCase();
      if (!cod) { st.cupom = null; this.pdv(); return; }
      if (DB.cupons[cod]) {
        st.cupom = { codigo: cod, pct: DB.cupons[cod] };
        toast(`Cupom ${cod} aplicado: −${DB.cupons[cod]}%`);
      } else {
        st.cupom = null;
        toast('Cupom inválido.', 'error');
      }
      this.pdv();
    });

    const fin = $('pdvFinalizar');
    if (fin) fin.addEventListener('click', () => {
      const itens = st.carrinho.map(i => ({ produtoId: i.produtoId, qtd: i.qtd, preco: DB.produto(i.produtoId).preco }));
      const { venda, nota } = DB.registrarVenda({
        clienteId: st.clienteId ? +st.clienteId : null,
        itens,
        cupom: st.cupom ? st.cupom.codigo : null,
        descontoPct: st.cupom ? st.cupom.pct : 0,
        pagamento: st.pagamento,
      });
      st.sucesso = { vendaId: venda.id, total: totalVenda(venda), pagamento: venda.pagamento };
      st.carrinho = []; st.cupom = null; st.clienteId = '';
      toast(`Venda #${String(venda.id).padStart(5, '0')} registrada — NFC-e em processamento`);
      /* SEFAZ simulada: autoriza em ~2,5s */
      setTimeout(() => {
        DB.autorizarNota(nota);
        const elSt = $('pdvNfStatus');
        if (elSt) elSt.innerHTML = badgeStatusNF('autorizada');
        if (App.page === 'notas') this.notas();
        toast(`NFC-e ${fmtNumeroNF(nota.numero)} autorizada ✓`);
        atualizarNotificacoes();
      }, 2500);
      this.pdv();
    });

    const verNota = $('pdvVerNota');
    if (verNota) verNota.addEventListener('click', () => {
      App.state.notas.sel = App.state.pdv.sucesso.vendaId;
      App.state.notas.filtro = 'todas';
      App.state.notas.pagina = 1;
      navegar('notas');
    });
    const nova = $('pdvNovaVenda');
    if (nova) nova.addEventListener('click', () => { st.sucesso = null; this.pdv(); });
  },

  /* ────────────────────────────────
     PRODUTOS
  ──────────────────────────────── */
  produtos() {
    const st = App.state.produtos;
    const busca = AI.norm(st.busca);
    const lista = DB.produtos.filter(p =>
      (st.cat === 'Todas' || p.categoria === st.cat) &&
      (!busca || AI.norm(p.nome + ' ' + p.sku).includes(busca)));

    const valorEstoque = DB.produtos.reduce((s, p) => s + p.estoque * p.preco, 0);

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Produtos</div>
          <div class="page-sub">${DB.produtos.length} produtos cadastrados · ${fmtBRL(valorEstoque)} em estoque (preço de venda)</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-pill" id="novoProdutoBtn"><i data-lucide="plus"></i> Novo produto</button>
        </div>
      </div>
      <div class="filter-row">
        <div class="search-field-wrap">
          <input class="input-inline" id="prodBusca" placeholder="Buscar por nome ou SKU…" value="${esc(st.busca)}" style="min-width:240px">
          ${st.busca ? `<button class="search-clear" id="prodBuscaClear" title="Limpar busca"><i data-lucide="x"></i></button>` : ''}
        </div>
        ${['Todas', ...DB.categorias].map(c => `<button class="chip ${st.cat === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
        ${(st.busca && st.cat !== 'Todas') ? `<button class="chip chip-clear" id="limparFiltros"><i data-lucide="x"></i> Limpar filtros</button>` : ''}
      </div>
      <div class="card">
        <div class="table-wrap"><table>
          <thead><tr><th>SKU</th><th>Produto</th><th>Categoria</th><th class="right">Preço</th><th>Estoque</th><th>Validade</th><th></th></tr></thead>
          <tbody>
            ${lista.length === 0 ? `<tr><td colspan="7" class="empty-state">
              <i data-lucide="search-x"></i>
              <span>Nenhum produto encontrado${st.busca ? ` para "<strong>${esc(st.busca)}</strong>"` : ''}${st.cat !== 'Todas' ? ` em <strong>${esc(st.cat)}</strong>` : ''}</span>
              <button class="btn btn-secondary btn-rounded btn-sm" id="limparFiltrosEmpty">Limpar filtros</button>
            </td></tr>` : lista.map(p => {
              const dias = diasAte(p.validade);
              return `<tr>
                <td class="td-mono">${p.sku}</td>
                <td><div class="cell-prod">${prodThumb(p)}<div><strong>${esc(p.nome)}</strong><br><small class="td-muted">Lote ${p.lote}</small></div></div></td>
                <td><span class="badge badge-neutral">${p.categoria}</span></td>
                <td class="right">${precoHTML(p)}</td>
                <td>${p.estoque <= p.estoqueMin
                  ? `<span class="badge ${p.estoque <= 3 ? 'badge-danger' : 'badge-warning'}">${p.estoque} un.</span>`
                  : `${p.estoque} un.`}</td>
                <td><span class="td-mono">${fmtData(p.validade)}</span> ${badgeValidade(dias)}</td>
                <td class="right" style="white-space:nowrap">
                  <button class="icon-btn" data-edit="${p.id}" title="Editar" style="width:32px;height:32px;font-size:15px"><i data-lucide="pencil"></i></button>
                  <button class="icon-btn" data-del="${p.id}" title="Excluir" style="width:32px;height:32px;font-size:15px"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
        <div class="table-footer"><span>${lista.length} de ${DB.produtos.length} produto${DB.produtos.length !== 1 ? 's' : ''}</span></div>
      </div>`;

    $('novoProdutoBtn').addEventListener('click', () => abrirModalProduto());
    const busca2 = $('prodBusca');
    busca2.addEventListener('input', () => {
      st.busca = busca2.value;
      clearTimeout(App._prodTimer);
      App._prodTimer = setTimeout(() => {
        if (App.page !== 'produtos') return;
        this.produtos();
        const b = $('prodBusca');
        if (b) { b.focus(); b.setSelectionRange(999, 999); }
      }, 350);
    });
    const clearProd = () => { st.busca = ''; st.cat = 'Todas'; this.produtos(); $('prodBusca') && $('prodBusca').focus(); };
    if ($('prodBuscaClear')) $('prodBuscaClear').addEventListener('click', () => { st.busca = ''; this.produtos(); $('prodBusca') && $('prodBusca').focus(); });
    if ($('limparFiltros')) $('limparFiltros').addEventListener('click', clearProd);
    if ($('limparFiltrosEmpty')) $('limparFiltrosEmpty').addEventListener('click', clearProd);
    $$('[data-cat]').forEach(el => el.addEventListener('click', () => { st.cat = el.dataset.cat; this.produtos(); }));
    $$('[data-edit]').forEach(el => el.addEventListener('click', () => abrirModalProduto(+el.dataset.edit)));
    $$('[data-del]').forEach(el => el.addEventListener('click', () => {
      const p = DB.produto(+el.dataset.del);
      const temVendas = DB.vendas.some(v => v.itens.some(i => i.produtoId === p.id));
      if (temVendas) { toast(`"${p.nome}" tem vendas registradas e não pode ser excluído.`, 'error'); return; }
      confirmar(`Excluir o produto "${p.nome}"?`, 'Esta ação não pode ser desfeita.', () => {
        DB.produtos.splice(DB.produtos.findIndex(x => x.id === p.id), 1);
        toast(`Produto "${p.nome}" excluído.`);
        this.produtos();
      });
    }));
  },

  /* ────────────────────────────────
     CLIENTES
  ──────────────────────────────── */
  clientes() {
    const st = App.state.clientes;
    const busca = AI.norm(st.busca);
    const lista = DB.clientes.filter(c => {
      if (busca && !AI.norm(c.nome).includes(busca)) return false;
      if (st.classe !== 'todos' && DB.classe(c) !== st.classe) return false;
      return true;
    }).sort((a, b) => {
      if (st.ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
      return DB.agg(b.id).gasto - DB.agg(a.id).gasto;
    });

    const POR_PAG = 8;
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAG));
    st.pagina = Math.min(st.pagina, paginas);
    const slice = lista.slice((st.pagina - 1) * POR_PAG, st.pagina * POR_PAG);

    const ativos = DB.clientesAtivosNoMes();

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Clientes</div>
          <div class="page-sub">${fmtNum(DB.clientes.length)} clientes · ${fmtNum(ativos)} ativos este mês</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-pill" id="novoClienteBtn"><i data-lucide="plus"></i> Novo cliente</button>
        </div>
      </div>
      <div class="kpi-grid">
        ${kpiCard({ label: 'Total de clientes', valor: fmtNum(DB.clientes.length), icone: 'users', cor: 'blue' })}
        ${kpiCard({ label: 'Clientes VIP', valor: fmtNum(DB.contagemVIP()), icone: 'star', cor: 'purple' })}
        ${kpiCard({ label: 'Novos no mês', valor: DB.novosClientesNoMes().length, icone: 'user-plus', cor: 'green' })}
        ${kpiCard({ label: 'Aniversariantes hoje', valor: DB.aniversariantesHoje().length, icone: 'cake', cor: 'amber' })}
      </div>
      <div class="filter-row">
        <div class="search-field-wrap">
          <input class="input-inline" id="cliBusca" placeholder="Buscar cliente…" value="${esc(st.busca)}" style="min-width:240px">
          ${st.busca ? `<button class="search-clear" id="cliBuscaClear" title="Limpar busca"><i data-lucide="x"></i></button>` : ''}
        </div>
        ${[['todos', 'Todos'], ['vip', '★ VIP'], ['cliente', 'Clientes'], ['lead', 'Leads']].map(([v, l]) =>
          `<button class="chip ${st.classe === v ? 'active' : ''}" data-classe="${v}">${l}</button>`).join('')}
        ${(st.busca && st.classe !== 'todos') ? `<button class="chip chip-clear" id="limparFiltrosCli"><i data-lucide="x"></i> Limpar filtros</button>` : ''}
      </div>
      <div class="card">
        <div class="table-wrap"><table>
          <thead><tr>
            <th><button class="th-sort ${st.ordem === 'nome' ? 'active' : ''}" data-sort="nome">Cliente ${st.ordem === 'nome' ? '<i data-lucide="arrow-up-a-z"></i>' : ''}</button></th>
            <th>Contato</th><th>Classificação</th><th>Compras</th>
            <th class="right"><button class="th-sort ${st.ordem === 'gasto' ? 'active' : ''}" data-sort="gasto">Total gasto ${st.ordem === 'gasto' ? '<i data-lucide="arrow-down-wide-narrow"></i>' : ''}</button></th>
            <th>Última compra</th><th></th>
          </tr></thead>
          <tbody>
            ${slice.length === 0 ? `<tr><td colspan="7" class="empty-state">
              <i data-lucide="users"></i>
              <span>Nenhum cliente encontrado${st.busca ? ` para "<strong>${esc(st.busca)}</strong>"` : ''}</span>
              <button class="btn btn-secondary btn-rounded btn-sm" id="limparFiltrosCliEmpty">Limpar filtros</button>
            </td></tr>` : slice.map(c => {
              const a = DB.agg(c.id);
              return `<tr>
                <td><div class="cell-person">
                  <div class="avatar av-${c.id % 6}">${iniciais(c.nome)}</div>
                  <div><strong>${esc(c.nome)}</strong><small>${c.cpf ? 'CPF ' + c.cpf : (a.compras ? c.cidade : 'Sem compras')}</small></div>
                </div></td>
                <td class="td-mono">${c.tel}</td>
                <td>${badgeClasse(DB.classe(c))}</td>
                <td class="td-bold">${a.compras}</td>
                <td class="right td-bold">${a.gasto ? fmtBRL(a.gasto) : '—'}</td>
                <td class="td-muted">${a.ultima ? fmtData(a.ultima) : '—'}</td>
                <td class="right"><button class="icon-btn" data-edit="${c.id}" title="Editar" style="width:32px;height:32px;font-size:15px"><i data-lucide="square-pen"></i></button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
        <div class="table-footer">
          <span>${fmtNum(lista.length)} cliente${lista.length !== 1 ? 's' : ''} encontrados</span>
          <div class="pager">
            <button id="pgAnt" ${st.pagina <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
            <span>Página ${st.pagina} de ${fmtNum(paginas)}</span>
            <button id="pgProx" ${st.pagina >= paginas ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
          </div>
        </div>
      </div>`;

    $('novoClienteBtn').addEventListener('click', () => abrirModalCliente());
    const busca2 = $('cliBusca');
    busca2.addEventListener('input', () => {
      st.busca = busca2.value; st.pagina = 1;
      clearTimeout(App._cliTimer);
      App._cliTimer = setTimeout(() => {
        if (App.page !== 'clientes') return;
        this.clientes();
        const b = $('cliBusca');
        if (b) { b.focus(); b.setSelectionRange(999, 999); }
      }, 350);
    });
    const clearCli = () => { st.busca = ''; st.classe = 'todos'; st.pagina = 1; this.clientes(); $('cliBusca') && $('cliBusca').focus(); };
    if ($('cliBuscaClear')) $('cliBuscaClear').addEventListener('click', () => { st.busca = ''; st.pagina = 1; this.clientes(); $('cliBusca') && $('cliBusca').focus(); });
    if ($('limparFiltrosCli')) $('limparFiltrosCli').addEventListener('click', clearCli);
    if ($('limparFiltrosCliEmpty')) $('limparFiltrosCliEmpty').addEventListener('click', clearCli);
    $$('[data-classe]').forEach(el => el.addEventListener('click', () => { st.classe = el.dataset.classe; st.pagina = 1; this.clientes(); }));
    $$('[data-sort]').forEach(el => el.addEventListener('click', () => { st.ordem = el.dataset.sort; st.pagina = 1; this.clientes(); }));
    $('pgAnt').addEventListener('click', () => { st.pagina--; this.clientes(); });
    $('pgProx').addEventListener('click', () => { st.pagina++; this.clientes(); });
    $$('[data-edit]').forEach(el => el.addEventListener('click', () => abrirModalCliente(+el.dataset.edit)));
  },

  /* ────────────────────────────────
     ENTRADA DE PRODUTOS
  ──────────────────────────────── */
  entradas() {
    const mes = DB.entradas.filter(e => e.data >= '2026-05-11');
    const unidades = mes.reduce((s, e) => s + e.qtd, 0);
    const investimento = mes.reduce((s, e) => s + e.qtd * e.custo, 0);

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Entrada de produtos</div>
          <div class="page-sub">Reposição de estoque com lote, validade e nota do fornecedor</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-pill" id="novaEntradaBtn"><i data-lucide="plus"></i> Registrar entrada</button>
        </div>
      </div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
        ${kpiCard({ label: 'Entradas (últimos 30 dias)', valor: mes.length, icone: 'download', cor: 'blue' })}
        ${kpiCard({ label: 'Unidades recebidas', valor: fmtNum(unidades), icone: 'boxes', cor: 'green' })}
        ${kpiCard({ label: 'Investimento em compra', valor: fmtBRL(investimento).replace(/,\d\d$/, ''), icone: 'wallet', cor: 'purple' })}
      </div>
      <div class="card">
        <div class="table-wrap"><table>
          <thead><tr><th>Data</th><th>Produto</th><th>Lote</th><th>Validade</th><th class="right">Qtd.</th><th class="right">Custo un.</th><th>NF fornecedor</th><th>Fornecedor</th></tr></thead>
          <tbody>
            ${DB.entradas.map(e => {
              const p = DB.produto(e.produtoId);
              return `<tr>
                <td class="td-mono">${fmtData(e.data)}</td>
                <td><div class="cell-prod">${p ? prodThumb(p) : '<div class="prod-thumb cat-prf"><i data-lucide="package"></i></div>'}<strong>${p ? esc(p.nome) : '—'}</strong></div></td>
                <td class="td-mono">${e.lote}</td>
                <td class="td-mono">${e.validade ? fmtData(e.validade) : '—'}</td>
                <td class="right td-bold">+${e.qtd}</td>
                <td class="right">${fmtBRL(e.custo)}</td>
                <td class="td-mono">${e.nf}</td>
                <td class="td-muted">${esc(e.fornecedor)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
        <div class="table-footer"><span>${DB.entradas.length} entradas registradas</span></div>
      </div>`;

    $('novaEntradaBtn').addEventListener('click', () => { popularSelectEntrada(); abrirModal('entradaModal'); });
  },

  /* ────────────────────────────────
     CONTROLE DE VALIDADE
  ──────────────────────────────── */
  validade() {
    const st = App.state.validade;
    const todos = DB.produtos.map(p => ({ p, dias: diasAte(p.validade) })).sort((a, b) => a.dias - b.dias);
    const vencidos = todos.filter(x => x.dias < 0);
    const ate30 = todos.filter(x => x.dias >= 0 && x.dias <= 30);
    const ate90 = todos.filter(x => x.dias > 30 && x.dias <= 90);

    let lista = todos;
    if (st.filtro === 'vencidos') lista = vencidos;
    else if (st.filtro === '30') lista = todos.filter(x => x.dias <= 30);
    else if (st.filtro === '90') lista = todos.filter(x => x.dias <= 90);

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Controle de validade</div>
          <div class="page-sub">Acompanhe lotes, antecipe vencimentos e aja antes de perder produto</div>
        </div>
      </div>
      <div class="validity-summary">
        <button class="validity-card expired ${st.filtro === 'vencidos' ? 'active' : ''}" data-filtro="vencidos"><div class="vc-num">${vencidos.length}</div><div class="vc-label">Vencidos — dar baixa imediata</div></button>
        <button class="validity-card near ${st.filtro === '30' ? 'active' : ''}" data-filtro="30"><div class="vc-num">${ate30.length}</div><div class="vc-label">Vencem em ≤ 30 dias — hora da promoção</div></button>
        <button class="validity-card ok ${st.filtro === '90' ? 'active' : ''}" data-filtro="90"><div class="vc-num">${ate90.length}</div><div class="vc-label">Vencem em 31–90 dias — monitorar</div></button>
      </div>
      <div class="filter-row">
        ${[['vencidos', 'Vencidos'], ['30', '≤ 30 dias'], ['90', '≤ 90 dias'], ['todos', 'Todos os produtos']].map(([v, l]) =>
          `<button class="chip ${st.filtro === v ? 'active' : ''}" data-filtro="${v}">${l}</button>`).join('')}
      </div>
      <div class="card">
        <div class="table-wrap"><table>
          <thead><tr><th>Produto</th><th>SKU / Lote</th><th>Validade</th><th>Situação</th><th class="right">Estoque</th><th class="right">Valor em risco</th><th></th></tr></thead>
          <tbody>
            ${lista.map(x => `<tr>
              <td><div class="cell-prod">${prodThumb(x.p)}<strong>${esc(x.p.nome)}</strong></div></td>
              <td class="td-mono">${x.p.sku}<br><span class="td-muted">Lote ${x.p.lote}</span></td>
              <td class="td-mono">${fmtData(x.p.validade)}</td>
              <td>${badgeValidade(x.dias)} ${x.p.promoPct ? `<span class="badge badge-discount">−${x.p.promoPct}%</span>` : ''}</td>
              <td class="right">${x.p.estoque} un.</td>
              <td class="right td-bold">${x.dias <= 90 ? fmtBRL(x.p.estoque * x.p.preco) : '—'}</td>
              <td class="right" style="white-space:nowrap">
                ${x.dias < 0 && x.p.estoque > 0 ? `<button class="btn btn-danger btn-rounded btn-sm" data-baixa="${x.p.id}">Dar baixa</button>` : ''}
                ${x.dias >= 0 && x.dias <= 30 && !x.p.promoPct ? `<button class="btn btn-secondary btn-rounded btn-sm" data-promo="${x.p.id}"><i data-lucide="badge-percent"></i> −20%</button>` : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        <div class="table-footer"><span>${lista.length} ${lista.length === 1 ? 'item' : 'itens'}</span></div>
      </div>`;

    $$('[data-filtro]').forEach(el => el.addEventListener('click', () => {
      st.filtro = el.dataset.filtro === st.filtro ? 'todos' : el.dataset.filtro;
      this.validade();
    }));
    $$('[data-baixa]').forEach(el => el.addEventListener('click', () => {
      const p = DB.produto(+el.dataset.baixa);
      confirmar(`Dar baixa em "${p.nome}"?`, `${p.estoque} unidade${p.estoque !== 1 ? 's' : ''} serão removidas do estoque.`, () => {
        DB.darBaixa(p.id);
        toast(`Baixa registrada: "${p.nome}" zerado no estoque.`);
        this.validade();
        atualizarNotificacoes();
      });
    }));
    $$('[data-promo]').forEach(el => el.addEventListener('click', () => {
      const p = DB.produto(+el.dataset.promo);
      DB.aplicarPromocao(p.id, 20);
      toast(`Promoção aplicada: "${p.nome}" por ${fmtBRL(p.preco)} (−20%).`);
      this.validade();
    }));
  },

  /* ────────────────────────────────
     NOTAS FISCAIS (NFC-e)
  ──────────────────────────────── */
  notas() {
    const st = App.state.notas;
    const notasJun = DB.notas.filter(n => n.data.startsWith('2026-06'));
    const autorizadas = notasJun.filter(n => n.status === 'autorizada').length;

    const ordenadas = [...DB.notas].sort((a, b) => (a.data + a.hora) < (b.data + b.hora) ? 1 : -1);
    const filtradas = st.filtro === 'todas' ? ordenadas : ordenadas.filter(n => n.status === st.filtro);

    const POR_PAG = 9;
    const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAG));
    st.pagina = Math.min(st.pagina, paginas);

    /* se há nota selecionada fora da página atual, leva a página até ela */
    if (st.sel) {
      const idx = filtradas.findIndex(n => n.vendaId === st.sel);
      if (idx >= 0) st.pagina = Math.floor(idx / POR_PAG) + 1;
    }
    const slice = filtradas.slice((st.pagina - 1) * POR_PAG, st.pagina * POR_PAG);
    if (!st.sel && slice.length) st.sel = slice[0].vendaId;

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Notas Fiscais · NFC-e</div>
          <div class="page-sub">${fmtNum(notasJun.length)} emitidas no mês · ${fmtNum(autorizadas)} autorizadas</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-rounded" id="exportXmlBtn"><i data-lucide="download"></i> Exportar XML</button>
        </div>
      </div>
      <div class="filter-row">
        ${[['todas', 'Todas'], ['autorizada', 'Autorizadas'], ['processando', 'Processando'], ['rejeitada', 'Rejeitadas']].map(([v, l]) =>
          `<button class="chip ${st.filtro === v ? 'active' : ''}" data-filtro="${v}">${l}</button>`).join('')}
      </div>
      <div class="notas-grid">
        <div class="card">
          <div class="table-wrap"><table>
            <thead><tr><th>NFC-e</th><th>Venda</th><th>Cliente</th><th class="right">Valor</th><th>Emissão</th><th>Status</th></tr></thead>
            <tbody>
              ${slice.map(n => {
                const v = DB.venda(n.vendaId);
                return `<tr class="clickable ${st.sel === n.vendaId ? 'selected' : ''}" data-sel="${n.vendaId}">
                  <td class="td-mono td-bold">${n.numero ? fmtNumeroNF(n.numero) : '—'}</td>
                  <td class="td-mono">#${String(n.vendaId).padStart(5, '0')}</td>
                  <td class="td-bold">${v ? esc(nomeCliente(v)) : '—'}</td>
                  <td class="right td-bold">${fmtBRL(n.valor)}</td>
                  <td class="td-muted">${fmtDataCurta(n.data)} ${n.hora}</td>
                  <td>${badgeStatusNF(n.status)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table></div>
          <div class="table-footer">
            <span>${fmtNum(filtradas.length)} notas</span>
            <div class="pager">
              <button id="pgAnt" ${st.pagina <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
              <span>Página ${st.pagina} de ${fmtNum(paginas)}</span>
              <button id="pgProx" ${st.pagina >= paginas ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
            </div>
          </div>
        </div>
        <div class="card danfe-card" id="danfePanel">${this._danfeHTML(st.sel)}</div>
      </div>`;

    $$('[data-sel]').forEach(tr => tr.addEventListener('click', () => {
      st.sel = +tr.dataset.sel;
      $$('[data-sel]').forEach(t => t.classList.toggle('selected', +t.dataset.sel === st.sel));
      $('danfePanel').innerHTML = this._danfeHTML(st.sel);
      this._bindDanfe();
    }));
    $$('[data-filtro]').forEach(el => el.addEventListener('click', () => { st.filtro = el.dataset.filtro; st.pagina = 1; st.sel = null; this.notas(); }));
    $('pgAnt').addEventListener('click', () => { st.pagina--; st.sel = null; this.notas(); });
    $('pgProx').addEventListener('click', () => { st.pagina++; st.sel = null; this.notas(); });
    $('exportXmlBtn').addEventListener('click', exportarXML);
    this._bindDanfe();
  },

  _danfeHTML(vendaId) {
    if (!vendaId) return '<div class="danfe-empty"><i data-lucide="file-search"></i>Selecione uma nota para visualizar o DANFE</div>';
    const nota = DB.notaDaVenda(vendaId);
    const v = DB.venda(vendaId);
    if (!nota || !v) return '<div class="danfe-empty"><i data-lucide="file-search"></i>Nota não encontrada</div>';

    const sub = subtotalVenda(v);
    const total = totalVenda(v);
    const desconto = sub - total;

    const statusBadge = badgeStatusNF(nota.status);
    const itens = v.itens.map(i => {
      const p = DB.produto(i.produtoId);
      return `<div class="danfe-row"><span>${i.qtd} ${esc(p ? p.nome : '—')}</span><span>${(i.preco * i.qtd).toFixed(2).replace('.', ',')}</span></div>`;
    }).join('');

    return `
      <div class="danfe-head">
        <strong>Cupom · #${String(v.num).padStart(5, '0')}</strong>
        ${statusBadge}
      </div>
      <div class="danfe">
        <div class="danfe-center">
          <div class="danfe-razao">${DB.empresa.razao}</div>
          <div>CNPJ ${DB.empresa.cnpj}</div>
          <div>${DB.empresa.endereco}</div>
        </div>
        <hr class="danfe-sep">
        <div class="danfe-center">DANFE NFC-e · Doc. Auxiliar</div>
        <hr class="danfe-sep">
        ${itens}
        <hr class="danfe-sep">
        <div class="danfe-row"><span>Subtotal</span><span>${sub.toFixed(2).replace('.', ',')}</span></div>
        ${desconto > 0.001 ? `<div class="danfe-row discount"><span>Desconto ${v.cupom || ''}</span><span>-${desconto.toFixed(2).replace('.', ',')}</span></div>` : ''}
        <div class="danfe-row total"><span>TOTAL R$</span><span>${total.toFixed(2).replace('.', ',')}</span></div>
        <div class="danfe-row"><span>${esc(v.pagamento)}</span><span>${total.toFixed(2).replace('.', ',')}</span></div>
        <hr class="danfe-sep">
        ${nota.status === 'autorizada' ? `
          <div class="danfe-muted">Consulte pela Chave de Acesso em:</div>
          <div class="danfe-muted">www.sefaz.es.gov.br/nfce</div>
          <div class="danfe-muted" style="word-break:break-all">${fmtChave(nota.chave)}</div>
          <div class="danfe-qr"></div>
          <div class="danfe-center danfe-muted">NFC-e nº ${fmtNumeroNF(nota.numero)} · ${fmtData(nota.data)} ${nota.hora}</div>
        ` : nota.status === 'processando' ? `
          <div class="danfe-center danfe-muted">Aguardando autorização da SEFAZ/ES…</div>
        ` : `
          <div class="danfe-center danfe-muted">Documento não autorizado</div>
        `}
      </div>
      ${nota.status === 'rejeitada' ? `
        <div class="danfe-reject"><i data-lucide="circle-alert"></i><div><strong>${esc(nota.motivo || 'Rejeitada pela SEFAZ')}</strong><br>Corrija os dados e reenvie para autorização.</div></div>
        <div class="danfe-foot">
          <button class="btn btn-primary btn-rounded" id="danfeReenviar"><i data-lucide="refresh-cw"></i> Corrigir e reenviar</button>
        </div>
      ` : nota.status === 'processando' ? `
        <div class="danfe-foot">
          <button class="btn btn-secondary btn-rounded" id="danfeAtualizar"><i data-lucide="refresh-cw"></i> Atualizar status</button>
        </div>
      ` : `
        <div class="danfe-foot">
          <button class="btn btn-secondary btn-rounded" id="danfeImprimir"><i data-lucide="printer"></i> Imprimir</button>
          <button class="btn btn-secondary btn-rounded" id="danfeEnviar"><i data-lucide="send"></i> Enviar</button>
        </div>
      `}`;
  },

  /* ────────────────────────────────
     CONFIGURAÇÕES
  ──────────────────────────────── */
  configuracoes() {
    const e = DB.empresa;
    const m = DB.metas;
    const cfg = App.state.cfg;
    const notifs = cfg.notifs;

    const toggleRow = (id, label, desc, checked) => `
      <div class="settings-toggle-row">
        <div class="toggle-label">
          <div>${label}</div>
          <div class="toggle-desc">${desc}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </label>
      </div>`;

    $('pageContent').innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Configurações</div>
          <div class="page-sub">Gerencie dados da loja, metas mensais e preferências do sistema</div>
        </div>
      </div>

      <div class="settings-layout">

        <!-- Perfil da loja -->
        <div class="settings-section card">
          <div class="settings-section-head">
            <div class="settings-section-icon blue"><i data-lucide="store"></i></div>
            <div><strong>Perfil da loja</strong><span>Exibido nas NFC-e e relatórios</span></div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-body">
            <div class="settings-field">
              <label>Razão social / Nome da loja</label>
              <input type="text" id="cfgRazao" value="${esc(e.razao)}">
            </div>
            <div class="settings-field-row">
              <div class="settings-field">
                <label>CNPJ</label>
                <input type="text" id="cfgCnpj" value="${esc(e.cnpj)}" maxlength="18">
              </div>
              <div class="settings-field">
                <label>Regime tributário</label>
                <select id="cfgRegime">
                  <option selected>Simples Nacional</option>
                  <option>Lucro Presumido</option>
                  <option>MEI</option>
                </select>
              </div>
            </div>
            <div class="settings-field">
              <label>Endereço completo</label>
              <input type="text" id="cfgEndereco" value="${esc(e.endereco)}">
            </div>
            <button class="btn btn-primary btn-rounded" id="salvarPerfil">
              <i data-lucide="check"></i> Salvar dados da loja
            </button>
          </div>
        </div>

        <!-- Metas do mês -->
        <div class="settings-section card">
          <div class="settings-section-head">
            <div class="settings-section-icon green"><i data-lucide="target"></i></div>
            <div><strong>Metas do mês</strong><span>Objetivos de Junho 2026</span></div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-body">
            <div class="settings-field">
              <label>Meta de receita (R$)</label>
              <input type="number" id="cfgMetaReceita" value="${m.receita}" min="0" step="100">
            </div>
            <div class="settings-field">
              <label>Meta de novos clientes</label>
              <input type="number" id="cfgMetaClientes" value="${m.novosClientes}" min="0">
            </div>
            <div class="settings-field">
              <label>Alerta de validade (dias de antecedência)</label>
              <input type="number" id="cfgValidadeAlerta" value="90" min="7" max="365">
            </div>
            <button class="btn btn-primary btn-rounded" id="salvarMetas">
              <i data-lucide="check"></i> Salvar metas
            </button>
          </div>
        </div>

        <!-- Alertas e notificações -->
        <div class="settings-section card">
          <div class="settings-section-head">
            <div class="settings-section-icon amber"><i data-lucide="bell"></i></div>
            <div><strong>Alertas e notificações</strong><span>Controle o que aparece no sino</span></div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-body">
            ${toggleRow('notifValidade',    'Validade próxima',             'Produtos vencendo em ≤ 90 dias',         notifs.notifValidade)}
            ${toggleRow('notifEstoque',     'Estoque abaixo do mínimo',     'Quando um produto chega ao estoque mín.', notifs.notifEstoque)}
            ${toggleRow('notifNFRejeitada', 'NFC-e rejeitada pela SEFAZ',   'Nota fiscal não autorizada',              notifs.notifNFRejeitada)}
            ${toggleRow('notifAniversario', 'Aniversariantes do dia',       'Clientes que fazem aniversário hoje',     notifs.notifAniversario)}
          </div>
        </div>

        <!-- Vendedor / Operador -->
        <div class="settings-section card">
          <div class="settings-section-head">
            <div class="settings-section-icon purple"><i data-lucide="user-cog"></i></div>
            <div><strong>Operador ativo</strong><span>Usuário logado no sistema</span></div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-body">
            <div class="settings-field-row">
              <div class="settings-field">
                <label>Nome</label>
                <input type="text" id="cfgNomeOp" value="Priscilla Venturin">
              </div>
              <div class="settings-field">
                <label>Perfil</label>
                <select id="cfgPerfil">
                  <option selected>Proprietária</option>
                  <option>Gerente</option>
                  <option>Vendedor</option>
                </select>
              </div>
            </div>
            <button class="btn btn-secondary btn-rounded" id="salvarOp">
              <i data-lucide="check"></i> Salvar
            </button>
          </div>
        </div>

        <!-- Sobre — full width -->
        <div class="settings-section card settings-full">
          <div class="settings-section-head">
            <div class="settings-section-icon neutral"><i data-lucide="info"></i></div>
            <div><strong>Sobre o sistema</strong><span>VB Cosméticos · Sistema de Vendas &amp; CRM</span></div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-body">
            <div class="settings-info-grid">
              <div class="settings-info-item">
                <span>Versão</span>
                <strong>1.0.0-beta</strong>
              </div>
              <div class="settings-info-item">
                <span>Módulos ativos</span>
                <strong>PDV · Estoque · CRM · Fiscal · IA</strong>
              </div>
              <div class="settings-info-item">
                <span>SEFAZ / ES</span>
                <strong><span class="settings-status-dot"></span>Conectada (ambiente simulado)</strong>
              </div>
              <div class="settings-info-item">
                <span>Assistente IA</span>
                <strong><span class="settings-status-dot"></span>Online · modo beta</strong>
              </div>
            </div>
          </div>
        </div>

      </div>`;

    /* binds */
    $('salvarPerfil').addEventListener('click', () => {
      const razao = $('cfgRazao').value.trim();
      const cnpj  = $('cfgCnpj').value.trim();
      const end   = $('cfgEndereco').value.trim();
      if (razao) DB.empresa.razao = razao;
      if (cnpj)  DB.empresa.cnpj  = cnpj;
      if (end)   DB.empresa.endereco = end;
      toast('Dados da loja salvos!');
    });

    $('salvarMetas').addEventListener('click', () => {
      const r = parseFloat($('cfgMetaReceita').value);
      const c = parseInt($('cfgMetaClientes').value, 10);
      if (r > 0) DB.metas.receita = r;
      if (c > 0) DB.metas.novosClientes = c;
      toast('Metas atualizadas!');
    });

    $('salvarOp').addEventListener('click', () => toast('Operador atualizado!'));

    /* toggles de notificação */
    ['notifValidade', 'notifEstoque', 'notifNFRejeitada', 'notifAniversario'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', () => {
        cfg.notifs[id] = el.checked;
        atualizarNotificacoes();
      });
    });
  },

  _bindDanfe() {
    const st = App.state.notas;
    const imp = $('danfeImprimir');
    if (imp) imp.addEventListener('click', () => {
      document.body.classList.add('print-danfe');
      window.print();
      setTimeout(() => document.body.classList.remove('print-danfe'), 400);
    });
    const env = $('danfeEnviar');
    if (env) env.addEventListener('click', () => {
      const v = DB.venda(st.sel);
      toast(`Cupom enviado para ${nomeCliente(v)} por WhatsApp (simulação).`, 'info');
    });
    const reenv = $('danfeReenviar');
    if (reenv) reenv.addEventListener('click', () => {
      const nota = DB.notaDaVenda(st.sel);
      nota.status = 'processando';
      const v = DB.venda(st.sel);
      if (v) v.nf = 'processando';
      toast('Nota reenviada à SEFAZ — aguardando autorização…', 'info');
      this.notas();
      setTimeout(() => {
        DB.autorizarNota(nota);
        toast(`NFC-e ${fmtNumeroNF(nota.numero)} autorizada ✓`);
        if (App.page === 'notas') this.notas();
        atualizarNotificacoes();
      }, 2200);
    });
    const atu = $('danfeAtualizar');
    if (atu) atu.addEventListener('click', () => {
      const nota = DB.notaDaVenda(st.sel);
      DB.autorizarNota(nota);
      toast(`NFC-e ${fmtNumeroNF(nota.numero)} autorizada ✓`);
      this.notas();
      atualizarNotificacoes();
    });
  },
};

/* ════════════════════════════════════════
   EXPORTAÇÕES (CSV / XML)
════════════════════════════════════════ */
function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function exportarCSV(nome, headers, rows) {
  const linhas = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))];
  /* ﻿ (BOM) faz o Excel pt-BR abrir o CSV com acentuação correta */
  baixarArquivo(`${nome}.csv`, '﻿' + linhas.join('\r\n'), 'text/csv;charset=utf-8');
}

function exportarXML() {
  const notas = DB.notas.filter(n => n.data.startsWith('2026-06') && n.status === 'autorizada');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<loteNFCe xmlns="http://www.portalfiscal.inf.br/nfe" mes="2026-06" emitente="${DB.empresa.cnpj}">
${notas.map(n => {
  const v = DB.venda(n.vendaId);
  return `  <NFCe>
    <infNFe Id="NFe${n.chave}">
      <ide><nNF>${n.numero}</nNF><dhEmi>${n.data}T${n.hora}:00-03:00</dhEmi></ide>
      <emit><CNPJ>41220118000155</CNPJ><xNome>${DB.empresa.razao}</xNome></emit>
      ${v.itens.map((i, k) => {
        const p = DB.produto(i.produtoId);
        return `<det nItem="${k + 1}"><prod><cProd>${p ? p.sku : ''}</cProd><xProd>${p ? p.nome : ''}</xProd><qCom>${i.qtd}</qCom><vUnCom>${i.preco.toFixed(2)}</vUnCom></prod></det>`;
      }).join('')}
      <total><vNF>${n.valor.toFixed(2)}</vNF></total>
      <pag><tPag>${v.pagamento}</tPag></pag>
    </infNFe>
  </NFCe>`;
}).join('\n')}
</loteNFCe>`;
  baixarArquivo('nfce-junho-2026.xml', xml, 'application/xml');
  toast(`${notas.length} NFC-e exportadas em XML.`);
}

/* ════════════════════════════════════════
   MODAIS — pré-preenchimento e submit
════════════════════════════════════════ */
function abrirModalProduto(id = null) {
  editandoProdutoId = id;
  const titulo = $('produtoModalTitle');
  const submit = $('produtoModalSubmit');
  if (id) {
    const p = DB.produto(id);
    titulo.innerHTML = '<i data-lucide="package"></i> Editar produto';
    submit.innerHTML = '<i data-lucide="check"></i> Salvar alterações';
    $('prodNome').value = p.nome;
    $('prodCategoria').value = p.categoria;
    $('prodPreco').value = p.promoDe || p.preco;
    $('prodEstoque').value = p.estoque;
    $('prodEstoqueMin').value = p.estoqueMin;
    $('prodLote').value = p.lote;
    $('prodValidade').value = p.validade;
  } else {
    titulo.innerHTML = '<i data-lucide="package"></i> Cadastrar produto';
    submit.innerHTML = '<i data-lucide="plus"></i> Cadastrar produto';
  }
  abrirModal('produtoModal');
}

function abrirModalCliente(id = null, prefill = null) {
  editandoClienteId = id;
  const h3 = $('clienteModal').querySelector('h3');
  if (id) {
    const c = DB.cliente(id);
    h3.innerHTML = '<i data-lucide="square-pen"></i> Editar cliente';
    $('cliNome').value = c.nome;
    $('cliTel').value = c.tel;
    $('cliCpf').value = c.cpf || '';
    $('cliEmail').value = c.email || '';
    $('cliNascimento').value = c.nascimento || '';
    $('cliCidade').value = c.cidade;
  } else {
    h3.innerHTML = '<i data-lucide="user-plus"></i> Novo cliente';
    if (prefill) {
      $('cliNome').value = prefill.nome || '';
      $('cliTel').value = prefill.tel || '';
    }
  }
  abrirModal('clienteModal');
}

function popularSelectEntrada(produtoId = null) {
  const sel = $('entProduto');
  sel.innerHTML = '<option value="">Selecione o produto</option>' +
    [...DB.produtos].sort((a, b) => a.nome.localeCompare(b.nome))
      .map(p => `<option value="${p.id}" ${produtoId === p.id ? 'selected' : ''}>${esc(p.nome)} (${p.estoque} un.)</option>`).join('');
  if (produtoId) {
    const p = DB.produto(produtoId);
    $('entCusto').value = p.custo;
    $('entLote').value = p.lote;
  }
}

$('formProduto').addEventListener('submit', e => {
  e.preventDefault();
  if (!validarForm(e.target)) return;
  const dados = {
    nome: $('prodNome').value.trim(),
    categoria: $('prodCategoria').value,
    preco: parseFloat($('prodPreco').value),
    estoque: parseInt($('prodEstoque').value, 10) || 0,
    estoqueMin: parseInt($('prodEstoqueMin').value, 10) || 5,
    lote: $('prodLote').value.trim() || 'L2606',
    validade: $('prodValidade').value,
  };
  if (editandoProdutoId) {
    const p = DB.produto(editandoProdutoId);
    Object.assign(p, dados, { promoDe: null, promoPct: null });
    toast(`Produto "${p.nome}" atualizado.`);
  } else {
    const p = DB.adicionarProduto(dados);
    toast(`Produto "${p.nome}" cadastrado (${p.sku}).`);
  }
  fecharModal('produtoModal');
  if (['produtos', 'validade', 'pdv', 'dashboard'].includes(App.page)) render();
  atualizarNotificacoes();
});

$('formCliente').addEventListener('submit', e => {
  e.preventDefault();
  if (!validarForm(e.target)) return;
  const dados = {
    nome: $('cliNome').value.trim(),
    tel: $('cliTel').value.trim(),
    cpf: $('cliCpf').value.trim() || null,
    email: $('cliEmail').value.trim() || null,
    nascimento: $('cliNascimento').value || null,
    cidade: $('cliCidade').value,
  };
  if (editandoClienteId) {
    Object.assign(DB.cliente(editandoClienteId), dados);
    toast(`Cliente "${dados.nome}" atualizado.`);
  } else {
    DB.adicionarCliente(dados);
    toast(`Cliente "${dados.nome}" cadastrado! 🎉`);
  }
  fecharModal('clienteModal');
  if (App.page === 'clientes') render();
});

$('formEntrada').addEventListener('submit', e => {
  e.preventDefault();
  if (!validarForm(e.target)) return;
  const produtoId = +$('entProduto').value;
  const qtd = parseInt($('entQtd').value, 10);
  DB.registrarEntrada({
    produtoId, qtd,
    custo: parseFloat($('entCusto').value) || undefined,
    lote: $('entLote').value.trim() || undefined,
    validade: $('entValidade').value,
    fornecedor: $('entFornecedor').value.trim() || '—',
    nf: $('entNF').value.trim() || '—',
  });
  const p = DB.produto(produtoId);
  toast(`Entrada registrada: +${qtd} un. de "${p.nome}".`);
  fecharModal('entradaModal');
  if (['entradas', 'produtos', 'validade', 'dashboard', 'pdv'].includes(App.page)) render();
  atualizarNotificacoes();
});

/* ════════════════════════════════════════
   BUSCA GLOBAL
════════════════════════════════════════ */
(function buscaGlobal() {
  const input = $('searchInput');
  const box = $('searchResults');

  function buscar() {
    const q = AI.norm(input.value);
    if (q.length < 2) { box.classList.remove('open'); return; }

    const prods = DB.produtos.filter(p => AI.norm(p.nome + ' ' + p.sku).includes(q)).slice(0, 4);
    const clis = DB.clientes.filter(c => AI.norm(c.nome).includes(q)).slice(0, 4);
    const numQ = q.replace('#', '');
    const vendas = /^\d+$/.test(numQ) ? DB.vendas.filter(v => String(v.num).includes(numQ)).slice(0, 3) : [];

    let html = '';
    if (prods.length) html += `<div class="sr-group">Produtos</div>` + prods.map(p =>
      `<div class="sr-item" data-tipo="produto" data-id="${p.id}"><i data-lucide="package"></i>${esc(p.nome)}<span class="sr-meta">${fmtBRL(p.preco)}</span></div>`).join('');
    if (clis.length) html += `<div class="sr-group">Clientes</div>` + clis.map(c =>
      `<div class="sr-item" data-tipo="cliente" data-id="${c.id}"><i data-lucide="user"></i>${esc(c.nome)}<span class="sr-meta">${c.tel}</span></div>`).join('');
    if (vendas.length) html += `<div class="sr-group">Vendas</div>` + vendas.map(v =>
      `<div class="sr-item" data-tipo="venda" data-id="${v.id}"><i data-lucide="receipt"></i>#${String(v.num).padStart(5, '0')} · ${esc(nomeCliente(v))}<span class="sr-meta">${fmtBRL(totalVenda(v))}</span></div>`).join('');
    box.innerHTML = html || '<div class="sr-empty">Nada encontrado. Tente o Assistente VB ✨</div>';
    box.classList.add('open');

    box.querySelectorAll('.sr-item').forEach(item => item.addEventListener('click', () => {
      const { tipo, id } = item.dataset;
      box.classList.remove('open');
      input.value = '';
      if (tipo === 'produto') {
        App.state.produtos.busca = DB.produto(+id).nome;
        App.state.produtos.cat = 'Todas';
        navegar('produtos');
      } else if (tipo === 'cliente') {
        App.state.clientes.busca = DB.cliente(+id).nome;
        App.state.clientes.classe = 'todos';
        App.state.clientes.pagina = 1;
        navegar('clientes');
      } else {
        App.state.notas.sel = +id;
        App.state.notas.filtro = 'todas';
        navegar('notas');
      }
    }));
  }

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(buscar, 250); });
  input.addEventListener('focus', buscar);
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) box.classList.remove('open');
  });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') box.classList.remove('open'); });
})();

/* ════════════════════════════════════════
   NOTIFICAÇÕES
════════════════════════════════════════ */
function atualizarNotificacoes() {
  const n = App.state.cfg.notifs;
  const itens = [];
  if (n.notifValidade) {
    DB.produtosVencendo(0).forEach(x => {
      if (x.p.estoque > 0) itens.push({ tipo: 'danger', icone: 'calendar-x', msg: `<strong>${esc(x.p.nome)}</strong> está vencido — dar baixa`, meta: `Lote ${x.p.lote}`, page: 'validade' });
    });
    DB.produtosVencendo(30).filter(x => x.dias >= 0).forEach(x => {
      itens.push({ tipo: 'warn', icone: 'calendar-clock', msg: `<strong>${esc(x.p.nome)}</strong> vence em ${x.dias} dias`, meta: fmtData(x.p.validade), page: 'validade' });
    });
  }
  if (n.notifEstoque) {
    DB.estoqueBaixo().slice(0, 3).forEach(p => {
      itens.push({ tipo: 'warn', icone: 'package', msg: `<strong>${esc(p.nome)}</strong> com ${p.estoque} un. (mín. ${p.estoqueMin})`, meta: 'Estoque baixo', page: 'entradas' });
    });
  }
  if (n.notifNFRejeitada) {
    DB.notas.filter(f => f.status === 'rejeitada').slice(0, 3).forEach(nf => {
      itens.push({ tipo: 'danger', icone: 'file-x', msg: `NFC-e da venda <strong>#${String(nf.vendaId).padStart(5, '0')}</strong> rejeitada`, meta: nf.motivo || '', page: 'notas' });
    });
  }
  const aniv = DB.aniversariantesHoje().length;
  if (n.notifAniversario && aniv) itens.push({ tipo: 'info', icone: 'cake', msg: `<strong>${aniv} cliente${aniv > 1 ? 's fazem' : ' faz'} aniversário hoje</strong> 🎂`, meta: 'Envie um cupom!', page: 'clientes' });

  App._notifs = itens;
  $('notifDot').classList.toggle('hidden', !itens.length);
  $('notifList').innerHTML = itens.length
    ? itens.map((n, i) => `<div class="notif-item ${n.tipo}" data-i="${i}" style="cursor:pointer"><i data-lucide="${n.icone}"></i><div>${n.msg}<small>${esc(n.meta)}</small></div></div>`).join('')
    : '<div class="sr-empty">Sem notificações 🎉</div>';

  $('notifList').querySelectorAll('[data-i]').forEach(el => el.addEventListener('click', () => {
    const n = App._notifs[+el.dataset.i];
    $('notifPanel').classList.remove('open');
    if (n.page) navegar(n.page);
  }));
}

$('notifBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('notifPanel').classList.toggle('open');
});
$('clearNotifsBtn').addEventListener('click', () => {
  App._notifs = [];
  $('notifList').innerHTML = '<div class="sr-empty">Sem notificações 🎉</div>';
  $('notifDot').classList.add('hidden');
});
document.addEventListener('click', e => {
  if (!e.target.closest('.notif-panel') && !e.target.closest('#notifBtn')) $('notifPanel').classList.remove('open');
});

/* ════════════════════════════════════════
   ASSISTENTE VB — integração com a UI
════════════════════════════════════════ */
let aiIniciado = false;

function abrirAI(pergunta = null) {
  $('aiDrawer').classList.add('open');
  $('aiOverlay').classList.add('open');
  if (!aiIniciado) {
    aiIniciado = true;
    aiMensagemIA(`<p>Oi, Priscilla! 👋 Sou o <strong>Assistente VB</strong>.</p>
      <p>Me pergunte qualquer coisa sobre os dados da loja — eu monto os filtros, trago a tabela, resumo os padrões e sugiro o próximo passo.</p>`);
    renderAIChips();
  }
  if (pergunta) aiPerguntar(pergunta);
  else setTimeout(() => $('aiInput').focus(), 250);
}

function fecharAI() {
  $('aiDrawer').classList.remove('open');
  $('aiOverlay').classList.remove('open');
}

function aiMensagemUser(texto) {
  const el = document.createElement('div');
  el.className = 'msg msg-user';
  el.textContent = texto;
  $('aiMessages').appendChild(el);
  aiScroll();
}

function aiMensagemIA(html) {
  const el = document.createElement('div');
  el.className = 'msg msg-ai';
  el.innerHTML = html;
  $('aiMessages').appendChild(el);
  aiScroll();
  return el;
}

function aiScroll() {
  const box = $('aiMessages');
  box.scrollTop = box.scrollHeight;
}

function aiPerguntar(texto) {
  aiMensagemUser(texto);
  const typing = aiMensagemIA('<div class="ai-typing"><span></span><span></span><span></span></div>');
  setTimeout(() => {
    const resposta = AI.responder(texto);
    typing.innerHTML = resposta.html;
    aiScroll();
  }, 720);
}

function renderAIChips() {
  $('aiChips').innerHTML = AI.sugestoes.slice(0, 3).map(s =>
    `<button class="ai-chip" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  $('aiChips').querySelectorAll('[data-q]').forEach(ch =>
    ch.addEventListener('click', () => aiPerguntar(ch.dataset.q)));
}

$('aiFab').addEventListener('click', () => abrirAI());
$('aiCloseBtn').addEventListener('click', fecharAI);
$('aiOverlay').addEventListener('click', fecharAI);
$('aiForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('aiInput').value.trim();
  if (!q) return;
  $('aiInput').value = '';
  aiPerguntar(q);
});

/* ações sugeridas pela IA (delegação global) */
document.addEventListener('click', e => {
  const btn = e.target.closest('.ai-action-btn');
  if (!btn) return;
  const { act, arg } = btn.dataset;

  if (act === 'nav') { fecharAI(); navegar(arg); }
  else if (act === 'nav-visao') { fecharAI(); App.dashView = 'visaogeral'; navegar('dashboard'); }
  else if (act === 'nav-notas-rej') { fecharAI(); App.state.notas.filtro = 'rejeitada'; App.state.notas.pagina = 1; App.state.notas.sel = null; navegar('notas'); }
  else if (act === 'csv') {
    const c = AI._ctx.csv;
    if (c) { exportarCSV(c.nome, c.headers, c.rows); toast(`Relatório "${c.nome}.csv" exportado.`); }
  }
  else if (act === 'copiar-whats') {
    copiarTexto(AI._ctx.whats || '');
    toast('Mensagem copiada! Cole no WhatsApp. 📋');
  }
  else if (act === 'promo-vencendo') {
    const alvo = DB.produtosVencendo(30).filter(x => x.dias >= 0 && !x.p.promoPct);
    alvo.forEach(x => DB.aplicarPromocao(x.p.id, 20));
    toast(`Promoção de 20% aplicada em ${alvo.length} produto${alvo.length !== 1 ? 's' : ''}.`);
    aiMensagemIA(`<p>Feito! Apliquei <strong>20% OFF</strong> em ${alvo.length} produto${alvo.length !== 1 ? 's' : ''} que vence${alvo.length === 1 ? '' : 'm'} em ≤30 dias. Os novos preços já valem no PDV. 🏷️</p>`);
    if (['produtos', 'validade', 'pdv'].includes(App.page)) render();
  }
  else if (act === 'entrada') {
    fecharAI();
    popularSelectEntrada(arg ? +arg : null);
    abrirModal('entradaModal');
  }
  else if (act === 'novo-cliente-prefill') {
    fecharAI();
    abrirModalCliente(null, AI._ctx.novoCliente || {});
  }
});

function copiarTexto(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => copiarFallback(txt));
  } else copiarFallback(txt);
}
function copiarFallback(txt) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  ta.remove();
}

/* ════════════════════════════════════════
   SIDEBAR / NAV / INIT
════════════════════════════════════════ */
$$('.nav-item').forEach(item => item.addEventListener('click', () => navegar(item.dataset.page)));
$('novaVendaBtn').addEventListener('click', () => navegar('pdv'));
$('hamburgerBtn').addEventListener('click', () => {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('open');
});
$('sidebarOverlay').addEventListener('click', () => {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
});

atualizarNotificacoes();
navegar('dashboard');
