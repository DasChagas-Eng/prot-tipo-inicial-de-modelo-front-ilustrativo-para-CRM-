'use strict';
/* ════════════════════════════════════════════════════════
   VB COSMÉTICOS — ai.js
   Assistente VB: interface de linguagem natural sobre os
   dados do sistema. Cobre os três momentos do CRM:
     1. ENCONTRAR informação  → monta filtros, gera tabela
     2. REGISTRAR informação  → abre cadastros pré-preenchidos
     3. DECIDIR próxima ação  → resume padrões e sugere ações
   Motor de intenções por regras (sem backend): interpreta
   pt-BR, extrai parâmetros (dias, valores, períodos) e
   responde com blocos estruturados.
════════════════════════════════════════════════════════ */

const AI = {

  /* contexto da última resposta (para exportar CSV, copiar msg etc.) */
  _ctx: {},

  sugestoes: [
    'Clientes que não compram há 90 dias com ticket acima de R$ 100',
    'O que vence nos próximos 30 dias?',
    'Como está a meta de junho?',
    'Top 5 produtos do mês',
    'Quais notas foram rejeitadas?',
    'Aniversariantes de hoje',
  ],

  /* ── helpers ── */
  norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  },

  esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  moeda(s) {
    /* "1.000", "1000", "1.000,50", "1k" → número */
    if (!s) return null;
    s = s.replace(/\s/g, '');
    if (/k$/i.test(s)) return parseFloat(s) * 1000;
    if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, ''));
    return parseFloat(s);
  },

  filtros(arr) {
    return `<div class="ai-filters">${arr.map(f => `<span class="ai-filter-chip">${f}</span>`).join('')}</div>`;
  },

  tabela(headers, rows, nota) {
    const ths = headers.map(h => `<th${h.startsWith('R$') || h === 'Valor' || h === 'Gasto' ? ' class="right"' : ''}>${h}</th>`).join('');
    const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<div class="ai-table-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
      + (nota ? `<p class="td-muted" style="font-size:11.5px">${nota}</p>` : '');
  },

  padroes(items) {
    if (!items.length) return '';
    return `<div class="ai-section-label"><i data-lucide="activity"></i> Padrões identificados</div>
      <ul class="ai-patterns">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  },

  acoes(items) {
    if (!items.length) return '';
    return `<div class="ai-section-label"><i data-lucide="zap"></i> Ações sugeridas</div>
      <div class="ai-actions">${items.map(a =>
        `<button class="ai-action-btn" data-act="${a.act}" data-arg="${a.arg || ''}"><i data-lucide="${a.icon}"></i>${a.label}</button>`
      ).join('')}</div>`;
  },

  guardarCSV(nome, headers, rows) {
    this._ctx.csv = { nome, headers, rows };
  },

  /* ════════════════════════════════════
     ROTEADOR DE INTENÇÕES
  ════════════════════════════════════ */
  responder(pergunta) {
    const q = this.norm(pergunta);
    this._ctx = {};

    if (/cadastr|registr/.test(q) && /\bcliente\b/.test(q))
      { const r = this.iCadastrarCliente(pergunta); if (r) return r; }

    if (/(nao|n)\s?compra|sem compra|inativ|sumid|parad|abandon|perdid/.test(q) && /client/.test(q))
      return this.iClientesInativos(q);

    if (/venc|validade/.test(q)) return this.iVencimentos(q);
    if (/estoque|repor|repos|acabando/.test(q)) return this.iEstoqueBaixo();
    if (/meta/.test(q)) return this.iMeta();
    if (/aniversari/.test(q)) return this.iAniversariantes();
    if (/rejeitad|nota|nfc|nf-e|fiscal/.test(q)) return this.iNotas(q);
    if (/ticket medio/.test(q)) return this.iTicket();
    if (/(top|mais vendid|melhores|campe)/.test(q) && /produt/.test(q)) return this.iTopProdutos(q);
    if (/(top|melhores|vip|quem mais)/.test(q) && /client/.test(q)) return this.iTopClientes();
    if (/receita|faturamento|faturei|vendi|venda/.test(q)) return this.iReceita(q);
    if (/client/.test(q)) return this.iTopClientes();

    return this.iAjuda();
  },

  /* ════════════════════════════════════
     1. ENCONTRAR INFORMAÇÃO
  ════════════════════════════════════ */
  iClientesInativos(q) {
    const mDias  = q.match(/(\d+)\s*(dias|dia|d\b)/);
    const mMeses = q.match(/(\d+)\s*(meses|mes)/);
    const dias   = mDias ? +mDias[1] : (mMeses ? +mMeses[1] * 30 : 90);

    /* valor só conta se vier com R$ explícito ou após palavra-chave
       (ticket/gasto/valor) — evita confundir "mais de 90 dias" com R$ 90 */
    const mValor = q.match(/(?:ticket|gast\w*|valor|compraram)[^\d]{0,24}r?\$?\s*([\d.,]+k?)/)
                || q.match(/r\$\s*([\d.,]+k?)/);
    const valor  = mValor ? this.moeda(mValor[1]) : 0;
    const usaTicket = /ticket/.test(q);

    let lista = DB.clientesInativos(dias, 0)
      .map(x => ({ ...x, ticket: x.a.gasto / x.a.compras }));
    if (valor) lista = lista.filter(x => (usaTicket ? x.ticket : x.a.gasto) >= valor);

    const filtros = [
      `última compra > ${dias} dias`,
      valor ? `${usaTicket ? 'ticket médio' : 'gasto total'} ≥ ${fmtBRL(valor)}` : 'com histórico de compra',
      'ordenado por gasto ↓',
    ];

    if (!lista.length) {
      return {
        html: `<p>Montei o filtro, mas <strong>nenhum cliente</strong> se encaixa nos critérios:</p>
          ${this.filtros(filtros)}
          <p>Tente reduzir o valor mínimo ou o período. Ex.: <em>“clientes sumidos há 60 dias”</em>.</p>`,
      };
    }

    const top = lista.slice(0, 6);
    const rows = top.map(x => [
      `<strong>${this.esc(x.c.nome)}</strong>`,
      `<span class="td-mono">${fmtData(x.a.ultima)}</span>`,
      String(x.a.compras),
      `<span class="td-bold">${fmtBRL(x.a.gasto)}</span>`,
    ]);

    /* padrões */
    const totalAdormecido = lista.reduce((s, x) => s + x.a.gasto, 0);
    const vips = lista.filter(x => DB.classe(x.c) === 'vip').length;
    const cidades = {};
    lista.forEach(x => cidades[x.c.cidade] = (cidades[x.c.cidade] || 0) + 1);
    const topCidade = Object.entries(cidades).sort((a, b) => b[1] - a[1])[0];
    const pags = {};
    DB.vendas.forEach(v => { if (lista.some(x => x.c.id === v.clienteId)) pags[v.pagamento] = (pags[v.pagamento] || 0) + 1; });
    const topPag = Object.entries(pags).sort((a, b) => b[1] - a[1])[0];

    this.guardarCSV(`clientes-inativos-${dias}d`,
      ['Cliente', 'Telefone', 'Última compra', 'Compras', 'Gasto total', 'Ticket médio'],
      lista.map(x => [x.c.nome, x.c.tel, fmtData(x.a.ultima), x.a.compras, x.a.gasto.toFixed(2).replace('.', ','), x.ticket.toFixed(2).replace('.', ',')]));

    this._ctx.whats = `Oi, {nome}! 💙 Sentimos sua falta aqui na VB Cosméticos. ` +
      `Preparamos um mimo pra você voltar: use o cupom VB10VIP e ganhe 10% OFF em qualquer produto. Te esperamos! 🌸`;

    return {
      html: `<p>Encontrei <strong>${lista.length} cliente${lista.length > 1 ? 's' : ''}</strong> com esse perfil:</p>
        ${this.filtros(filtros)}
        ${this.tabela(['Cliente', 'Última compra', 'Compras', 'Gasto'], rows,
          lista.length > 6 ? `Mostrando 6 de ${lista.length} — exporte o CSV para ver todos.` : '')}
        ${this.padroes([
          `Esses clientes já deixaram <strong>${fmtBRL(totalAdormecido)}</strong> na loja — receita “adormecida”.`,
          vips ? `<strong>${vips}</strong> deles ${vips > 1 ? 'são' : 'é'} VIP — prioridade máxima de contato.` : 'Nenhum é VIP — campanha simples já resolve.',
          topCidade ? `A maioria é de <strong>${topCidade[0]}</strong> (${topCidade[1]} cliente${topCidade[1] > 1 ? 's' : ''}).` : '',
          topPag ? `Forma de pagamento preferida: <strong>${topPag[0]}</strong>.` : '',
        ].filter(Boolean))}
        ${this.acoes([
          { icon: 'message-circle', label: 'Copiar mensagem de reativação', act: 'copiar-whats' },
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
          { icon: 'users', label: 'Abrir em Clientes', act: 'nav', arg: 'clientes' },
        ])}`,
    };
  },

  iVencimentos(q) {
    const mDias = q.match(/(\d+)\s*dias/);
    const fimDoMes = /\b(este|esse|do)\s*mes\b/.test(q);
    const horizonte = mDias ? +mDias[1] : (fimDoMes ? diasAte('2026-06-30') : 30);

    const lista = DB.produtosVencendo(horizonte);
    const vencidos = lista.filter(x => x.dias < 0);
    const emRisco = lista.reduce((s, x) => s + x.p.estoque * x.p.preco, 0);

    const rows = lista.slice(0, 6).map(x => [
      `<strong>${x.p.emoji} ${this.esc(x.p.nome)}</strong>`,
      `<span class="td-mono">${fmtData(x.p.validade)}</span>`,
      x.dias < 0
        ? '<span class="badge badge-danger"><span class="badge-dot"></span>Vencido</span>'
        : `<span class="badge ${x.dias <= 30 ? 'badge-warning' : 'badge-neutral'}">${x.dias} dias</span>`,
      `${x.p.estoque} un.`,
    ]);

    this.guardarCSV('produtos-a-vencer',
      ['Produto', 'SKU', 'Lote', 'Validade', 'Dias', 'Estoque', 'Valor em risco'],
      lista.map(x => [x.p.nome, x.p.sku, x.p.lote, fmtData(x.p.validade), x.dias, x.p.estoque, (x.p.estoque * x.p.preco).toFixed(2).replace('.', ',')]));

    if (!lista.length) {
      return { html: `<p>Boa notícia: <strong>nenhum produto</strong> vence nos próximos ${horizonte} dias. 🎉</p>${this.filtros([`validade ≤ ${horizonte} dias`])}` };
    }

    return {
      html: `<p>Encontrei <strong>${lista.length} produto${lista.length > 1 ? 's' : ''}</strong> nesse horizonte:</p>
        ${this.filtros([`validade ≤ ${horizonte} dias`, 'inclui vencidos', 'ordenado por urgência'])}
        ${this.tabela(['Produto', 'Validade', 'Situação', 'Estoque'], rows)}
        ${this.padroes([
          `Há <strong>${fmtBRL(emRisco)}</strong> em estoque nesses itens — esse é o valor em risco.`,
          vencidos.length ? `<strong>${vencidos.length} item já venceu</strong>: dê baixa para não vender por engano.` : 'Nada vencido ainda — dá tempo de agir com promoção.',
          'Queima de estoque com 20% OFF costuma girar itens com validade curta sem zerar a margem.',
        ])}
        ${this.acoes([
          { icon: 'badge-percent', label: 'Aplicar 20% OFF nos que vencem em ≤30 dias', act: 'promo-vencendo' },
          { icon: 'clock', label: 'Abrir controle de validade', act: 'nav', arg: 'validade' },
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
        ])}`,
    };
  },

  iEstoqueBaixo() {
    const lista = DB.estoqueBaixo();
    if (!lista.length) return { html: '<p>Estoque saudável: nenhum produto abaixo do mínimo. ✅</p>' };

    const rows = lista.map(p => [
      `<strong>${p.emoji} ${this.esc(p.nome)}</strong>`,
      `<span class="badge ${p.estoque <= 3 ? 'badge-danger' : 'badge-warning'}">${p.estoque} un.</span>`,
      `${p.estoqueMin} un.`,
      `${Math.max(p.estoqueMin * 2 - p.estoque, p.estoqueMin)} un.`,
    ]);

    this.guardarCSV('estoque-baixo',
      ['Produto', 'SKU', 'Estoque', 'Mínimo', 'Sugestão de compra'],
      lista.map(p => [p.nome, p.sku, p.estoque, p.estoqueMin, Math.max(p.estoqueMin * 2 - p.estoque, p.estoqueMin)]));

    const vendidos30 = DB.topProdutos(DB.vendasNoPeriodo('2026-05-11', '2026-06-10'), 99);

    return {
      html: `<p><strong>${lista.length} produto${lista.length > 1 ? 's' : ''}</strong> abaixo do estoque mínimo:</p>
        ${this.filtros(['estoque ≤ mínimo', 'sugestão = 2× mínimo − atual'])}
        ${this.tabela(['Produto', 'Estoque', 'Mínimo', 'Repor'], rows)}
        ${this.padroes([
          lista.some(p => vendidos30.slice(0, 5).some(t => t.produtoId === p.id))
            ? 'Atenção: há item de <strong>alto giro</strong> na lista — risco de perder venda.'
            : 'Nenhum dos itens é top de vendas — reposição pode aguardar o pedido programado.',
          `Sugestão total de compra: <strong>${lista.reduce((s, p) => s + Math.max(p.estoqueMin * 2 - p.estoque, p.estoqueMin), 0)} unidades</strong>.`,
        ])}
        ${this.acoes([
          { icon: 'download', label: 'Registrar entrada agora', act: 'entrada', arg: String(lista[0].id) },
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
        ])}`,
    };
  },

  iTopProdutos(q) {
    const mN = q.match(/top\s*(\d+)/);
    const n = mN ? Math.min(+mN[1], 10) : 5;
    const semana = /semana/.test(q);
    const vendas = semana ? DB.vendasNoPeriodo('2026-06-04', '2026-06-10') : DB.vendasDoMes();
    const top = DB.topProdutos(vendas, n);
    const receitaTotal = DB.receita(vendas);

    const rows = top.map((t, i) => {
      const p = DB.produto(t.produtoId);
      return [
        `<strong>${i + 1}. ${p.emoji} ${this.esc(p.nome)}</strong>`,
        `${t.qtd} un.`,
        `<span class="td-bold">${fmtBRL(t.receita)}</span>`,
        `${(t.receita / receitaTotal * 100).toFixed(1).replace('.', ',')}%`,
      ];
    });

    this.guardarCSV('top-produtos',
      ['Produto', 'Unidades', 'Receita', 'Participação %'],
      top.map(t => { const p = DB.produto(t.produtoId); return [p.nome, t.qtd, t.receita.toFixed(2).replace('.', ','), (t.receita / receitaTotal * 100).toFixed(1)]; }));

    const cat = {};
    top.forEach(t => { const p = DB.produto(t.produtoId); cat[p.categoria] = (cat[p.categoria] || 0) + t.receita; });
    const topCat = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];

    return {
      html: `<p>Top ${n} produtos ${semana ? 'da última semana' : 'de junho'}:</p>
        ${this.filtros([semana ? 'período: últimos 7 dias' : 'período: junho/2026', `ranking por receita`, `top ${n}`])}
        ${this.tabela(['Produto', 'Vendidos', 'Receita', 'Particip.'], rows)}
        ${this.padroes([
          topCat ? `A categoria <strong>${topCat[0]}</strong> domina o ranking.` : '',
          `Juntos, esses itens representam <strong>${(top.reduce((s, t) => s + t.receita, 0) / receitaTotal * 100).toFixed(0)}%</strong> da receita do período.`,
        ].filter(Boolean))}
        ${this.acoes([
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
          { icon: 'package', label: 'Ver produtos', act: 'nav', arg: 'produtos' },
        ])}`,
    };
  },

  iTopClientes() {
    const top = DB.topClientes(6);
    const rows = top.map((x, i) => [
      `<strong>${i + 1}. ${this.esc(x.c.nome)}</strong>`,
      String(x.a.compras),
      `<span class="td-bold">${fmtBRL(x.a.gasto)}</span>`,
      `<span class="td-mono">${fmtData(x.a.ultima)}</span>`,
    ]);

    this.guardarCSV('top-clientes',
      ['Cliente', 'Telefone', 'Compras', 'Gasto total', 'Última compra'],
      top.map(x => [x.c.nome, x.c.tel, x.a.compras, x.a.gasto.toFixed(2).replace('.', ','), fmtData(x.a.ultima)]));

    return {
      html: `<p>Seus melhores clientes (por gasto acumulado):</p>
        ${this.filtros(['ranking por gasto total', 'top 6'])}
        ${this.tabela(['Cliente', 'Compras', 'Gasto', 'Última'], rows)}
        ${this.padroes([
          `O top 6 soma <strong>${fmtBRL(top.reduce((s, x) => s + x.a.gasto, 0))}</strong> em compras.`,
          'Clientes VIP respondem muito bem a pré-venda exclusiva e brinde no aniversário.',
        ])}
        ${this.acoes([
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
          { icon: 'users', label: 'Abrir em Clientes', act: 'nav', arg: 'clientes' },
        ])}`,
    };
  },

  iReceita(q) {
    let vendas, label, anterior = null, labelAnt = '';
    if (/hoje/.test(q)) {
      vendas = DB.vendasNoPeriodo(HOJE_ISO, HOJE_ISO); label = 'hoje (10/06)';
      anterior = DB.vendasNoPeriodo('2026-06-09', '2026-06-09'); labelAnt = 'ontem';
    } else if (/ontem/.test(q)) {
      vendas = DB.vendasNoPeriodo('2026-06-09', '2026-06-09'); label = 'ontem (09/06)';
      anterior = DB.vendasNoPeriodo('2026-06-08', '2026-06-08'); labelAnt = 'anteontem';
    } else if (/semana/.test(q)) {
      vendas = DB.vendasNoPeriodo('2026-06-04', '2026-06-10'); label = 'últimos 7 dias';
      anterior = DB.vendasNoPeriodo('2026-05-28', '2026-06-03'); labelAnt = 'semana anterior';
    } else if (/maio/.test(q)) {
      vendas = DB.vendasDoMes(2026, 5); label = 'maio/2026';
      anterior = DB.vendasDoMes(2026, 4); labelAnt = 'abril';
    } else {
      vendas = DB.vendasDoMes(); label = 'junho/2026 (até dia 10)';
      anterior = DB.vendasNoPeriodo('2026-05-01', '2026-05-10'); labelAnt = 'mesmo período de maio';
    }

    const r = DB.receita(vendas);
    const rAnt = anterior ? DB.receita(anterior) : 0;
    const delta = rAnt ? ((r - rAnt) / rAnt * 100) : 0;
    const ticket = vendas.length ? r / vendas.length : 0;
    const pag = DB.pagamentos(vendas);
    const topPag = Object.entries(pag).sort((a, b) => b[1] - a[1])[0];

    return {
      html: `<p>Receita de <strong>${label}</strong>:</p>
        ${this.filtros([`período: ${label}`, 'somente vendas concluídas'])}
        ${this.tabela(['Indicador', 'Valor'], [
          ['Receita', `<span class="td-bold">${fmtBRL(r)}</span>`],
          ['Vendas', String(vendas.length)],
          ['Ticket médio', fmtBRL(ticket)],
          [`vs ${labelAnt}`, `<span class="badge ${delta >= 0 ? 'badge-success' : 'badge-danger'}">${delta >= 0 ? '↗ +' : '↘ '}${delta.toFixed(1).replace('.', ',')}%</span>`],
        ])}
        ${this.padroes([
          topPag ? `Pagamento mais usado no período: <strong>${topPag[0]}</strong> (${Math.round(topPag[1] / vendas.length * 100)}% das vendas).` : '',
          delta >= 0 ? 'Tendência positiva — bom momento para impulsionar os itens de maior margem.' : 'Queda vs período anterior — vale ativar os clientes inativos.',
        ].filter(Boolean))}
        ${this.acoes([
          { icon: 'layout-grid', label: 'Ver dashboard completo', act: 'nav', arg: 'dashboard' },
        ])}`,
    };
  },

  iTicket() {
    const vendas = DB.vendasDoMes();
    const r = DB.receita(vendas);
    const ticket = vendas.length ? r / vendas.length : 0;
    const vendasMaio = DB.vendasNoPeriodo('2026-05-01', '2026-05-10');
    const tMaio = vendasMaio.length ? DB.receita(vendasMaio) / vendasMaio.length : 0;
    const delta = tMaio ? (ticket - tMaio) / tMaio * 100 : 0;
    return {
      html: `<p>O ticket médio de junho é <strong>${fmtBRL(ticket)}</strong> (${vendas.length} vendas).</p>
        ${this.padroes([
          `Variação vs mesmo período de maio: <strong>${delta >= 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')}%</strong>.`,
          'Para subir o ticket: sugira um segundo item no caixa (cross-sell) — esmaltes e sabonetes funcionam bem como adição.',
        ])}
        ${this.acoes([{ icon: 'layout-grid', label: 'Ver dashboard', act: 'nav', arg: 'dashboard' }])}`,
    };
  },

  iMeta() {
    const receita = DB.receita(DB.vendasDoMes());
    const meta = DB.metas.receita;
    const pct = receita / meta * 100;
    const diasCorridos = 10, diasNoMes = 30;
    const ritmoDia = receita / diasCorridos;
    const projecao = ritmoDia * diasNoMes;
    const novos = DB.novosClientesNoMes().length;
    const pctNovos = novos / DB.metas.novosClientes * 100;

    return {
      html: `<p>Acompanhamento das metas de <strong>junho</strong>:</p>
        ${this.tabela(['Meta', 'Alvo', 'Atual', 'Progresso'], [
          ['Receita', fmtBRL(meta), `<span class="td-bold">${fmtBRL(receita)}</span>`, `<span class="badge ${pct >= 100 ? 'badge-success' : 'badge-brand'}">${pct.toFixed(0)}%</span>`],
          ['Novos clientes', String(DB.metas.novosClientes), `<span class="td-bold">${novos}</span>`, `<span class="badge ${pctNovos >= 100 ? 'badge-success' : 'badge-brand'}">${pctNovos.toFixed(0)}%</span>`],
        ])}
        ${this.padroes([
          `Ritmo atual: <strong>${fmtBRL(ritmoDia)}/dia</strong> → projeção de <strong>${fmtBRL(projecao)}</strong> no fim do mês ${projecao >= meta ? '— meta deve ser <strong>batida com folga</strong> 🎯' : '— abaixo da meta, precisa acelerar'}.`,
          `Faltam <strong>${fmtBRL(Math.max(meta - receita, 0))}</strong> para a meta de receita, com ${diasNoMes - diasCorridos} dias pela frente.`,
        ])}
        ${this.acoes([
          { icon: 'bar-chart-3', label: 'Ver visão geral', act: 'nav-visao', arg: 'dashboard' },
        ])}`,
    };
  },

  iAniversariantes() {
    const hoje = DB.aniversariantesHoje();
    const rows = hoje.slice(0, 6).map(c => {
      const a = DB.agg(c.id);
      return [
        `<strong>${this.esc(c.nome)}</strong>`,
        `<span class="td-mono">${c.tel}</span>`,
        a.compras ? `${a.compras} compras` : '<span class="badge badge-lead">Lead</span>',
      ];
    });

    this._ctx.whats = `Parabéns, {nome}! 🎉 A equipe da VB Cosméticos deseja um dia incrível. ` +
      `Seu presente: 15% OFF hoje em qualquer produto da loja com o cupom BEMVINDA15. 💝`;

    this.guardarCSV('aniversariantes-hoje', ['Cliente', 'Telefone'], hoje.map(c => [c.nome, c.tel]));

    if (!hoje.length) return { html: '<p>Nenhum aniversariante hoje. Pergunte de novo amanhã! 🎂</p>' };

    return {
      html: `<p><strong>${hoje.length} cliente${hoje.length > 1 ? 's fazem' : ' faz'} aniversário hoje</strong> (10/06):</p>
        ${this.filtros(['nascimento = 10/06'])}
        ${this.tabela(['Cliente', 'Telefone', 'Histórico'], rows, hoje.length > 6 ? `Mostrando 6 de ${hoje.length}.` : '')}
        ${this.padroes([
          'Mensagem de parabéns com cupom no dia converte muito — cliente já está com a loja na cabeça.',
        ])}
        ${this.acoes([
          { icon: 'message-circle', label: 'Copiar mensagem de parabéns', act: 'copiar-whats' },
          { icon: 'download', label: 'Exportar CSV', act: 'csv' },
        ])}`,
    };
  },

  iNotas(q) {
    const notasJun = DB.notas.filter(n => n.data.startsWith('2026-06'));
    const rejeitadas = notasJun.filter(n => n.status === 'rejeitada');
    const processando = notasJun.filter(n => n.status === 'processando');

    if (/rejeitad|problema|erro/.test(q) || rejeitadas.length) {
      const rows = rejeitadas.slice(0, 6).map(n => {
        const v = DB.venda(n.vendaId);
        const c = v && v.clienteId ? DB.cliente(v.clienteId) : null;
        return [
          `<span class="td-mono">#${String(n.vendaId).padStart(5, '0')}</span>`,
          c ? this.esc(c.nome) : 'Consumidor',
          `<span class="td-bold">${fmtBRL(n.valor)}</span>`,
          `<span class="td-muted">${this.esc((n.motivo || '').replace('Rejeição ', 'R'))}</span>`,
        ];
      });
      return {
        html: `<p>Situação fiscal de <strong>junho</strong>: ${notasJun.length} notas emitidas, ` +
          `<strong>${notasJun.length - rejeitadas.length - processando.length} autorizadas</strong>, ` +
          `${processando.length} processando e <strong>${rejeitadas.length} rejeitada${rejeitadas.length > 1 ? 's' : ''}</strong>.</p>
          ${rejeitadas.length ? this.filtros(['status = rejeitada', 'período: junho/2026']) + this.tabela(['Venda', 'Cliente', 'Valor', 'Motivo'], rows) : ''}
          ${this.padroes([
            rejeitadas.length ? 'Rejeição por CPF/duplicidade se resolve corrigindo o dado e reenviando — sem perder a venda.' : 'Tudo certo com a SEFAZ este mês. ✅',
          ])}
          ${this.acoes([
            { icon: 'file-text', label: 'Abrir notas rejeitadas', act: 'nav-notas-rej' },
          ])}`,
      };
    }

    return {
      html: `<p>Junho: <strong>${notasJun.length} NFC-e emitidas</strong>, ${notasJun.length - rejeitadas.length - processando.length} autorizadas. Tudo sob controle. ✅</p>
        ${this.acoes([{ icon: 'file-text', label: 'Abrir notas', act: 'nav', arg: 'notas' }])}`,
    };
  },

  /* ════════════════════════════════════
     2. REGISTRAR INFORMAÇÃO
  ════════════════════════════════════ */
  iCadastrarCliente(original) {
    /* ex.: "cadastra a cliente Ana Souza, telefone (27) 99888-1234" */
    const telM = original.match(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/);
    const nomeM = original.match(/cliente\s+(?:nov[oa]\s+)?([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ü][a-zà-ü]+)+)/);
    if (!telM && !nomeM) return null;

    this._ctx.novoCliente = {
      nome: nomeM ? nomeM[1].trim() : '',
      tel: telM ? telM[0].trim() : '',
    };

    return {
      html: `<p>Entendi! Preparei o cadastro${nomeM ? ` de <strong>${this.esc(nomeM[1])}</strong>` : ''}${telM ? ` com o telefone <span class="td-mono">${telM[0]}</span>` : ''}.</p>
        <p>É só revisar e confirmar:</p>
        ${this.acoes([
          { icon: 'user-plus', label: 'Abrir cadastro pré-preenchido', act: 'novo-cliente-prefill' },
        ])}`,
    };
  },

  /* ════════════════════════════════════
     AJUDA / FALLBACK
  ════════════════════════════════════ */
  iAjuda() {
    return {
      html: `<p>Não encontrei essa informação, mas posso ajudar com os dados da loja. Tente, por exemplo:</p>
        <ul class="ai-patterns">
          <li>“Clientes que não compram há 90 dias com ticket acima de R$ 100”</li>
          <li>“O que vence nos próximos 30 dias?”</li>
          <li>“Quanto vendi hoje?” · “Receita da semana”</li>
          <li>“Top 5 produtos do mês” · “Melhores clientes”</li>
          <li>“Como está a meta de junho?”</li>
          <li>“Cadastra a cliente Ana Souza, telefone (27) 99888-1234”</li>
        </ul>`,
    };
  },

  /* ════════════════════════════════════
     INSIGHTS PROATIVOS (card do dashboard)
  ════════════════════════════════════ */
  insights() {
    const out = [];
    const venc = DB.produtosVencendo(30);
    const risco = venc.reduce((s, x) => s + x.p.estoque * x.p.preco, 0);
    if (venc.length) out.push(`<strong>${venc.length} produtos</strong> vencem em ≤30 dias (${fmtBRL(risco)} em risco). Quer que eu sugira uma promoção?`);

    const baixo = DB.estoqueBaixo();
    if (baixo.length) out.push(`<strong>${baixo[0].nome}</strong> está com só ${baixo[0].estoque} un. em estoque — alto risco de ruptura.`);

    const inativos = DB.clientesInativos(90, 800);
    if (inativos.length) out.push(`<strong>${inativos.length} bons clientes</strong> (gasto ≥ R$ 800) não compram há 90+ dias. Uma mensagem pode trazê-los de volta.`);

    const receita = DB.receita(DB.vendasDoMes());
    const proj = receita / 10 * 30;
    out.push(`No ritmo atual, junho fecha em <strong>${fmtBRL(proj)}</strong> — ${proj >= DB.metas.receita ? 'meta batida com folga 🎯' : 'abaixo da meta, vale acelerar'}.`);

    const aniv = DB.aniversariantesHoje();
    if (aniv.length) out.push(`<strong>${aniv.length} cliente${aniv.length > 1 ? 's fazem' : ' faz'} aniversário hoje</strong> — bom motivo para um WhatsApp com cupom. 🎂`);

    return out;
  },
};
