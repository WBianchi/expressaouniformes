import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { company, whatsappLink } from "@/lib/catalog";
import { Toc } from "./Toc";
import s from "./privacidade.module.css";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Saiba como a Expressão Uniformes coleta, usa e protege os seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
  alternates: { canonical: "/privacidade" },
};

const UPDATED = "outubro de 2026";

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "quem-somos",
    title: "Quem somos",
    body: (
      <>
        <p>
          Esta política explica como a <b>{company.name}</b> (“nós”) trata os dados pessoais de quem navega, compra ou solicita orçamentos pelo nosso site. Somos a
          controladora dos dados, nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
        </p>
        <p>
          Endereço: {company.address}. Contato: <a href={`mailto:${company.email}`}>{company.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "Dados que coletamos",
    body: (
      <>
        <p>Coletamos apenas o necessário para atender você:</p>
        <ul>
          <li>
            <b>Cadastro e pedido:</b> nome, e-mail, telefone, CPF ou CNPJ, endereço de entrega e dados da empresa, quando informados.
          </li>
          <li>
            <b>Personalização:</b> arquivos de logo e artes enviados, posições de aplicação e observações do pedido.
          </li>
          <li>
            <b>Orçamento para empresas:</b> itens do pedido (modelos, cores, quantidades), dados da empresa e do responsável.
          </li>
          <li>
            <b>Navegação:</b> dados técnicos básicos (navegador, dispositivo, páginas acessadas) e preferências salvas no seu navegador.
          </li>
        </ul>
        <p>Não solicitamos dados sensíveis e não vendemos dados pessoais.</p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Como usamos os seus dados",
    body: (
      <>
        <ul>
          <li>Processar pedidos, pagamentos, produção e entrega (execução de contrato).</li>
          <li>Enviar o layout para aprovação e avisos sobre o andamento do pedido.</li>
          <li>Responder orçamentos e atendimentos, inclusive pelo WhatsApp, quando você nos procura.</li>
          <li>Emitir notas fiscais e cumprir obrigações legais e regulatórias.</li>
          <li>Prevenir fraudes e proteger a segurança do site (legítimo interesse).</li>
          <li>Enviar novidades e ofertas, somente com o seu consentimento — que pode ser retirado a qualquer momento.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    body: (
      <p>
        Os pagamentos por Pix, boleto e cartão de crédito são processados pelo <b>Asaas</b>, instituição de pagamento parceira. Os dados do cartão são digitados em
        ambiente seguro e <b>não ficam armazenados</b> em nossos servidores. Recebemos apenas a confirmação e o status do pagamento.
      </p>
    ),
  },
  {
    id: "arquivos",
    title: "Logos e artes enviadas",
    body: (
      <p>
        Os arquivos de logo são usados exclusivamente para criar o layout e produzir o seu pedido. Você declara ter o direito de uso das marcas enviadas. Guardamos os
        arquivos pelo tempo necessário para eventuais reposições do mesmo pedido, e você pode pedir a exclusão a qualquer momento.
      </p>
    ),
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento",
    body: (
      <>
        <p>Compartilhamos dados apenas com parceiros essenciais para a operação, sempre no limite do necessário:</p>
        <ul>
          <li>Processador de pagamentos (Asaas);</li>
          <li>Transportadoras e Correios, para a entrega;</li>
          <li>Provedores de hospedagem, armazenamento e e-mail;</li>
          <li>Autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento local",
    body: (
      <p>
        Usamos o armazenamento local do navegador para lembrar o seu carrinho, favoritos e preferência de tema (claro ou escuro), e cookies estritamente necessários
        para manter a sua sessão. Caso passemos a usar ferramentas de análise ou publicidade, isso será informado aqui e, quando exigido, solicitaremos o seu
        consentimento. Você pode limpar esses dados nas configurações do navegador.
      </p>
    ),
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: (
      <p>
        Mantemos os dados enquanto forem necessários para as finalidades acima: dados de pedidos e fiscais pelo prazo exigido em lei (em geral, 5 anos); dados de
        atendimento e orçamentos por até 2 anos sem novo contato; dados de marketing até a retirada do consentimento.
      </p>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <p>
        Adotamos medidas técnicas e administrativas para proteger os seus dados, como conexão criptografada (HTTPS), controle de acesso restrito e parceiros com
        padrões reconhecidos de segurança. Nenhum sistema é totalmente imune, mas trabalhamos continuamente para reduzir riscos e, em caso de incidente relevante,
        comunicaremos os titulares e a ANPD.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <>
        <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento:</p>
        <ul className={s.rights}>
          <li>Confirmar a existência de tratamento e acessar os seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Pedir a portabilidade dos dados a outro fornecedor;</li>
          <li>Saber com quem compartilhamos os seus dados;</li>
          <li>Revogar o consentimento e se opor a tratamentos.</li>
        </ul>
        <p>Respondemos às solicitações em até 15 dias.</p>
      </>
    ),
  },
  {
    id: "contato",
    title: "Encarregado e contato",
    body: (
      <p>
        Para exercer os seus direitos ou tirar dúvidas sobre esta política, fale com o nosso encarregado pelo tratamento de dados pelo e-mail{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações desta política",
    body: (
      <p>
        Esta política pode ser atualizada para refletir mudanças no site ou na legislação. A data da última revisão fica sempre indicada no topo desta página.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <header className={s.hero}>
        <span className={s.heroBg} aria-hidden />
        <div className="container">
          <nav aria-label="Trilha de navegação" className={s.crumbs}>
            <Link href="/">Início</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">Privacidade</span>
          </nav>
          <span className={s.badge}>
            <ShieldCheck size={16} /> LGPD
          </span>
          <h1>Política de privacidade</h1>
          <p>Transparência sobre como coletamos, usamos e protegemos os seus dados pessoais.</p>
          <small className={s.updated}>Última atualização: {UPDATED}</small>
        </div>
      </header>

      <div className={`container ${s.layout}`}>
        <aside className={s.aside}>
          <Toc items={sections.map(({ id, title }) => ({ id, title }))} />
        </aside>

        <article className={s.content}>
          <div className={s.summary}>
            <ShieldCheck size={22} strokeWidth={1.75} />
            <p>
              <b>Resumo:</b> usamos os seus dados só para produzir e entregar o seu pedido, atender você e cumprir a lei. Não vendemos dados, e você pode pedir acesso,
              correção ou exclusão quando quiser.
            </p>
          </div>
          {sections.map((sec, i) => (
            <section key={sec.id} id={sec.id} className={s.section} aria-labelledby={`${sec.id}-h`}>
              <h2 id={`${sec.id}-h`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {sec.title}
              </h2>
              <div className={s.prose}>{sec.body}</div>
            </section>
          ))}
        </article>

        <aside className={s.helpAside}>
          <div className={s.help}>
            <div>
              <b>Ficou com alguma dúvida?</b>
              <small>Fale com a gente pelo canal que preferir.</small>
            </div>
            <div className={s.helpActions}>
              <a className="btn btn-outline btn-sm" href={`mailto:${company.email}`}>
                <Mail size={16} /> E-mail
              </a>
              <a className="btn btn-whatsapp btn-sm" href={whatsappLink("Olá! Tenho uma dúvida sobre a política de privacidade.")} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
