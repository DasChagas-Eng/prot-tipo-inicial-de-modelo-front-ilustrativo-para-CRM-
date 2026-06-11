# VB Cosméticos — Sistema de Vendas · Documento de Design

**Data:** 10/06/2026 · **Parceira:** VB Cosméticos (Priscilla de Freitas Venturin, Vila Velha/ES)
**Base:** protótipos de alta fidelidade (Dashboard, Clientes, Notas NFC-e) + Design System "CRM & Vendas v1.0"

## 1. Escopo

Sistema de vendas para pequeno varejo de perfumaria e beleza, cobrindo os requisitos
levantados no primeiro contato (27/04/2026):

| Requisito | Onde está no sistema |
|---|---|
| Cadastrar produtos | Cadastros → Produtos (+ modal novo/editar) |
| Cadastrar clientes | Cadastros → Clientes (+ modal, classificação Lead/Cliente/VIP) |
| Emitir notas fiscais | PDV emite NFC-e ao finalizar; Fiscal → Notas (DANFE, reenvio de rejeitada, exportar XML) |
| Registrar entrada de produtos | Estoque → Entrada de produtos (lote, validade, custo, NF do fornecedor) |
| Aplicar descontos | Cupons no PDV (VB10VIP −10%, BEMVINDA15 −15%) + promoção −20% por validade |
| Controlar validade | Estoque → Controle de validade (vencidos / ≤30 / 31–90 dias, dar baixa, promoção) |
| **IA assistente no dashboard** | Assistente VB: card no dashboard + drawer global (FAB) |

## 2. Arquitetura

Protótipo navegável em **HTML/CSS/JS puro** (sem build, abre em qualquer servidor estático
ou duplo clique no `index.html`). Quatro módulos com responsabilidades isoladas:

- **`index.html`** — shell: sidebar, topbar (busca global, notificações), modais, drawer da IA.
- **`style.css`** — todos os tokens do design system (cores brand #1E9BF0, Plus Jakarta Sans /
  Inter / JetBrains Mono, radius, sombras, espaçamento 8pt) e os componentes (botões, badges,
  KPI cards, tabelas, gráficos, DANFE, chat da IA).
- **`data.js`** — banco simulado **determinístico** (seed fixa): 2.884 clientes, ~4.400 vendas
  (Dez/25→Jun/26), notas, entradas. Todos os KPIs/gráficos/respostas da IA derivam dos mesmos
  dados — os números são coerentes entre telas. Fachada `DB` com agregações e mutações.
- **`ai.js`** — Assistente VB: motor de intenções por regras (pt-BR, sem backend) sobre o `DB`.
- **`app.js`** — navegação SPA, as 7 páginas, PDV, fiscal, formulários e a ligação da IA com a UI.

## 3. Assistente VB (Natural Language Interface)

Cobre os três momentos do CRM: **encontrar** informação, **registrar** informação e
**decidir** a próxima ação. Toda resposta tem 4 blocos: filtros montados (chips) → tabela →
padrões identificados → ações sugeridas (botões que executam de verdade).

Intenções suportadas (com extração de parâmetros — dias, valores R$, períodos, top N):

1. Clientes inativos: *"clientes que não compram há 90 dias e tinham ticket acima de R$ 1.000"*
   → ações: copiar mensagem de reativação (WhatsApp), exportar CSV, abrir em Clientes.
2. Vencimentos: *"o que vence nos próximos 30 dias?"* → ação real: aplicar −20% nos itens.
3. Estoque baixo → ação: abrir entrada pré-selecionada.
4. Receita/vendas por período (hoje, ontem, semana, mês, maio…), ticket médio, metas com projeção.
5. Top produtos / top clientes / aniversariantes (mensagem de parabéns) / notas rejeitadas.
6. **Registrar**: *"cadastra a cliente Ana Souza, telefone (27) 99888-1234"* → abre o
   formulário pré-preenchido.
7. Insights proativos rotativos no card do dashboard (risco de validade, ruptura, ritmo da meta).

Por ser um protótipo sem backend, o motor é por regras; a interface (entrada livre + chips +
blocos de resposta) foi desenhada para que um LLM real (ex.: API Claude) substitua o motor
sem mudar a UI.

## 4. Decisões e simulações

- **Dados gerados com seed fixa** (mulberry32): demo sempre igual, e calibrada para os números
  dos protótipos — 342 vendas no mês, NFC-e nº 000.491.205, 29 novos clientes, 5 produtos a
  vencer (3 em ≤30 dias), Mariana Alves como top cliente.
- Segmento "revendedoras" (14 clientes de cestas grandes paradas há +100 dias) garante que a
  consulta-vitrine da IA tenha resultados reais.
- **SEFAZ simulada**: nota nasce "processando" e autoriza em ~2,5s; rejeitadas têm motivo e
  botão "corrigir e reenviar"; numeração sequencial apenas para autorizadas.
- Vendido não pode exceder estoque; produto vencido não aparece no PDV; venda nunca é anterior
  ao cadastro do cliente.
- Exportações reais: CSV (com BOM p/ Excel) e XML do lote de NFC-e; impressão do DANFE via
  folha de estilo de impressão.

## 5. Como rodar

Abrir `index.html` num navegador (ou `npx http-server -p 8123` na pasta). Não há dependências
além das fontes Google e dos ícones Tabler via CDN. A versão anterior do sistema está
preservada em `_backup-v1/`.
