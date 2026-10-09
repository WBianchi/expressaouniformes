import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, PackageCheck, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import s from "@/components/auth/Auth.module.css";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  description: "Acesse sua conta Expressão Uniformes para acompanhar pedidos e aprovar layouts.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className={s.page}>
      <span className={s.blob} data-v="1" aria-hidden />
      <span className={s.blob} data-v="2" aria-hidden />
      <span className={s.blob} data-v="3" aria-hidden />

      <header className={s.top}>
        <Link href="/" className={s.backHome}>
          <ArrowLeft size={16} /> Voltar para a loja
        </Link>
      </header>

      <div className={s.shell}>
        <aside className={s.side} aria-hidden>
          {/* imagem com fallback de gradiente quando o arquivo ainda não existir */}
          <span className={s.sideImg} style={{ backgroundImage: "url(/images/banners/login.webp)" }} />
          <div className={s.sideContent}>
            <span className={s.sideEyebrow}>Área do cliente</span>
            <p className={s.sideTitle}>Seus uniformes, do layout à entrega, em um só lugar.</p>
            <ul>
              <li>
                <PackageCheck size={18} /> Acompanhe cada etapa do pedido
              </li>
              <li>
                <BadgeCheck size={18} /> Aprove o layout da sua logo online
              </li>
              <li>
                <ShieldCheck size={18} /> Pagamento seguro via Pix, boleto ou cartão
              </li>
            </ul>
          </div>
        </aside>

        <div className={s.cardCol}>
          <Link href="/" className={s.logo} aria-label="Expressão Uniformes — página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-on-light.png" alt="Expressão Uniformes" width={214} height={50} className={s.logoLight} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-on-dark.png" alt="" width={214} height={50} className={s.logoDark} />
          </Link>
          <AuthCard />
        </div>
      </div>
    </main>
  );
}
