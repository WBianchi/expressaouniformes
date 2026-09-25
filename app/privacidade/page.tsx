import { StoreShell } from "@/components/store/Chrome";
export const metadata = { title: "Privacidade da prévia" };
export default function Page() {
  return (
    <StoreShell>
      <section className="text-page">
        <span className="eyebrow">TRANSPARÊNCIA DESDE O COMEÇO</span>
        <h1>Privacidade nesta prévia.</h1>
        <p>
          Esta versão demonstrativa guarda carrinho, favoritos, preferência de
          armazenamento e rascunhos no armazenamento local do seu navegador.
          Logos enviados ao estúdio são processados no dispositivo; não são
          enviados ao banco ou ao armazenamento de arquivos.
        </p>
        <p>
          Não há analytics, pixels de publicidade, login ou pagamento ativos. O
          formulário de checkout não transmite seus dados. Limpar os dados do
          navegador apaga os projetos locais; você pode exportá-los pelo
          estúdio.
        </p>
        <p>
          Fontes são carregadas do Google Fonts. Imagens e o modelo de camiseta
          são servidos pela própria aplicação. A política definitiva, incluindo
          responsáveis, contato e retenção, será publicada antes da abertura da
          loja.
        </p>
      </section>
    </StoreShell>
  );
}
