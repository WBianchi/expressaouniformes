import { StoreShell } from "@/components/store/Chrome";
export const metadata = { title: "Fale com a Expressão" };
export default function Page() {
  return (
    <StoreShell>
      <section className="text-page">
        <span className="eyebrow">DIRETO COM QUEM FAZ</span>
        <h1>Vamos vestir a sua ideia?</h1>
        <p>
          A Expressão Uniformes fica em Cajamar, São Paulo. Para conversar sobre
          tecidos, quantidades, aplicação de logos e prazos, consulte os canais
          oficiais da fábrica.
        </p>
        <div className="button-row">
          <a
            className="button primary"
            href="https://expressaouniformes.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            Site oficial e atendimento
          </a>
          <a
            className="button secondary"
            href="https://www.instagram.com/expressaouniformes/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
      </section>
    </StoreShell>
  );
}
