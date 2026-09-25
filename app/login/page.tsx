import Link from "next/link";
import { UserRound, ArrowRight } from "lucide-react";
import { StoreShell } from "@/components/store/Chrome";
export const metadata = { title: "Minha conta" };
export default function Page() {
  return (
    <StoreShell>
      <section className="login-layout">
        <div>
          <span className="eyebrow">SUA MARCA, SEMPRE POR PERTO</span>
          <h1>
            Bom ter
            <br />
            você de volta.
          </h1>
          <p>
            Um espaço para acompanhar pedidos,
            <br />
            guardar projetos e vestir novas ideias.
          </p>
        </div>
        <div className="login-card">
          <UserRound size={30} />
          <h2>Minha conta</h2>
          <p>
            A área de acesso está em preparação. Na prévia, você pode criar e
            salvar rascunhos no seu navegador sem cadastro.
          </p>
          <div className="notice">
            <p>
              Login, recuperação de senha e histórico de pedidos dependem da
              conexão segura com o banco.
            </p>
          </div>
          <Link href="/loja" className="button primary">
            Explorar e personalizar <ArrowRight size={17} />
          </Link>
          <Link href="/admin" className="text-button">
            Ver demonstração do painel administrativo
          </Link>
        </div>
      </section>
    </StoreShell>
  );
}
