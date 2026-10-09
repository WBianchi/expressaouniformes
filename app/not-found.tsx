import Link from "next/link";
import { ArrowLeft, MessageCircle, Search, Shirt } from "lucide-react";
import { categories, whatsappLink } from "@/lib/catalog";
import s from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={s.page}>
      {/* React 19 eleva <title> ao <head>; o Next já injeta robots noindex nas respostas 404 */}
      <title>Página não encontrada | Expressão Uniformes</title>
      <span className={s.bg} aria-hidden />
      <span className={s.orb} aria-hidden />
      <span className={s.orb2} aria-hidden />

      <Link href="/" className={s.logo} aria-label="Expressão Uniformes — página inicial">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-on-light.png" alt="" width={214} height={50} className={s.logoLight} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-on-dark.png" alt="" width={214} height={50} className={s.logoDark} />
      </Link>

      <div className={s.card}>
        <div className={s.code} aria-hidden>
          <span>4</span>
          <span className={s.shirt}>
            <Shirt size={64} strokeWidth={1.4} />
          </span>
          <span>4</span>
        </div>
        <h1>Esta página saiu do catálogo</h1>
        <p>O endereço pode ter mudado ou o link está incompleto. Que tal voltar ao início ou explorar os nossos uniformes?</p>
        <div className={s.actions}>
          <Link href="/" className="btn btn-primary btn-lg">
            <ArrowLeft size={18} /> Voltar ao início
          </Link>
          <Link href="/loja" className="btn btn-accent btn-lg">
            <Search size={18} /> Ver a loja
          </Link>
        </div>

        <div className={s.quick}>
          <small>Categorias populares</small>
          <ul>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/loja?categoria=${c.slug}`} className={s.chip}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <a className={s.help} href={whatsappLink("Olá! Não encontrei uma página no site, podem me ajudar?")} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={16} /> Precisa de ajuda? Fale com a gente no WhatsApp
        </a>
      </div>
    </main>
  );
}
