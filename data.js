'use strict';
/* ════════════════════════════════════════════════════════
   VB COSMÉTICOS — data.js
   Base de dados simulada e determinística da demo.
   Clientes, vendas e notas são gerados a partir de uma
   seed fixa: os números são sempre os mesmos entre sessões
   e todos os KPIs/gráficos/respostas da IA saem daqui.
════════════════════════════════════════════════════════ */

/* ── Âncora temporal da demo (data dos protótipos) ── */
const HOJE_ISO = '2026-06-10';
const HOJE = new Date(2026, 5, 10, 18, 0, 0);

/* ── Formatação ── */
const fmtBRL  = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum  = v => v.toLocaleString('pt-BR');
const fmtData = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtDataCurta = iso => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };

function isoDate(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function diasAte(iso) {
  return Math.round((new Date(iso + 'T12:00:00') - new Date(HOJE_ISO + 'T12:00:00')) / 864e5);
}

function iniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function semAcento(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ── RNG determinístico ── */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd  = mulberry32(20260610);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));

/* ════════════════════════════════════════
   EMPRESA
════════════════════════════════════════ */
const EMPRESA = {
  razao:    'VB COSMÉTICOS LTDA',
  fantasia: 'VB Cosméticos',
  cnpj:     '41.220.118/0001-55',
  ie:       '082.760.55-0',
  endereco: 'Av. Hugo Musso, 1024 · Vila Velha/ES',
};

const CATEGORIAS = ['Perfumaria', 'Maquiagem', 'Skincare', 'Cabelos & outros'];

/* ════════════════════════════════════════
   PRODUTOS
   peso = popularidade nas vendas geradas
════════════════════════════════════════ */
const PRODUTOS = [
  { id: 1,  sku: 'VB-PRF-0101', nome: 'Eau Parfum Loyalle 50ml',        categoria: 'Perfumaria',      preco: 189.90, custo: 98.00,  estoque: 26, estoqueMin: 8,  lote: 'L2604', validade: '2027-11-30', icon: 'wind',           peso: 4 },
  { id: 2,  sku: 'VB-MAQ-0210', nome: 'Batom Matte Rubi',               categoria: 'Maquiagem',       preco: 39.90,  custo: 14.50,  estoque: 54, estoqueMin: 15, lote: 'L2605', validade: '2027-08-31', icon: 'smile',          peso: 10 },
  { id: 3,  sku: 'VB-SKN-0310', nome: 'Hidratante Facial FPS30',        categoria: 'Skincare',        preco: 89.90,  custo: 41.00,  estoque: 31, estoqueMin: 10, lote: 'L2603', validade: '2027-05-31', icon: 'sun',            peso: 7 },
  { id: 4,  sku: 'VB-SKN-0303', nome: 'Sérum Vitamina C 30ml',          categoria: 'Skincare',        preco: 129.90, custo: 62.00,  estoque: 9,  estoqueMin: 6,  lote: 'L2405', validade: '2026-05-29', icon: 'droplets',       peso: 0 },
  { id: 5,  sku: 'VB-PRF-0150', nome: 'Colônia Infantil Soft 210ml',    categoria: 'Perfumaria',      preco: 79.90,  custo: 35.00,  estoque: 14, estoqueMin: 6,  lote: 'L2502', validade: '2026-06-22', icon: 'baby',           peso: 3 },
  { id: 6,  sku: 'VB-BSP-0088', nome: 'Body Splash Maracujá 200ml',     categoria: 'Perfumaria',      preco: 49.90,  custo: 19.90,  estoque: 22, estoqueMin: 8,  lote: 'L2501', validade: '2026-07-08', icon: 'sparkles',       peso: 8 },
  { id: 7,  sku: 'VB-MAQ-0245', nome: 'Base Líquida HD Matte',          categoria: 'Maquiagem',       preco: 119.90, custo: 55.00,  estoque: 3,  estoqueMin: 10, lote: 'L2602', validade: '2027-02-28', icon: 'layers',         peso: 5 },
  { id: 8,  sku: 'VB-PRF-0199', nome: 'Perfume Masc. Intense 100ml',    categoria: 'Perfumaria',      preco: 249.90, custo: 130.00, estoque: 12, estoqueMin: 15, lote: 'L2601', validade: '2028-01-31', icon: 'flame',          peso: 3 },
  { id: 9,  sku: 'VB-PRF-0203', nome: 'Perfume Fem. Blossom 100ml',     categoria: 'Perfumaria',      preco: 219.90, custo: 112.00, estoque: 17, estoqueMin: 6,  lote: 'L2601', validade: '2028-03-31', icon: 'flower',         peso: 3 },
  { id: 10, sku: 'VB-CAB-0405', nome: 'Shampoo Nutri Brilho 300ml',     categoria: 'Cabelos & outros', preco: 34.90, custo: 13.00,  estoque: 48, estoqueMin: 12, lote: 'L2606', validade: '2027-10-31', icon: 'shower-head',    peso: 9 },
  { id: 11, sku: 'VB-CAB-0406', nome: 'Condicionador Nutri Brilho',     categoria: 'Cabelos & outros', preco: 36.90, custo: 14.00,  estoque: 41, estoqueMin: 12, lote: 'L2606', validade: '2027-10-31', icon: 'zap',            peso: 8 },
  { id: 12, sku: 'VB-CAB-0440', nome: 'Máscara Capilar Argan 250g',     categoria: 'Cabelos & outros', preco: 64.90, custo: 27.00,  estoque: 19, estoqueMin: 6,  lote: 'L2604', validade: '2027-04-30', icon: 'wand-sparkles',  peso: 5 },
  { id: 13, sku: 'VB-MAQ-0260', nome: 'Esmalte Gel Cereja',             categoria: 'Maquiagem',       preco: 12.80,  custo: 4.50,   estoque: 75, estoqueMin: 20, lote: 'L2605', validade: '2027-12-31', icon: 'paint-bucket',   peso: 12 },
  { id: 14, sku: 'VB-MAQ-0272', nome: 'Delineador Carbon 24h',          categoria: 'Maquiagem',       preco: 29.90,  custo: 11.00,  estoque: 33, estoqueMin: 10, lote: 'L2603', validade: '2027-06-30', icon: 'pen-line',       peso: 8 },
  { id: 15, sku: 'VB-SKN-0340', nome: 'Protetor Solar FPS50 60g',       categoria: 'Skincare',        preco: 79.90,  custo: 36.00,  estoque: 28, estoqueMin: 10, lote: 'L2509', validade: '2026-08-04', icon: 'sun',            peso: 6 },
  { id: 16, sku: 'VB-SKN-0355', nome: 'Água Micelar 200ml',             categoria: 'Skincare',        preco: 32.90,  custo: 12.50,  estoque: 39, estoqueMin: 12, lote: 'L2604', validade: '2027-03-31', icon: 'droplets',       peso: 9 },
  { id: 17, sku: 'VB-CAB-0490', nome: 'Sabonete Líquido Lavanda',       categoria: 'Cabelos & outros', preco: 15.00, custo: 5.20,   estoque: 62, estoqueMin: 15, lote: 'L2606', validade: '2027-09-30', icon: 'leaf',           peso: 11 },
  { id: 18, sku: 'VB-PRF-0260', nome: 'Kit Mini Perfumes (3un)',        categoria: 'Perfumaria',      preco: 99.90,  custo: 46.00,  estoque: 16, estoqueMin: 5,  lote: 'L2510', validade: '2026-08-29', icon: 'package-2',      peso: 4 },
];

/* ════════════════════════════════════════
   CLIENTES
   5 clientes em destaque (dos protótipos)
   + base gerada (~2.880) com cauda pesada:
   poucos clientes concentram muitas compras.
════════════════════════════════════════ */
const CIDADES = ['Vila Velha', 'Vila Velha', 'Vila Velha', 'Vitória', 'Serra', 'Cariacica', 'Guarapari'];
const NOMES_F = ['Ana', 'Beatriz', 'Bruna', 'Camila', 'Carla', 'Carolina', 'Daniela', 'Débora', 'Elisa', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Júlia', 'Juliana', 'Larissa', 'Letícia', 'Luana', 'Luciana', 'Mariana', 'Marina', 'Natália', 'Patrícia', 'Paula', 'Priscila', 'Rafaela', 'Renata', 'Sabrina', 'Simone', 'Sofia', 'Tatiane', 'Vanessa', 'Viviane', 'Yasmin'];
const NOMES_M = ['André', 'Bruno', 'Caio', 'Carlos', 'Daniel', 'Diego', 'Eduardo', 'Felipe', 'Gabriel', 'Gustavo', 'Henrique', 'João', 'Leandro', 'Lucas', 'Marcelo', 'Mateus', 'Paulo', 'Pedro', 'Rafael', 'Ricardo', 'Rodrigo', 'Thiago', 'Vinícius'];
const SOBRENOMES = ['Almeida', 'Alves', 'Barbosa', 'Cardoso', 'Carvalho', 'Castro', 'Costa', 'Dias', 'Duarte', 'Ferreira', 'Fonseca', 'Gomes', 'Lima', 'Lopes', 'Martins', 'Mendes', 'Monteiro', 'Moreira', 'Nascimento', 'Nunes', 'Oliveira', 'Pereira', 'Pinto', 'Ramos', 'Ribeiro', 'Rocha', 'Rodrigues', 'Santana', 'Santos', 'Silva', 'Souza', 'Teixeira', 'Vieira'];

function telAleatorio() { return `(27) 9${rint(9000, 9999)}-${String(rint(0, 9999)).padStart(4, '0')}`; }
function cpfMascarado() { return `${String(rint(10, 999)).padStart(3, '0')}.***.***-${String(rint(10, 99))}`; }

/* peso = chance relativa de aparecer numa venda gerada */
const CLIENTES = [
  { id: 1, nome: 'Mariana Alves',   cpf: '042.***.***-12', tel: '(27) 99812-4455', email: 'mariana.alves@email.com', nascimento: '1992-06-10', cidade: 'Vila Velha', criadoEm: '2023-03-14', peso: 25 },
  { id: 2, nome: 'Camila Rocha',    cpf: '118.***.***-90', tel: '(27) 99634-7781', email: 'camila.rocha@email.com',  nascimento: '1988-09-22', cidade: 'Vila Velha', criadoEm: '2023-07-02', peso: 20 },
  { id: 3, nome: 'Fernanda Castro', cpf: '220.***.***-31', tel: '(27) 99987-1020', email: 'fe.castro@email.com',     nascimento: '1995-06-10', cidade: 'Vitória',    criadoEm: '2024-01-19', peso: 15 },
  { id: 4, nome: 'Rafael Mendes',   cpf: '305.***.***-77', tel: '(27) 99220-5533', email: 'rafael.mendes@email.com', nascimento: '1990-11-03', cidade: 'Vila Velha', criadoEm: '2024-05-28', peso: 11 },
  { id: 5, nome: 'João Pedro Lima', cpf: null,              tel: '(27) 99145-8890', email: 'jp.lima@email.com',       nascimento: '1999-02-17', cidade: 'Serra',      criadoEm: '2026-06-04', peso: 0 },
];

(function gerarClientes() {
  const TOTAL = 2884;
  const nomesUsados = new Set(CLIENTES.map(c => c.nome));
  let id = CLIENTES.length + 1;
  while (CLIENTES.length < TOTAL) {
    const fem = rnd() < 0.78;
    const nome = `${pick(fem ? NOMES_F : NOMES_M)} ${pick(SOBRENOMES)}${rnd() < 0.25 ? ' ' + pick(SOBRENOMES) : ''}`;
    if (nomesUsados.has(nome)) continue;
    nomesUsados.add(nome);

    /* datas de cadastro: 2019 → hoje, com ~29 novos em junho/26 */
    let criadoEm;
    if (CLIENTES.length >= TOTAL - 28) {
      criadoEm = `2026-06-${String(rint(1, 10)).padStart(2, '0')}`;
    } else {
      const ano = pick([2019, 2020, 2021, 2021, 2022, 2022, 2023, 2023, 2024, 2024, 2025, 2025, 2025, 2026]);
      const mes = ano === 2026 ? rint(1, 5) : rint(1, 12);
      criadoEm = `${ano}-${String(mes).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`;
    }
    CLIENTES.push({
      id: id++,
      nome,
      cpf: rnd() < 0.7 ? cpfMascarado() : null,
      tel: telAleatorio(),
      email: rnd() < 0.6 ? `${semAcento(nome.split(' ')[0])}.${semAcento(nome.split(' ')[1])}@email.com` : null,
      nascimento: `${rint(1966, 2007)}-${String(rint(1, 12)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`,
      cidade: pick(CIDADES),
      criadoEm,
      peso: rnd() < 0.07 ? rint(12, 22) : 1,   /* cauda pesada: ~7% são clientes “fortes” */
    });
  }
})();

/* ════════════════════════════════════════
   VENDAS
   5 vendas em destaque (10/06, batem com os
   protótipos) + histórico gerado Dez/25→Jun/26.
   Venda = { id, num, data, hora, clienteId|null,
             itens:[{produtoId, qtd, preco}],
             cupom, descontoPct, pagamento }
════════════════════════════════════════ */
function totalVenda(v) {
  const bruto = v.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  return Math.round(bruto * (1 - (v.descontoPct || 0) / 100) * 100) / 100;
}
function subtotalVenda(v) {
  return Math.round(v.itens.reduce((s, i) => s + i.preco * i.qtd, 0) * 100) / 100;
}

const VENDAS_DESTAQUE = [
  { num: 4912, data: '2026-06-10', hora: '14:22', clienteId: 1, cupom: 'VB10VIP', descontoPct: 10, pagamento: 'Pix',
    itens: [{ produtoId: 1, qtd: 1, preco: 189.90 }, { produtoId: 2, qtd: 2, preco: 39.90 }, { produtoId: 3, qtd: 1, preco: 89.90 }],
    nf: 'autorizada' },
  { num: 4911, data: '2026-06-10', hora: '13:58', clienteId: null, cupom: null, descontoPct: 0, pagamento: 'Dinheiro',
    itens: [{ produtoId: 6, qtd: 1, preco: 49.90 }],
    nf: 'autorizada' },
  { num: 4910, data: '2026-06-10', hora: '13:30', clienteId: 2, cupom: null, descontoPct: 0, pagamento: 'Crédito',
    itens: [{ produtoId: 8, qtd: 1, preco: 249.90 }, { produtoId: 9, qtd: 1, preco: 219.90 }, { produtoId: 3, qtd: 1, preco: 89.90 }, { produtoId: 2, qtd: 1, preco: 39.90 }, { produtoId: 13, qtd: 1, preco: 12.80 }],
    nf: 'processando' },
  { num: 4909, data: '2026-06-10', hora: '12:10', clienteId: 3, cupom: null, descontoPct: 0, pagamento: 'Pix',
    itens: [{ produtoId: 3, qtd: 1, preco: 89.90 }, { produtoId: 12, qtd: 1, preco: 64.90 }],
    nf: 'autorizada' },
  { num: 4908, data: '2026-06-10', hora: '11:42', clienteId: null, cupom: null, descontoPct: 0, pagamento: 'Débito',
    itens: [{ produtoId: 9, qtd: 1, preco: 219.90 }, { produtoId: 5, qtd: 1, preco: 79.90 }, { produtoId: 13, qtd: 1, preco: 12.80 }, { produtoId: 17, qtd: 1, preco: 15.00 }],
    nf: 'rejeitada', nfMotivo: 'Rejeição 778: CPF do destinatário inválido' },
];

const VENDAS = [];

/* ── Segmento "revendedoras": clientes de cestas grandes que
      pararam de comprar — alimentam a consulta-chave da IA
      ("clientes inativos com ticket alto"). peso=0 garante que
      o gerador aleatório não crie compras recentes para eles. ── */
const ATACADO_IDS = [];
(function marcarAtacado() {
  for (let k = 0; k < 14; k++) {
    const c = CLIENTES[600 + k * 137];
    c.peso = 0;
    if (c.criadoEm > '2025-11-01') c.criadoEm = `2025-${String(rint(3, 10)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`;
    ATACADO_IDS.push(c.id);
  }
})();

(function gerarVendas() {
  /* plano mensal: [ano, mês(0-11), nº de vendas, último dia] */
  const plano = [
    [2025, 11, 580, 31],
    [2026, 0,  610, 31],
    [2026, 1,  640, 28],
    [2026, 2,  600, 31],
    [2026, 3,  760, 30],
    [2026, 4,  880, 31],
    [2026, 5,  337, 9],     /* junho até dia 09 (dia 10 = vendas destaque) */
  ];

  /* sorteio de cliente ponderado (35% consumidor sem cadastro) */
  const roleta = [];
  CLIENTES.forEach(c => { for (let i = 0; i < c.peso; i++) roleta.push(c.id); });

  const prodRoleta = [];
  PRODUTOS.forEach(p => { for (let i = 0; i < p.peso; i++) prodRoleta.push(p); });

  const pagamentos = ['Crédito', 'Crédito', 'Crédito', 'Crédito', 'Crédito', 'Crédito', 'Pix', 'Pix', 'Pix', 'Pix', 'Débito', 'Dinheiro'];

  for (const [ano, mes, qtd, ultimoDia] of plano) {
    for (let i = 0; i < qtd; i++) {
      const dia = rint(1, ultimoDia);
      const nItens = rnd() < 0.55 ? 1 : (rnd() < 0.7 ? 2 : 3);
      const itens = [];
      const usados = new Set();
      for (let j = 0; j < nItens; j++) {
        const p = pick(prodRoleta);
        if (usados.has(p.id)) continue;
        usados.add(p.id);
        itens.push({ produtoId: p.id, qtd: rnd() < 0.9 ? 1 : 2, preco: p.preco });
      }
      const temCupom = rnd() < 0.12;
      VENDAS.push({
        data: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        hora: `${String(rint(9, 19)).padStart(2, '0')}:${String(rint(0, 59)).padStart(2, '0')}`,
        clienteId: rnd() < 0.35 ? null : pick(roleta),
        itens,
        cupom: temCupom ? 'VB10VIP' : null,
        descontoPct: temCupom ? 10 : 0,
        pagamento: pick(pagamentos),
        nf: 'autorizada',
      });
    }
  }

  /* ~5 notas rejeitadas no histórico de junho */
  VENDAS.filter(v => v.data.startsWith('2026-06')).slice(0, 5).forEach(v => { v.nf = 'rejeitada'; v.nfMotivo = 'Rejeição 204: Duplicidade de NF-e'; });

  /* ── cestas grandes (revendedoras + clientes destaque) ──
     itens: [produtoId, qtd]; preços vêm do catálogo */
  const cesta = (clienteId, data, defs) => VENDAS.push({
    data, hora: `${String(rint(10, 18)).padStart(2, '0')}:${String(rint(0, 59)).padStart(2, '0')}`,
    clienteId,
    itens: defs.map(([pid, qtd]) => ({ produtoId: pid, qtd, preco: PRODUTOS.find(p => p.id === pid).preco })),
    cupom: null, descontoPct: 0, pagamento: pick(['Pix', 'Crédito', 'Crédito']),
    nf: 'autorizada',
  });

  const GRANDE = [[8, 2], [9, 2], [1, 1]];           /* ≈ R$ 1.129 — ticket >1000  */
  const MEDIA1 = [[8, 1], [9, 1], [1, 1]];           /* ≈ R$ 660                    */
  const MEDIA2 = [[9, 1], [18, 2], [3, 1]];          /* ≈ R$ 510                    */
  const MEDIA3 = [[8, 1], [9, 1], [1, 1], [18, 1]];  /* ≈ R$ 760                    */
  const datasAntigas = ['2025-12-08', '2025-12-19', '2026-01-09', '2026-01-22', '2026-02-05', '2026-02-18', '2026-02-25'];

  ATACADO_IDS.forEach((id, k) => {
    if (k < 6) {
      cesta(id, datasAntigas[k % datasAntigas.length], GRANDE);             /* ticket médio ≥ R$ 1.000 */
    } else {
      cesta(id, datasAntigas[k % datasAntigas.length], MEDIA1);
      cesta(id, datasAntigas[(k + 3) % datasAntigas.length], k % 2 ? MEDIA2 : MEDIA3);
    }
  });

  /* clientes destaque ganham cestas históricas para liderar o ranking */
  cesta(1, '2026-01-18', MEDIA1);
  cesta(1, '2026-03-26', MEDIA3);
  cesta(2, '2026-02-12', MEDIA3);

  VENDAS.push(...VENDAS_DESTAQUE);

  /* ordena cronologicamente e numera em sequência: as 5 vendas em
     destaque são as últimas do dia 10/06, logo recebem 4908–4912,
     exatamente como nos protótipos */
  VENDAS.sort((a, b) => (a.data + (a.hora || '')) < (b.data + (b.hora || '')) ? -1 : 1);
  let seq = 4912 - VENDAS.length + 1;
  VENDAS.forEach(v => { v.num = seq++; v.id = v.num; });
})();

/* ── coerência: nenhuma venda pode ser anterior ao cadastro.
      Clientes "novos de junho" perdem a atribuição da venda antiga
      (vira venda de consumidor); para os demais, o cadastro é
      puxado para a data da primeira compra. ── */
(function corrigirCoerencia() {
  const porId = new Map(CLIENTES.map(c => [c.id, c]));
  for (const v of VENDAS) {
    if (!v.clienteId) continue;
    const c = porId.get(v.clienteId);
    if (!c || !c.criadoEm || v.data >= c.criadoEm) continue;
    if (c.criadoEm.startsWith('2026-06')) v.clienteId = null;
    else c.criadoEm = v.data;
  }
})();

/* ════════════════════════════════════════
   NOTAS FISCAIS (NFC-e) — 1 por venda
   Numeração sequencial só para autorizadas,
   terminando em 000.491.205 (protótipo).
════════════════════════════════════════ */
const NOTAS = [];

(function gerarNotas() {
  const autorizadas = VENDAS.filter(v => v.nf === 'autorizada').length;
  let numero = 491205 - autorizadas + 1;
  for (const v of VENDAS) {
    NOTAS.push({
      vendaId: v.id,
      numero: v.nf === 'autorizada' ? numero++ : null,
      status: v.nf,
      motivo: v.nfMotivo || null,
      data: v.data,
      hora: v.hora,
      valor: totalVenda(v),
      chave: gerarChave(v.id),
    });
  }
})();

function gerarChave(seed) {
  const r = mulberry32(seed * 7919);
  let chave = '3226' + '06' + '41220118000155' + '65001';
  while (chave.length < 44) chave += Math.floor(r() * 10);
  return chave.slice(0, 44);
}

function fmtChave(chave) {
  return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function fmtNumeroNF(n) {
  if (!n) return null;
  const s = String(n).padStart(9, '0');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6)}`;
}

/* ════════════════════════════════════════
   ENTRADAS DE PRODUTOS (estoque)
════════════════════════════════════════ */
const FORNECEDORES = ['Distribuidora Beleza ES', 'Atacado Cosmético BR', 'Loyalle Fragrâncias', 'NutriHair Distribuidora', 'SkinLab Brasil'];
const ENTRADAS = [];

(function gerarEntradas() {
  let id = 1;
  for (let i = 0; i < 14; i++) {
    const p = pick(PRODUTOS);
    const d = new Date(HOJE);
    d.setDate(d.getDate() - rint(1, 45));
    ENTRADAS.push({
      id: id++,
      data: isoDate(d),
      produtoId: p.id,
      qtd: rint(6, 36),
      custo: p.custo,
      lote: `L26${String(rint(1, 6)).padStart(2, '0')}`,
      validade: p.validade,
      fornecedor: pick(FORNECEDORES),
      nf: `NF-${rint(100200, 199999)}`,
    });
  }
  ENTRADAS.sort((a, b) => a.data < b.data ? 1 : -1);
})();

/* ════════════════════════════════════════
   DB — fachada + agregações
════════════════════════════════════════ */
const DB = {
  empresa: EMPRESA,
  categorias: CATEGORIAS,
  produtos: PRODUTOS,
  clientes: CLIENTES,
  vendas: VENDAS,
  notas: NOTAS,
  entradas: ENTRADAS,
  metas: { receita: 45000, novosClientes: 40 },
  cupons: { 'VB10VIP': 10, 'BEMVINDA15': 15 },
  proximoNumVenda: 4913,
  proximoNumNota: 491206,

  produto(id)  { return PRODUTOS.find(p => p.id === id); },
  cliente(id)  { return CLIENTES.find(c => c.id === id); },
  venda(id)    { return VENDAS.find(v => v.id === id); },
  notaDaVenda(id) { return NOTAS.find(n => n.vendaId === id); },

  /* ── agregação por cliente (calculada uma vez) ── */
  _agg: null,
  agg(clienteId) {
    if (!this._agg) {
      this._agg = new Map();
      for (const v of VENDAS) {
        if (!v.clienteId) continue;
        let a = this._agg.get(v.clienteId);
        if (!a) { a = { compras: 0, gasto: 0, ultima: null }; this._agg.set(v.clienteId, a); }
        a.compras++;
        a.gasto += totalVenda(v);
        if (!a.ultima || v.data > a.ultima) a.ultima = v.data;
      }
    }
    return this._agg.get(clienteId) || { compras: 0, gasto: 0, ultima: null };
  },
  invalidarAgg() { this._agg = null; },

  classe(c) {
    const a = this.agg(c.id);
    if (!a.compras) return 'lead';
    if (a.gasto >= 800 || a.compras >= 10) return 'vip';
    return 'cliente';
  },

  /* ── recortes de vendas ── */
  vendasDoMes(ano = 2026, mes = 6) {
    const pref = `${ano}-${String(mes).padStart(2, '0')}`;
    return VENDAS.filter(v => v.data.startsWith(pref));
  },
  vendasNoPeriodo(deIso, ateIso) {
    return VENDAS.filter(v => v.data >= deIso && v.data <= ateIso);
  },
  receita(vendas) { return vendas.reduce((s, v) => s + totalVenda(v), 0); },

  receitaPorMes() {
    /* últimos 7 meses: Dez → Jun */
    const meses = [[2025, 12], [2026, 1], [2026, 2], [2026, 3], [2026, 4], [2026, 5], [2026, 6]];
    const nomes = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return meses.map(([y, m], i) => ({
      label: nomes[i],
      valor: this.receita(this.vendasDoMes(y, m)),
    }));
  },

  vendasPorCategoria(vendas) {
    /* participação por receita (R$), não por unidades */
    const mapa = {};
    CATEGORIAS.forEach(c => mapa[c] = 0);
    for (const v of vendas) for (const i of v.itens) {
      const p = this.produto(i.produtoId);
      if (p) mapa[p.categoria] += i.qtd * i.preco;
    }
    return mapa;
  },

  pagamentos(vendas) {
    const mapa = {};
    for (const v of vendas) mapa[v.pagamento] = (mapa[v.pagamento] || 0) + 1;
    return mapa;
  },

  topProdutos(vendas, n = 5) {
    const mapa = new Map();
    for (const v of vendas) for (const i of v.itens) {
      let t = mapa.get(i.produtoId);
      if (!t) { t = { produtoId: i.produtoId, qtd: 0, receita: 0 }; mapa.set(i.produtoId, t); }
      t.qtd += i.qtd;
      t.receita += i.preco * i.qtd * (1 - (v.descontoPct || 0) / 100);
    }
    return [...mapa.values()].sort((a, b) => b.receita - a.receita).slice(0, n);
  },

  topClientes(n = 5) {
    return CLIENTES
      .map(c => ({ c, a: this.agg(c.id) }))
      .filter(x => x.a.compras > 0)
      .sort((x, y) => y.a.gasto - x.a.gasto)
      .slice(0, n);
  },

  clientesInativos(dias = 90, minGasto = 0) {
    const limite = new Date(HOJE_ISO + 'T12:00:00');
    limite.setDate(limite.getDate() - dias);
    const limiteIso = isoDate(limite);
    return CLIENTES
      .map(c => ({ c, a: this.agg(c.id) }))
      .filter(x => x.a.compras > 0 && x.a.ultima < limiteIso && x.a.gasto >= minGasto)
      .sort((x, y) => y.a.gasto - x.a.gasto);
  },

  produtosVencendo(horizonteDias = 90) {
    return PRODUTOS
      .map(p => ({ p, dias: diasAte(p.validade) }))
      .filter(x => x.dias <= horizonteDias)
      .sort((a, b) => a.dias - b.dias);
  },

  estoqueBaixo() {
    return PRODUTOS.filter(p => p.estoque <= p.estoqueMin).sort((a, b) => a.estoque - b.estoque);
  },

  novosClientesNoMes() {
    return CLIENTES.filter(c => c.criadoEm && c.criadoEm.startsWith('2026-06'));
  },

  aniversariantesHoje() {
    return CLIENTES.filter(c => c.nascimento && c.nascimento.slice(5) === HOJE_ISO.slice(5));
  },

  clientesAtivosNoMes() {
    const ids = new Set(this.vendasDoMes().map(v => v.clienteId).filter(Boolean));
    return ids.size;
  },

  contagemVIP() {
    return CLIENTES.filter(c => this.classe(c) === 'vip').length;
  },

  /* ── mutações ── */
  registrarVenda({ clienteId, itens, cupom, descontoPct, pagamento }) {
    const v = {
      id: this.proximoNumVenda,
      num: this.proximoNumVenda,
      data: HOJE_ISO,
      hora: new Date().toTimeString().slice(0, 5),
      clienteId: clienteId || null,
      itens, cupom: cupom || null,
      descontoPct: descontoPct || 0,
      pagamento,
      nf: 'processando',
    };
    this.proximoNumVenda++;
    VENDAS.push(v);
    for (const i of itens) {
      const p = this.produto(i.produtoId);
      if (p) p.estoque = Math.max(0, p.estoque - i.qtd);
    }
    const nota = {
      vendaId: v.id, numero: null, status: 'processando', motivo: null,
      data: v.data, hora: v.hora, valor: totalVenda(v), chave: gerarChave(v.id),
    };
    NOTAS.push(nota);
    this.invalidarAgg();
    return { venda: v, nota };
  },

  autorizarNota(nota) {
    nota.status = 'autorizada';
    nota.motivo = null;
    nota.numero = this.proximoNumNota++;
    const v = this.venda(nota.vendaId);
    if (v) { v.nf = 'autorizada'; v.nfMotivo = null; }
  },

  registrarEntrada({ produtoId, qtd, custo, validade, lote, fornecedor, nf }) {
    const p = this.produto(produtoId);
    if (p) {
      p.estoque += qtd;
      if (validade) { p.validade = validade; if (lote) p.lote = lote; }
    }
    const e = {
      id: ENTRADAS.length + 1, data: HOJE_ISO, produtoId, qtd,
      custo: custo || (p ? p.custo : 0), lote: lote || (p ? p.lote : '—'),
      validade: validade || (p ? p.validade : null), fornecedor: fornecedor || '—', nf: nf || '—',
    };
    ENTRADAS.unshift(e);
    return e;
  },

  adicionarCliente({ nome, cpf, tel, email, nascimento, cidade }) {
    const c = {
      id: CLIENTES.length + 1, nome, cpf: cpf || null, tel, email: email || null,
      nascimento: nascimento || null, cidade: cidade || 'Vila Velha',
      criadoEm: HOJE_ISO, peso: 1,
    };
    CLIENTES.push(c);
    return c;
  },

  adicionarProduto({ nome, categoria, preco, custo, estoque, estoqueMin, validade, lote }) {
    const maxId = Math.max(...PRODUTOS.map(p => p.id));
    const pref = { 'Perfumaria': 'PRF', 'Maquiagem': 'MAQ', 'Skincare': 'SKN', 'Cabelos & outros': 'CAB' }[categoria] || 'GER';
    const p = {
      id: maxId + 1, sku: `VB-${pref}-${String(300 + maxId).padStart(4, '0')}`,
      nome, categoria, preco, custo: custo || Math.round(preco * 0.45 * 100) / 100,
      estoque: estoque || 0, estoqueMin: estoqueMin || 5,
      lote: lote || 'L2606', validade: validade || '2027-12-31', icon: 'package', peso: 5,
    };
    PRODUTOS.push(p);
    return p;
  },

  darBaixa(produtoId) {
    const p = this.produto(produtoId);
    if (p) p.estoque = 0;
  },

  aplicarPromocao(produtoId, pct) {
    const p = this.produto(produtoId);
    if (p && !p.promoDe) {
      p.promoDe = p.preco;
      p.preco = Math.round(p.preco * (1 - pct / 100) * 100) / 100;
      p.promoPct = pct;
    }
  },
};
