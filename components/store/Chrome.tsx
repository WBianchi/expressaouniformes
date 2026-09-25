"use client";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  ArrowUpRight,
  Menu,
  MessageCircle,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./StoreProvider";
export function Header() {
  const { cart } = useStore();
  const [search, setSearch] = useState(""),
    [menu, setMenu] = useState(false);
  const router = useRouter();
  return (
    <>
      <div className="announcement">
        <span>Da nossa fábrica para a sua equipe.</span>
        <span>
          Personalização que faz a diferença <ArrowUpRight size={13} />
        </span>
      </div>
      <header className="header">
        <Link
          href="/"
          className="brand"
          aria-label="Expressão Uniformes, início"
        >
          <span className="brand-symbol">
            e<span />
          </span>
          <span>
            expressão<small>U N I F O R M E S</small>
          </span>
        </Link>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/loja?q=" + encodeURIComponent(search));
          }}
        >
          <Search size={19} />
          <input
            aria-label="Buscar uniformes"
            placeholder="O que sua equipe precisa vestir?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>↵</kbd>
        </form>
        <div className="header-actions">
          <Link href="/loja?favoritos=1" aria-label="Favoritos">
            <Heart size={22} />
          </Link>
          <Link href="/login" className="account">
            <UserRound size={22} />
            <span>
              Olá, boas-vindas<small>Minha conta</small>
            </span>
          </Link>
          <Link
            href="/carrinho"
            className="cart-icon"
            aria-label={`Carrinho com ${cart.length} itens`}
          >
            <ShoppingBag size={22} />
            <b>{cart.length}</b>
          </Link>
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenu(!menu)}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>
        </div>
      </header>
      <nav className={"navigation " + (menu ? "expanded" : "")}>
        <Link href="/loja">
          <Menu size={17} /> Todos os uniformes
        </Link>
        <Link href="/loja?categoria=Camisetas">Camisetas</Link>
        <Link href="/loja?categoria=Operacional">Linha operacional</Link>
        <Link href="/loja?categoria=Saúde">Saúde e bem-estar</Link>
        <Link href="/loja?categoria=Gastronomia">Gastronomia</Link>
        <Link href="/loja?categoria=Eventos">Eventos</Link>
        <Link href="/loja" className="nav-highlight">
          Crie do seu jeito <ArrowUpRight size={16} />
        </Link>
      </nav>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brand-symbol">e</span>
            <span>
              expressão<small>U N I F O R M E S</small>
            </span>
          </Link>
          <p>
            Vestindo a identidade de quem
            <br />
            faz a diferença todos os dias.
          </p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link href="/loja">Todos os uniformes</Link>
          <Link href="/loja?categoria=Camisetas">Camisetas personalizadas</Link>
          <Link href="/loja?categoria=Operacional">Linha operacional</Link>
        </div>
        <div>
          <strong>Conte com a gente</strong>
          <a
            href="https://expressaouniformes.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            Sobre a Expressão
          </a>
          <Link href="/contato">Fale com a fábrica</Link>
          <Link href="/login">Minha conta</Link>
        </div>
        <div>
          <strong>Feito para a sua empresa.</strong>
          <p>
            Cajamar, São Paulo
            <br />
            Bordado · Silk · Sublimação
          </p>
          <Link href="/admin">
            Área administrativa <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Expressão Uniformes</span>
        <span>Catálogo demonstrativo · valores ilustrativos</span>
        <Link href="/privacidade">Privacidade</Link>
      </div>
    </footer>
  );
}
export function FloatingTools() {
  const [chat, setChat] = useState(false),
    [cookies, setCookies] = useState(false);
  useEffect(() => {
    setCookies(!localStorage.getItem("expressao-cookie-choice"));
  }, []);
  function choose(value: string) {
    localStorage.setItem("expressao-cookie-choice", value);
    setCookies(false);
  }
  return (
    <>
      {cookies && (
        <aside
          className="cookie-card"
          aria-label="Preferências de armazenamento"
        >
          <SlidersHorizontal size={20} />
          <div>
            <strong>Você escolhe suas preferências</strong>
            <p>
              Usamos armazenamento local para seu carrinho e projetos. Analytics
              e marketing não estão ativos nesta prévia.
            </p>
            <div className="button-row">
              <button onClick={() => choose("essential")}>
                Somente essenciais
              </button>
              <button className="text-button" onClick={() => choose("all")}>
                Aceitar
              </button>
              <Link href="/privacidade">Saiba mais</Link>
            </div>
          </div>
        </aside>
      )}
      {chat && (
        <aside className="chat-card">
          <div className="row-between">
            <strong>Olá! Vamos vestir sua ideia?</strong>
            <button
              aria-label="Fechar atendimento"
              onClick={() => setChat(false)}
              className="icon-button"
            >
              <X size={18} />
            </button>
          </div>
          <p>
            Converse com a equipe da Expressão sobre tecidos, quantidades e
            personalização.
          </p>
          <Link href="/contato" className="button primary">
            Ver canais de atendimento <ArrowUpRight size={16} />
          </Link>
        </aside>
      )}
      <button
        className="chat-button"
        aria-label="Abrir atendimento"
        onClick={() => setChat(!chat)}
      >
        <MessageCircle size={23} />
      </button>
    </>
  );
}
export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingTools />
    </>
  );
}
