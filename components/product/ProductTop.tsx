"use client";
// Simulador da logo (página /produto/[slug]/simulador), no formato "estúdio":
// - à esquerda: nome, descrição, cores e as vistas da peça (frente, costas, manga esquerda e direita);
// - no meio: a peça grande na vista escolhida, com a logo livre (arrasta, puxa os cantos, zoom);
// - à direita: abas "Personalizar" (área, logo, tamanho e técnica) e "Pedido" (tamanhos, frete)
//   e o rodapé com o valor por peça, o total e o botão de compra.
// No computador ocupa a altura da tela: a peça fica parada, a coluna da esquerda aparece inteira
// e só o painel da direita rola.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { getColor, inStock, tintFor, type Position, type Product, type Technique } from "@/lib/catalog";
import { toCatalogTechnique, type ArtTechnique } from "@/lib/qualify";
import { availablePositions, logoSpots, type Placement, type Placements } from "@/lib/mockup";
import { Swatches } from "@/components/ui/primitives";
import { LogoMockup, usePiecePhoto } from "./LogoMockup";
import type { LogoValue } from "./LogoUpload";
import { QuoteBuyBox } from "./QuoteBuyBox";
import { SimPanel } from "./SimPanel";
import { SimStage, VIEW_NAME } from "./SimStage";
import { StockOrderFooter, StockOrderTab, useStockOrder } from "./StockBuyBox";
import { useBrandLogos } from "./useBrandLogo";
import { useLogoAspects } from "./useLogoAspect";
import { usePieceFit } from "./usePieceFit";
import x from "./Simulator.module.css";

/** O que o simulador escolhe e a compra usa. */
export type CustomProps = {
  color: string;
  positions: Position[];
  logos: ReturnType<typeof useBrandLogos>[0];
  placements: Placements;
  technique: Technique | null;
};

type Tab = "custom" | "order";

/** Descrição curta sem os marcadores de lista ("• Manga longa • Modelagem…" → "Manga longa · Modelagem…"). */
const cleanShort = (t: string) => t.replace(/^\s*[•·]\s*/, "").replace(/\s*[•·]\s*/g, " · ").trim();

export function ProductTop({ product }: { product: Product }) {
  const available = availablePositions(product);
  const [logos, setLogo] = useBrandLogos();
  // áreas com logo no pedido (começa com a frente, como antes)
  const [positions, setPositions] = useState<Position[]>(() => available.slice(0, 1));
  // área na tela (a peça grande mostra a vista dela)
  const [active, setActive] = useState<Position>(available[0] ?? "frente");
  // posição/tamanho que o cliente ajustou em cada área (sem ajuste = lugar padrão)
  const [placements, setPlacements] = useState<Placements>({});
  // a técnica define o preço da personalização: começa na primeira do anúncio
  const [technique, setTechnique] = useState<Technique | null>(product.techniques[0] ?? null);
  const [color, setColor] = useState(product.colors[0]);
  const [tab, setTab] = useState<Tab>("custom");
  const online = inStock(product);
  const root = useRef<HTMLDivElement>(null);

  // no computador a página não rola em cima do simulador: a peça fica parada e a roda do mouse
  // só rola o painel da direita (ou a foto com zoom). Ctrl + roda segue sendo o zoom do navegador.
  // Tela baixa (o simulador não cabe inteiro): a página rola normalmente.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onWheel = (e: WheelEvent) => {
      if (!desktop.matches || e.ctrlKey) return;
      // inteiro na tela: abaixo do cabeçalho fixo e acima do pé da janela
      const r = el.getBoundingClientRect();
      const top = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      if (r.top < top - 1 || r.bottom > window.innerHeight + 1) return;
      for (let n = e.target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        const { overflowY, overflowX } = getComputedStyle(n);
        const rolls = (/auto|scroll/.test(overflowY) && n.scrollHeight > n.clientHeight + 1) || (/auto|scroll/.test(overflowX) && n.scrollWidth > n.clientWidth + 1);
        if (rolls) return; // essa parte rola (e não passa a rolagem para a página)
      }
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // vindo da página do produto (?cor=mescla) ou do questionário (?tecnica=bordado),
  // já abre na cor escolhida e com a técnica marcada
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("cor");
    if (c && product.colors.includes(c)) setColor(c);
    const t = toCatalogTechnique(q.get("tecnica") as ArtTechnique | null);
    if (t && product.techniques.includes(t)) setTechnique(t);
  }, [product.colors, product.techniques]);

  const include = (pos: Position) => setPositions((cur) => (cur.includes(pos) ? cur : available.filter((p) => p === pos || cur.includes(p))));
  const exclude = (pos: Position) => setPositions((cur) => cur.filter((p) => p !== pos));

  const onPlace = (pos: Position, placement: Placement | null) =>
    setPlacements((cur) => {
      const next = { ...cur };
      if (placement) next[pos] = placement;
      else delete next[pos];
      return next;
    });

  const onLogo = (pos: Position, next: LogoValue) => {
    // logo nova (ou trocada) começa no lugar padrão (no peito; nas costas, no alto), num tamanho que cabe
    if (next?.thumb !== logos[pos]?.thumb) onPlace(pos, null);
    setLogo(pos, next);
    if (next) include(pos);
  };

  // a vista da área na tela: foto, contorno da peça (a logo não sai dela) e proporção da logo
  const spots = logoSpots(product, technique);
  const spot = spots[active] ?? spots[available[0]]!;
  const tint = tintFor(product, color);
  const photo = usePiecePhoto(product, spot.view, color, tint);
  const fits = usePieceFit(photo.base, photo.flip);
  const aspectOf = useLogoAspects([logos[active]?.thumb]);
  const aspect = aspectOf(logos[active]?.thumb);

  const custom: CustomProps = { color, positions, logos, placements, technique };
  const order = useStockOrder(product, custom, () => setTab("order"));
  const colorName = getColor(color)?.name ?? "";

  return (
    <div className={x.sim} ref={root}>
      {/* coluna da esquerda (no celular, os blocos vão para cima e para baixo da peça) */}
      <div className={x.side}>
        <div className={x.info}>
          <Link href={`/produto/${product.slug}`} className={x.back}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className={x.head}>
            <h1 className={x.title}>{product.name}</h1>
            {product.short && <p className={x.short}>{cleanShort(product.short)}</p>}
          </div>
          <div className={x.colors}>
            <h2 className={x.label}>Cores disponíveis</h2>
            <Swatches ids={product.colors} value={color} onChange={setColor} size="lg" />
            <span className={x.colorName}>{colorName}</span>
          </div>
        </div>

        <nav className={x.views} aria-label="Visualização">
        <h2 className={x.label}>Visualização</h2>
        <div className={x.viewList} data-count={available.length}>
          {available.map((pos) => {
            const s = spots[pos]!;
            const on = positions.includes(pos);
            return (
              <button key={pos} type="button" className={x.viewBtn} aria-pressed={active === pos} onClick={() => setActive(pos)}>
                <span className={x.viewThumb}>
                  <LogoMockup
                    product={product}
                    view={s.view}
                    positions={on ? [pos] : []}
                    logos={{ [pos]: logos[pos]?.thumb }}
                    placements={placements}
                    markers={false}
                    color={color}
                    tint={tint}
                    technique={technique}
                    alt=""
                  />
                </span>
                <span className={x.viewName}>{VIEW_NAME[pos]}</span>
                {on && (
                  <span className={x.viewOn} aria-label="com logo">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </nav>
      </div>

      <div className={x.center}>
      <SimStage
        key={active}
        product={product}
        pos={active}
        spot={spot}
        included={positions.includes(active)}
        logo={logos[active]}
        placements={placements}
        aspect={aspect}
        fits={fits}
        color={color}
        tint={tint}
        technique={technique}
        onPlace={onPlace}
        onInclude={() => include(active)}
        onRemoveLogo={() => onLogo(active, null)}
      />
      </div>

      <section className={x.panel} aria-label="Personalização e pedido">
        <div className={x.tabs} role="tablist" aria-label="Etapas">
          <button type="button" role="tab" id="sim-tab-custom" aria-controls="sim-custom" aria-selected={tab === "custom"} onClick={() => setTab("custom")}>
            Personalizar
          </button>
          <button type="button" role="tab" id="sim-tab-order" aria-controls="sim-order" aria-selected={tab === "order"} onClick={() => setTab("order")}>
            Pedido {online && order.qty > 0 && <span className={x.tabCount}>{order.qty}</span>}
          </button>
        </div>

        {/* só esta parte rola; as abas ficam em cima e o preço com o botão, embaixo */}
        <div className={x.panelScroll}>
        <div role="tabpanel" id="sim-custom" aria-labelledby="sim-tab-custom" hidden={tab !== "custom"}>
          <SimPanel
            product={product}
            fees={online}
            available={available}
            active={active}
            onActive={setActive}
            positions={positions}
            onInclude={include}
            onExclude={exclude}
            logos={logos}
            onLogo={onLogo}
            placements={placements}
            onPlace={onPlace}
            spot={spot}
            aspect={aspect}
            fits={fits}
            technique={technique}
            onTechnique={setTechnique}
          />
        </div>
        <div role="tabpanel" id="sim-order" aria-labelledby="sim-tab-order" hidden={tab !== "order"}>
          {online ? (
            <StockOrderTab product={product} order={order} color={color} positions={positions} />
          ) : (
            <div className={x.tabBody}>
              <QuoteBuyBox product={product} {...custom} step={1} />
            </div>
          )}
        </div>
        </div>

        {online && <StockOrderFooter product={product} order={order} positions={positions} />}
      </section>
    </div>
  );
}
