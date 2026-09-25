import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>Esta página não está no catálogo.</h1>
      <p>Vamos encontrar a peça certa para você?</p>
      <Link className="button primary" href="/loja">
        Voltar para a loja
      </Link>
    </main>
  );
}
