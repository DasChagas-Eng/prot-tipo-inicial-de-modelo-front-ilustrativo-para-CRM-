import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight, Menu, Search, Sparkles } from 'lucide-react';

/* ════════════════════════════════════════════════════════
   VB COSMÉTICOS — landing page
   Dark, cinematográfica, glassy. React + Tailwind + motion.
════════════════════════════════════════════════════════ */

const DEMO_URL = './app/';
const GITHUB_URL =
  'https://github.com/DasChagas-Eng/prot-tipo-inicial-de-modelo-front-ilustrativo-para-CRM-';
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

const easeOut = [0.22, 1, 0.36, 1] as const;

/* gradiente brilhante da headline */
const gradientStyle: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#vb-noise)',
};

/* ── primitivos ── */

function LogoVB({ className = 'w-8 h-8' }: { className?: string }) {
  return <img src="./logo-vb.svg" alt="" draggable={false} className={className} />;
}

function DemoButton({ label = 'Abrir a demo', full = false }: { label?: string; full?: boolean }) {
  return (
    <a
      href={DEMO_URL}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${full ? 'w-full' : ''}`}
    >
      <Sparkles className="w-4 h-4" />
      {label}
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
    </a>
  );
}

function SectionEyebrow({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-sm font-medium text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        {label}
      </span>
      {tag && (
        <span className="px-2 py-0.5 rounded-full border border-white/10 text-xs text-white/50">
          {tag}
        </span>
      )}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

/* ── seção 1: navbar ── */

function Navbar() {
  const links = [
    { label: 'Produto', href: '#produto' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Assistente IA', href: '#ia' },
    { label: 'Planos', href: '#planos' },
    { label: 'GitHub', href: GITHUB_URL, external: true },
  ];
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-20 max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between"
    >
      <a href="#" aria-label="VB Cosméticos — início">
        <LogoVB />
      </a>
      <div className="hidden md:flex gap-8">
        {links.map((l, i) => (
          <motion.a
            key={l.label}
            href={l.href}
            {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            {l.label}
          </motion.a>
        ))}
      </div>
      <div className="hidden md:block">
        <DemoButton label="Abrir demo" />
      </div>
      <button
        aria-label="Abrir menu"
        className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>
    </motion.nav>
  );
}

/* ── seção 2: hero ── */

function Hero() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
        className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
      >
        <span className="block">Sua loja.</span>
        <span className="block animate-shiny" style={gradientStyle}>
          Reinventada
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: easeOut }}
        className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
      >
        VB Cosméticos é o painel de gestão para o varejo de beleza. PDV, clientes,
        estoque com validade, NFC-e e um assistente de IA que entende o seu
        português — tudo em uma única tela.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: easeOut }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <DemoButton />
        <span className="text-xs text-white/40">
          Direto no navegador · sem cadastro · dados 100% simulados
        </span>
      </motion.div>
    </section>
  );
}

/* ── seção 3: barra de sistema (estilo macOS) ── */

function SystemBar() {
  const items = ['Dashboard', 'PDV', 'Clientes', 'Estoque', 'Fiscal', 'Ajuda'];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="relative z-10 h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <LogoVB className="w-3.5 h-3.5" />
          <span className="font-bold text-white">VB Cosméticos</span>
          {items.map((item, i) => (
            <span
              key={item}
              className={`text-white/60 ${i > 2 ? 'hidden sm:inline' : ''} ${i > 3 ? 'hidden md:inline' : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-white/60">
          <Search className="w-3.5 h-3.5" />
          <span>qua. 10 jun · 18:00</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── seção 4: showcase principal (MacBook) ── */

function Showcase() {
  return (
    <section id="produto" className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
      {/* brilho atrás do notebook */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-10 -translate-x-1/2 w-[80%] h-72 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(closest-side, rgba(30,155,240,0.35), rgba(0,210,255,0.08), transparent)',
          filter: 'blur(40px)',
        }}
      />
      <motion.figure
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.9, delay: 0.15, ease: easeOut }}
        className="relative rounded-3xl overflow-hidden border border-white/10"
      >
        <img
          src="./img/macbook-vb.png"
          alt="MacBook exibindo o dashboard da VB Cosméticos: receita do mês, vendas, ticket médio e gráfico de receita por mês"
          className="w-full h-auto block"
          loading="eager"
        />
        <figcaption className="absolute bottom-0 inset-x-0 px-6 py-4 text-xs text-white/50 bg-gradient-to-t from-black/70 to-transparent">
          O dashboard da VB em 10 de junho de 2026 — receita, vendas, ticket médio e
          validade, ao vivo na demo.
        </figcaption>
      </motion.figure>
    </section>
  );
}

/* ── seção 5: visão geral (screenshot em moldura de navegador) ── */

function DashboardSection() {
  return (
    <section id="recursos" className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
      <Reveal className="max-w-xl">
        <SectionEyebrow label="Visão geral" tag="tempo real" />
        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
          A loja inteira
          <br />
          em uma tela.
        </h2>
        <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
          Receita do mês, vendas, ticket médio, produtos a vencer, metas e formas de
          pagamento — o resumo que a dona da loja consulta entre um atendimento e
          outro, sem montar relatório nenhum.
        </p>
      </Reveal>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
        className="mt-12 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto text-xs text-white/50">VB Cosméticos — Dashboard</span>
        </div>
        <img
          src="./img/dashboard.png"
          alt="Dashboard da VB Cosméticos: KPIs de receita, vendas e ticket médio, gráfico de receita por mês e vendas por categoria"
          className="w-full h-auto block"
          loading="lazy"
        />
      </motion.div>
    </section>
  );
}

/* ── seção 6: assistente IA ── */

function AiSection() {
  const chips = [
    'Linguagem natural',
    'Tabelas e filtros prontos',
    'Sugestões de próximo passo',
    'Atalhos de um toque',
  ];
  return (
    <section id="ia" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <Reveal>
          <SectionEyebrow label="Assistente VB" tag="IA nativa" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Pergunte em português.
            <br />
            Ela faz o resto.
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            O assistente lê os dados da loja e responde com tabelas, filtros e
            próximos passos. Pergunte como perguntaria a uma colega de balcão:
            “clientes que não compram há 90 dias”, “produtos vencendo este mês”,
            “como foi a receita de maio?”.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="liquid-glass rounded-2xl p-4">
          <div className="flex items-center gap-2 px-1 pb-3 text-xs text-white/50">
            <Sparkles className="w-3.5 h-3.5 text-[#A4F4FD]" />
            Assistente VB · pergunte em linguagem natural
          </div>
          <img
            src="./img/assistente-ia.png"
            alt="Painel do Assistente VB aberto sobre o dashboard, respondendo perguntas em linguagem natural"
            className="w-full h-auto rounded-lg border border-white/10"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ── seção 7: CRM de clientes ── */

function CrmSection() {
  const chips = [
    'Classificação automática',
    'Aniversariantes do dia',
    'Histórico de compras',
    'Busca por nome, CPF ou telefone',
  ];
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <Reveal delay={0.15} className="liquid-glass rounded-2xl p-4 order-2 md:order-1">
          <img
            src="./img/clientes.png"
            alt="Tela de clientes da VB Cosméticos: 2.884 cadastros, clientes VIP, novos no mês e aniversariantes"
            className="w-full h-auto rounded-lg border border-white/10"
            loading="lazy"
          />
        </Reveal>

        <Reveal className="order-1 md:order-2">
          <SectionEyebrow label="Clientes" tag="2.884 cadastros" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Cada cliente,
            <br />
            uma história.
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            VIPs, clientes e leads separados pelo comportamento de compra,
            aniversariantes do dia e o histórico completo a um clique — a memória do
            balcão, organizada e pronta para a próxima venda.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── seção 8: processo (wireframe → produto) ── */

function ProcessSection() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      <Reveal className="max-w-xl">
        <SectionEyebrow label="Processo" tag="do esboço ao produto" />
        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
          Do wireframe
          <br />
          ao sistema vivo.
        </h2>
        <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
          O projeto nasceu como um esqueleto de blocos cinzas e virou um painel
          completo — o mesmo layout, com cada bloco transformado em funcionalidade
          real.
        </p>
      </Reveal>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        <Reveal delay={0.1} className="liquid-glass rounded-2xl p-4">
          <div className="px-1 pb-3 text-xs text-white/50">01 · Wireframe</div>
          <img
            src="./img/wireframe.png"
            alt="Wireframe original do dashboard: blocos cinzas marcando gráfico de barras, cartões e listas"
            className="w-full h-auto rounded-lg border border-white/10 bg-white"
            loading="lazy"
          />
        </Reveal>
        <Reveal delay={0.25} className="liquid-glass rounded-2xl p-4">
          <div className="px-1 pb-3 text-xs text-white/50">02 · Produto</div>
          <img
            src="./img/dashboard.png"
            alt="Dashboard final da VB Cosméticos seguindo o mesmo layout do wireframe"
            className="w-full h-auto rounded-lg border border-white/10"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ── seção 9: módulos ── */

function Modules() {
  const mods = [
    'Dashboard',
    'PDV',
    'Produtos',
    'Clientes',
    'Entradas',
    'Validade',
    'NFC-e',
    'Assistente IA',
  ];
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20">
      <p className="text-center text-xs uppercase tracking-widest text-white/40">
        Tudo que a operação precisa, em oito módulos
      </p>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
        {mods.map((m, i) => (
          <motion.span
            key={m}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="text-center text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors"
          >
            {m}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

/* ── seção 10: depoimentos ── */

function Testimonials() {
  const items = [
    {
      quote:
        'O fechamento do dia, que era uma hora de caderno e calculadora, virou três cliques. O painel passou a fazer parte do balcão.',
      name: 'Priscilla Venturin',
      role: 'Proprietária',
      company: 'VB COSMÉTICOS',
    },
    {
      quote:
        'Pedi “clientes que não compram há 90 dias” e recebi a lista pronta, com telefone e última compra. A IA fala a língua da loja.',
      name: 'Camila Duarte',
      role: 'Consultora de vendas',
      company: 'VB COSMÉTICOS',
    },
    {
      quote:
        'O radar de validade se pagou sozinho: nenhum lote vencido na prateleira desde que o sistema entrou em uso.',
      name: 'Renata Lopes',
      role: 'Estoque & compras',
      company: 'VB COSMÉTICOS',
    },
  ];
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.12} className="liquid-glass rounded-2xl p-6">
            <figure>
              <blockquote className="text-sm text-white/80 leading-[1.6]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-white/10">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-white/50">{t.role}</div>
                <div className="mt-1 text-xs text-white font-semibold tracking-wide">
                  {t.company}
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── seção 11: planos ── */

type Plan = {
  tier: string;
  monthly: string;
  yearly: string;
  desc: string;
  items: string[];
  cta: string;
  href?: string;
  pro?: boolean;
};

function Pricing() {
  const [yearly, setYearly] = useState(false);
  const plans: Plan[] = [
    {
      tier: 'Demo',
      monthly: 'Grátis',
      yearly: 'Grátis',
      desc: 'Para conhecer o sistema agora, com dados simulados.',
      items: [
        'Todos os módulos liberados',
        'Um ano de dados de demonstração',
        'Assistente IA em modo beta',
        'Sem cadastro — direto no navegador',
        'Código aberto no GitHub',
      ],
      cta: 'Abrir demo',
      href: DEMO_URL,
    },
    {
      tier: 'Loja',
      monthly: 'R$ 99/mês',
      yearly: 'R$ 990/ano',
      desc: 'Para a operação diária de uma loja física.',
      items: [
        'Produtos e clientes ilimitados',
        'PDV com emissão de NFC-e',
        'Radar de validade e estoque mínimo',
        'Notificações configuráveis',
        'Suporte em horário comercial',
      ],
      cta: 'Escolher plano',
    },
    {
      tier: 'Rede',
      monthly: 'R$ 249/mês',
      yearly: 'R$ 2.490/ano',
      desc: 'Para redes, franquias e operações com mais de uma loja.',
      items: [
        'Lojas ilimitadas, visão consolidada',
        'Assistente IA sem limites',
        'Metas e comissões por vendedora',
        'Campanhas de aniversário via WhatsApp',
        'Suporte prioritário',
      ],
      cta: 'Falar com vendas',
      pro: true,
    },
  ];

  return (
    <section id="planos" className="vb-pricing-section relative z-10">
      {/* filtro de ruído do watermark */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="vb-noise-pricing">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.075" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="vb-watermark-container">
        <div className="vb-watermark-main">
          <span className="vb-watermark-line-1">Sua loja.</span>
          <span className="vb-watermark-line-2">Reinventada</span>
        </div>
      </div>

      <div className="vb-toggle-wrap">
        <span className="text-sm text-white/70">Anual</span>
        <button
          type="button"
          aria-pressed={yearly}
          aria-label="Alternar cobrança anual"
          className={`vb-toggle ${yearly ? 'active' : ''}`}
          onClick={() => setYearly((v) => !v)}
        >
          <span className="vb-toggle-knob" />
        </button>
      </div>

      <div className="vb-grid">
        {plans.map((p) => (
          <div key={p.tier} className={`vb-card ${p.pro ? 'vb-card-pro' : ''}`}>
            <div className="vb-tier-small">{p.tier}</div>
            <div className="vb-tier-large">{yearly ? p.yearly : p.monthly}</div>
            <p className="vb-desc">{p.desc}</p>
            <ul className="vb-list">
              {p.items.map((item) => (
                <li key={item}>
                  <span className="vb-check">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {p.href ? (
              <a href={p.href} className="vb-btn inline-block text-center">
                {p.cta}
              </a>
            ) : (
              <button type="button" className="vb-btn">
                {p.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── seção 12: CTA final ── */

function FinalCta() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: easeOut }}
        className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
          }}
        />
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
          Feche o caderno.
          <br />
          Abra o painel.
        </h2>
        <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
          O protótipo está no ar com um ano de operação simulada. Entre, clique,
          venda — e veja o que a gestão da VB Cosméticos pode ser.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <DemoButton />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors"
          >
            Ver código no GitHub
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* ── rodapé ── */

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center gap-4 text-xs text-white/50">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <LogoVB className="w-5 h-5" />
          VB Cosméticos<span className="text-[9px] align-super text-[#00d2ff]">®</span>
        </div>
        <p className="sm:mr-auto">
          Protótipo ilustrativo · dados 100% simulados · Vila Velha/ES · 2026
        </p>
        <nav className="flex gap-5 font-medium text-white/70">
          <a href={DEMO_URL} className="hover:text-white transition-colors">
            Demo
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

/* ── app ── */

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* brilho de fundo (fallback caso o vídeo não carregue) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(900px circle at 50% -10%, rgba(11,37,81,0.55), transparent 60%), radial-gradient(700px circle at 85% 110%, rgba(0,210,255,0.12), transparent 60%)',
        }}
      />

      {/* vídeo de fundo fixo */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-60"
          src={VIDEO_URL}
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* linhas-guia verticais */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* filtro de ruído global (headline) */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="vb-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"
          />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <Navbar />
      <Hero />
      <SystemBar />
      <Showcase />
      <DashboardSection />
      <AiSection />
      <CrmSection />
      <ProcessSection />
      <Modules />
      <Testimonials />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  );
}
