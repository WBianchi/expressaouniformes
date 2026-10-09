# Redesign v2 — briefing comum (out/2026)

## Conceito do negócio
Expressão Uniformes: fábrica de uniformes, prioridade B2B, mas também atende pessoa física (igrejas, eventos, grupos).
**Duas formas de venda no mesmo site:**

1. **Pronta-entrega / "Pronta para personalizar"** (`kind: "stock"`) — e-commerce rápido.
   Cliente escolhe modelo, cor, grade de tamanhos (mín. 5 peças), posições da logo (frente/costas/manga),
   envia a logo → paga (Asaas: Pix, boleto, cartão) → a loja envia o layout → **cliente aprova no site** (área "Minha conta › Pedidos")
   → produção e envio.
2. **Produção sob medida** (`kind: "custom"`) — consultivo, para empresas/atacado.
   Cliente monta a peça (tecido, gola, punho, friso, manga, cores, extras), informa quantidade (mín. 30) e
   envia um briefing → atendimento por **WhatsApp** com consultor. Sem preço fixo, sem checkout.

O antigo estúdio 2D/3D (Fabric/Three) foi removido: o cliente concluiu que simulador não vende para empresas.

Referência visual enviada pelo cliente: header com busca grande, barra azul-marinho com menu (Produtos, Monte seu uniforme,
Para empresas, Sobre nós, Ajuda) e selos (Produção própria · Entrega para todo o Brasil · A partir de 5 peças);
sidebar de categorias com ícones; bloco verde "PRONTA PARA PERSONALIZAR"; bloco azul "PRODUÇÃO SOB MEDIDA" com cards de
modelos (Polo com friso, bicolor, gola personalizada, manga longa, alta visibilidade); faixa "Precisa de um uniforme completo?".
Queremos algo **mais sofisticado** que a referência: profissional, premium, micro-interações, blur/glass, patterns sutis.

## Marca
Logo real: símbolo azul/ciano + "EXPRESSÃO" + "UNIFORMES" dourado.
- `/images/logo-on-light.png` (texto navy, para fundos claros) e `/images/logo-on-dark.png` (texto branco). 428×100.
- Paleta: navy `--brand-800`, azul `--brand-500`, ciano `--cyan-500`, dourado `--gold-500` (CTA principal = `.btn-accent`, gradiente dourado).
- Fontes: Sora (títulos, `--font-display`) e Plus Jakarta Sans (texto, `--font-sans`), via next/font no `app/layout.tsx`.
- Ícones: `lucide-react` (stroke 1.75 em ícones decorativos).

## Regras técnicas (OBRIGATÓRIAS)
- **Next.js 16.3** (App Router, Turbopack, React 19.2). Leia os guias em `node_modules/next/dist/docs/` antes de usar APIs.
  `params`/`searchParams` são Promises. `middleware` agora se chama `proxy`. Não use `runtime = 'edge'`.
- **Estilo: CSS Modules** (`Componente.module.css`) consumindo SOMENTE os tokens de `app/globals.css`
  (cores, raio, sombra, `--blur`, `--pattern-dots`, `--pattern-grid`, `--gradient-brand`, `--gradient-gold`, `--ease`, `--dur*`).
  Nunca cores fixas que quebrem o dark mode — tudo deve funcionar em **claro e escuro**. Não edite `app/globals.css`
  (peça ao orquestrador se faltar token). Classes globais disponíveis: `.container .btn .btn-primary .btn-accent .btn-outline
  .btn-ghost .btn-whatsapp .btn-sm .btn-lg .btn-block .icon-btn .input .chip .chip-success .chip-brand .chip-gold
  .skeleton .pattern-dots .pattern-grid .sr-only .animate-fade-up`. Keyframes: `fade-up fade-in pop shimmer`.
- **Mobile first**, sem scroll horizontal, gutter `var(--gutter)`. Acessível: foco visível, aria, teclado, `prefers-reduced-motion` já tratado.
- Textos em **português do Brasil** com acentuação correta.
- Não adicionar dependências sem necessidade forte (já temos lucide-react, @radix-ui/react-dialog, sonner, zod).
- Sem dados falsos apresentados como reais (métricas, depoimentos podem existir como exemplo, sem nomes de pessoas reais).

## Feedback do usuário (prioridade máxima)
"Layout muito espremido, quero boa largura; seções pobres; falta motion; faltam imagens."
- Largura: `.container` agora vai até 1680px com gutter fluido; `.container-wide` até 1920px; hero e faixas podem ser full-bleed (100vw).
  Grids devem usar o espaço: 4–5 colunas de produtos em ≥1440px, 6 em ≥1800px. Espaçamento vertical `var(--section-y)`.
- Motion: revelação ao rolar com `data-reveal` (+ `--reveal-delay` para stagger; um IntersectionObserver troca para `data-reveal="in"`),
  keyframes globais `float marquee ken-burns gradient-pan fade-up pop shimmer`. Parallax leve, marquees, contadores, hover com profundidade,
  transições de abas/slides. Respeitar `prefers-reduced-motion` (já global).
- Imagens: seções devem ser ricas em fotografia (geradas com gpt-image-2.5). Caminhos extras em `/images/sections/` (ver lista abaixo).
- Imagens de seção (geradas): `/images/sections/about-factory.webp`, `how-1.webp`..`how-4.webp` (passos), `segment-<saude|industria|alimentacao|educacao|igrejas|eventos|comercio>.webp`,
  `custom-hero.webp`, `quality-fabric.webp`, `embroidery.webp`, `team-corporate.webp`, `cta-bg.webp`, `catalog-hero.webp`, `account-bg.webp`.

## Contratos compartilhados (já existem — use, não reescreva)
- `lib/catalog.ts` — `products`, `stockProducts`, `customProducts`, `categories`, `colors`, `getProduct`, `getCategory`,
  `getColor`, `positionFees`, `customOptions`, `company`, `whatsappLink(text)`, `money(n)`. Tipos `Product`, `Category`, `Size`, `Position`.
- `lib/pricing.ts` — `CartLine`, `unitPrice`, `lineTotal`, `lineQuantity`, `volumeTiers`, `volumeDiscount`, `coupons`,
  `validateCoupon`, `quoteShipping`, `totals`, `FREE_SHIPPING_FROM`, `PIX_DISCOUNT`, `maxInstallments`.
- `lib/validation.ts` — `cartLineSchema`, `addressSchema`, `customerSchema`.
- `components/store/StoreProvider.tsx` — `useStore()`: `cart addToCart updateLine removeLine clearCart coupon applyCoupon
  removeCoupon cep setCep shippingOptions shipping selectShipping summary favorites isFavorite toggleFavorite
  drawer openDrawer closeDrawer theme setTheme ready`. `drawer` ∈ `"cart" | "favorites" | "menu" | "search" | null`.
- `components/ui/` — `ProductCard`, `Drawer` (Radix, lateral/bottom), `primitives.tsx`: `SafeImage`, `Swatches`, `Price`,
  `Stepper`, `Rating`, `SectionHeader`, `CategoryIcon`, `categoryIcons`. Pode melhorar estilos em `ui.module.css` só se for o dono (orquestrador).
- Imagens (geradas em paralelo; use `SafeImage`, que tem fallback): `/images/products/<slug>.webp`,
  `/images/categories/<slug>.webp`, `/images/banners/hero-1.webp` `hero-2.webp` `hero-3.webp` (21:9, desktop),
  `/images/banners/hero-1-mobile.webp` … (4:5), `/images/banners/promo-empresas.webp`, `promo-eventos.webp`,
  `promo-sob-medida.webp`, `promo-kit-completo.webp` (16:9), `/images/banners/login.webp` (4:5).

## Rotas (grupo `app/(store)` com header/footer; `app/login` fora do grupo)
`/` home · `/loja` (+ `?categoria=`, `?tipo=stock|custom`, `?q=`) · `/produto/[slug]` · `/sob-medida` (configurador + briefing)
· `/carrinho` · `/checkout` · `/pedido/[id]` (confirmação/pagamento) · `/conta` (perfil, pedidos, aprovação de layout,
favoritos) · `/favoritos` · `/contato` · `/privacidade` · `/login` · `/admin` (legado, não mexer).

## Divisão de trabalho (cada agente só cria/edita seus arquivos)
| Agente | Arquivos |
|---|---|
| chrome | `app/(store)/layout.tsx`, `components/layout/**` (Header, mega menu, busca, MiniCart, Favoritos drawer, menu de perfil, ThemeToggle, MobileMenu, MobileTabBar, Footer, WhatsAppFab) |
| home | `app/(store)/page.tsx`, `components/home/**`, `app/(store)/contato/**`, `app/(store)/privacidade/**`, `app/not-found.tsx` |
| catálogo/produto | `app/(store)/loja/**`, `app/(store)/produto/**`, `app/(store)/favoritos/**`, `components/catalog/**`, `components/product/**` |
| sob medida/conta/login | `app/(store)/sob-medida/**`, `app/(store)/conta/**`, `app/login/**`, `components/custom/**`, `components/account/**`, `components/auth/**` |
| carrinho/checkout/Asaas | `app/(store)/carrinho/**`, `app/(store)/checkout/**`, `app/(store)/pedido/**`, `app/api/checkout/**`, `app/api/webhooks/asaas/**`, `lib/asaas.ts`, `lib/orders.ts`, `components/cart/**`, `components/checkout/**` |
| imagens | `scripts/generate-images.mjs`, `public/images/**` |

Verificação: `npx tsc --noEmit` (corrija apenas erros dos SEUS arquivos — outros agentes estão trabalhando em paralelo) e `npm test`.
