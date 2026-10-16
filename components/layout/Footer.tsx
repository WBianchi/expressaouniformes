import Link from "next/link";
import { Clock, Instagram, Lock, Mail, MapPin, Phone, ShieldCheck, BadgeCheck, ChevronDown } from "lucide-react";
import { categories, company, whatsappLink } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui/primitives";
import { Logo } from "./Logo";
import { BarcodeIcon, CardIcon, PixIcon, WhatsAppIcon } from "./icons";
import s from "./Footer.module.css";

type Col = { title: string; links: { href: string; label: string; external?: boolean }[] };

const cols: Col[] = [
  {
    title: "Institucional",
    links: [
      { href: "/loja?tipo=stock", label: "Pronta-entrega" },
      { href: "/orcamento", label: "Monte seu pedido" },
      { href: "/contato", label: "Fale conosco" },
      { href: "/privacidade", label: "Política de privacidade" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/contato", label: "Central de atendimento" },
      { href: "/conta#pedidos", label: "Acompanhar pedido" },
      { href: "/conta#layout", label: "Aprovar layout" },
      { href: "/contato#trocas", label: "Trocas e devoluções" },
      { href: "/contato#tabela-medidas", label: "Tabela de medidas" },
    ],
  },
  {
    title: "Categorias",
    links: categories.map((c) => ({ href: `/loja?categoria=${c.slug}`, label: c.name })),
  },
];

const payments = [
  { label: "Pix", Icon: PixIcon, tone: "pix" },
  { label: "Boleto", Icon: BarcodeIcon, tone: "boleto" },
  { label: "Crédito até 6x", Icon: CardIcon, tone: "card" },
  { label: "Débito", Icon: CardIcon, tone: "debit" },
];

function Contact() {
  return (
    <ul className={s.contact}>
      <li>
        <a href={whatsappLink("Olá! Vim pelo site.")} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={17} /> WhatsApp
        </a>
      </li>
      <li>
        <a href={`tel:${company.phone.replace(/\D/g, "")}`}>
          <Phone size={16} strokeWidth={1.75} /> {company.phone}
        </a>
      </li>
      <li>
        <a href={`mailto:${company.email}`}>
          <Mail size={16} strokeWidth={1.75} /> {company.email}
        </a>
      </li>
      <li>
        <span>
          <Clock size={16} strokeWidth={1.75} /> {company.hours}
        </span>
      </li>
      <li>
        <span>
          <MapPin size={16} strokeWidth={1.75} /> {company.address}
        </span>
      </li>
    </ul>
  );
}

function LinkList({ col }: { col: Col }) {
  return (
    <ul className={s.links}>
      {col.links.map((l) => (
        <li key={l.label}>
          <Link href={l.href}>{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}

/** Rodapé completo: CTA, colunas, pagamentos, selos e barra inferior. Acordeão no mobile. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={`container ${s.main}`}>
        {/* ---------- marca ---------- */}
        <div className={s.brand}>
          <Logo height={40} />
          <p>Fábrica de uniformes profissionais. Uniformes prontos para personalizar com a sua logo e pedidos para empresas de todo o Brasil.</p>
          <ul className={s.seals}>
            <li><BadgeCheck size={16} strokeWidth={1.75} /> Produção própria</li>
            <li><ShieldCheck size={16} strokeWidth={1.75} /> Compra segura</li>
          </ul>
          <div className={s.social}>
            <a href={company.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Expressão Uniformes">
              <Instagram size={19} strokeWidth={1.75} />
            </a>
            <a href={whatsappLink("Olá! Vim pelo site.")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp da Expressão Uniformes">
              <WhatsAppIcon size={19} />
            </a>
            <a href={`mailto:${company.email}`} aria-label="E-mail da Expressão Uniformes">
              <Mail size={19} strokeWidth={1.75} />
            </a>
          </div>
        </div>

        {/* ---------- colunas (desktop) ---------- */}
        <div className={s.cols}>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className={s.col}>
              <h3>{c.title}</h3>
              {c.title === "Categorias" ? (
                <ul className={s.links}>
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link href={`/loja?categoria=${cat.slug}`}>
                        <CategoryIcon name={cat.icon} size={15} /> {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <LinkList col={c} />
              )}
            </nav>
          ))}
          <div className={s.col}>
            <h3>Contato</h3>
            <Contact />
          </div>
        </div>

        {/* ---------- acordeão (mobile) ---------- */}
        <div className={s.accordion}>
          {cols.map((c) => (
            <details key={c.title} className={s.acc}>
              <summary>
                {c.title}
                <ChevronDown size={18} />
              </summary>
              <nav aria-label={c.title}>
                <LinkList col={c} />
              </nav>
            </details>
          ))}
          <details className={s.acc} open>
            <summary>
              Contato
              <ChevronDown size={18} />
            </summary>
            <Contact />
          </details>
        </div>
      </div>

      {/* ---------- pagamentos e segurança ---------- */}
      <div className="container">
        <div className={s.trust}>
          <div className={s.trustGroup}>
            <span className={s.trustLabel}>Formas de pagamento</span>
            <ul className={s.payments}>
              {payments.map(({ label, Icon, tone }) => (
                <li key={label} data-tone={tone}>
                  <Icon size={18} /> {label}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.trustGroup}>
            <span className={s.trustLabel}>Segurança</span>
            <ul className={s.payments}>
              <li data-tone="safe"><Lock size={16} /> Site protegido (SSL)</li>
              <li data-tone="safe"><ShieldCheck size={16} /> Pagamento processado pelo Asaas</li>
              <li data-tone="safe"><BadgeCheck size={16} /> Dados tratados conforme a LGPD</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- barra inferior ---------- */}
      <div className={s.bottom}>
        <div className={`container ${s.bottomInner}`}>
          <p>
            © {year} {company.name}. Todos os direitos reservados. · CNPJ 00.000.000/0001-00 (a confirmar)
          </p>
          <nav aria-label="Legal" className={s.legal}>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/conta">Minha conta</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
