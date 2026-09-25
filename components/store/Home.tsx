"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Shirt,
  HardHat,
  HeartPulse,
  ChefHat,
  Users,
  Truck,
  ShieldCheck,
  Palette,
  Factory,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { products } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import ProductCard from "./ProductCard";
import { StoreShell } from "./Chrome";
const segments = [
  ["Camisetas", Shirt],
  ["Operacional", HardHat],
  ["Saúde", HeartPulse],
  ["Gastronomia", ChefHat],
  ["Eventos", Users],
] as const;
export default function Home() {
  const { openStudio } = useStore();
  const [slide, setSlide] = useState(0);
  return (
    <StoreShell>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">
            <span /> UNIFORMES COM A SUA IDENTIDADE
          </span>
          <h1>
            {slide === 0 ? (
              <>
                Sua marca.
                <br />
                Sua equipe.
                <br />
                <em>Uma só expressão.</em>
              </>
            ) : (
              <>
                Cada detalhe
                <br />
                conta a sua
                <br />
                <em>história.</em>
              </>
            )}
          </h1>
          <p>
            Uniformes que conectam pessoas à sua marca.
            <br />
            Escolha a peça. Crie sua personalização. Vista sua ideia.
          </p>
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => openStudio(products[0])}
            >
              Personalize seu uniforme <ArrowUpRight size={19} />
            </button>
            <Link className="button secondary" href="/loja">
              Explorar coleção
            </Link>
          </div>
          <div className="hero-note">
            <ShieldCheck size={18} />
            <span>Fabricação própria. Cuidado em cada costura.</span>
          </div>
        </div>
        <div className="hero-art">
          <span className="hero-ring" />
          <span className="hero-word">EXPRESSE.</span>
          <Image
            src="/images/uniformes.png"
            alt="Uniformes da Expressão: polo, camisa social e linha operacional"
            fill
            priority
            sizes="(max-width: 800px) 90vw, 50vw"
            style={{ objectFit: "contain" }}
          />
          <div className="floating-label label-top">
            <Palette size={22} />
            <div>
              <strong>Do seu jeito</strong>
              <span>Sua logo, suas cores.</span>
            </div>
          </div>
          <button
            className="floating-label label-bottom"
            onClick={() => openStudio(products[0])}
          >
            <span className="yellow-icon">
              <Sparkles size={20} />
            </span>
            <div>
              <strong>Sua marca ganha forma</strong>
              <span>
                Experimente nosso estúdio <ArrowUpRight size={13} />
              </span>
            </div>
          </button>
          <div className="slider-control">
            <button
              aria-label="Banner anterior"
              onClick={() => setSlide(1 - slide)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              0{slide + 1} <i>/ 02</i>
            </span>
            <button
              aria-label="Próximo banner"
              onClick={() => setSlide(1 - slide)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <div className="benefits">
        <div>
          <Factory />
          <span>
            <strong>Direto de quem faz</strong>
            <small>Confecção própria</small>
          </span>
        </div>
        <div>
          <Palette />
          <span>
            <strong>Personalização de verdade</strong>
            <small>Bordado, silk e sublimação</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Feito para durar</strong>
            <small>Cuidado em cada detalhe</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            <strong>Do projeto à entrega</strong>
            <small>Sua equipe bem acompanhada</small>
          </span>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PARA CADA ROTINA, UMA SOLUÇÃO</span>
            <h2>Qual é a sua expressão?</h2>
          </div>
          <Link href="/loja">
            Todas as categorias <ArrowRight size={18} />
          </Link>
        </div>
        <div className="category-grid">
          {segments.map(([name, Icon], i) => (
            <Link
              key={name}
              href={"/loja?categoria=" + encodeURIComponent(name)}
            >
              <span className={"category-icon tone-" + i}>
                <Icon size={35} strokeWidth={1.4} />
              </span>
              <strong>{name}</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="section bestseller">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OS FAVORITOS DAS EQUIPES</span>
            <h2>Prontos para receber sua marca.</h2>
          </div>
          <Link href="/loja">
            Ver todos os produtos <ArrowRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="studio-banner">
        <div>
          <span className="eyebrow">ESTÚDIO EXPRESSÃO</span>
          <h2>
            Uma ideia sua.
            <br />
            Um uniforme único.
          </h2>
          <p>
            Adicione sua logo, experimente cores e veja
            <br />a sua criação ganhar forma em 3D.
          </p>
          <button
            className="button yellow"
            onClick={() => openStudio(products[0])}
          >
            Começar a criar <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="studio-steps">
          {[
            ["01", "Escolha sua peça", "Uma base para a sua identidade."],
            ["02", "Dê o seu toque", "Cores, logo e textos no seu lugar."],
            ["03", "Vista sua equipe", "Revise sua criação e monte sua grade."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <b>{n}</b>
              <span>
                <strong>{t}</strong>
                <p>{d}</p>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="section story">
        <span className="eyebrow">MUITO ALÉM DO UNIFORME</span>
        <h2>
          É sobre pertencer.
          <br />E representar bem.
        </h2>
        <p>
          Da operação ao atendimento, cada pessoa carrega um pouco da sua
          empresa. Nós ajudamos sua equipe a vestir essa identidade com
          conforto, qualidade e personalidade.
        </p>
        <Link href="/contato" className="button secondary">
          Conheça a nossa fábrica <ArrowUpRight size={17} />
        </Link>
      </section>
    </StoreShell>
  );
}
