# Expressão Uniformes — escopo, stack e checklist

Atualizado em 25/09/2026. Este documento diferencia implementação, demonstração e pendências; caixas abertas não representam funcionalidades entregues.

## Produto

Loja de uniformes B2B com botão Personalizar nos cards e na página do produto. Abre modal de estúdio com editor 2D e prévia 3D sincronizados. O comprador configura a peça; a fábrica define áreas, revisa a arte e prepara a produção. Referência de interação: Abridorcard/app/admin/editor (Fabric.js, camadas, propriedades, histórico); não copiar autenticação ou dados daquele projeto.

## Direção visual

Branco, azul profundo, azul claro/ciano e amarelo. Tipografia limpa, cards arredondados, fotografia de produto com respiro, ícones Lucide. Estúdio como superfície de trabalho ampla, ferramentas à esquerda, peça central e propriedades/camadas à direita. Mobile com painéis empilhados. Imagens promocionais definitivas fornecidas posteriormente pelo usuário.

## Stack

- Next.js App Router + React + TypeScript: rotas, componentes de servidor e ilhas interativas.
- CSS com tokens e componentes por domínio: storefront, studio, admin, UI.
- Lucide React: ícones; Radix Dialog: modal acessível; Sonner: feedback.
- Fabric.js: editor 2D, textos, uploads, seleção, transformação e serialização.
- Three.js + React Three Fiber + Drei: prévia WebGL interativa; textura derivada da mesma arte 2D.
- Neon PostgreSQL via @neondatabase/serverless: persistência de catálogo, projetos, pedidos e usuários (integração pendente).
- Vercel Blob: uploads privados de logos e arquivos; imagens públicas do catálogo (integração pendente, depende de token).
- Zod: validação de projetos e persistência local; reutilizar na futura fronteira de APIs.
- Autenticação, gateway, frete e e-mail: definir/configurar antes do lançamento. Não simular pagamento ou login como operação real.
- Ambiente: DATABASE_URL e BLOB_READ_WRITE_TOKEN apenas no servidor; .env.example sem credenciais.

## Arquitetura planejada

app/: páginas e rotas de API; components/store/: header, footer, cards, catálogo e carrinho; components/studio/: modal, canvas, visualizador e propriedades; components/admin/: shell e módulos; lib/: catálogo, tipos, regras e adaptadores; docs/: decisões e checklist.

Projeto de personalização versionado: produto, variante, cor, técnica, lados e respectivos elementos, arquivos originais, dimensões físicas, preview, grade de tamanhos e versão. Pedido deve guardar snapshot imutável, preço calculado pelo servidor e referência dos arquivos. Logo/cart não devem depender de URL temporária. Alteração da fábrica cria nova versão para aprovação.

## Regras de negócio a validar

- Site atual informa 30 peças mínimas por cor/modelo: adotar provisoriamente no protótipo, confirmar.
- Definir tabela por volume, técnica, quantidade de posições e dimensões.
- Definir cobrança antes/depois de aprovação, prazos e frete.
- Confirmar formatos técnicos para bordado, silk e sublimação.
- Mockup não é arquivo de máquina. Bordado exige matriz/digitalização específica.
- Modelos 3D de demonstração precisam ser substituídos por modelagem fiel com UVs e gabaritos aprovados.

## Entrega 01 — base local implementada

Prévia: http://localhost:3001. Rotas: `/`, `/loja`, `/produto/[slug]`, `/carrinho`, `/checkout`, `/login`, `/admin`, `/contato` e `/privacidade`.

- Loja e estúdio funcionam como demonstração no navegador. Não há pedidos persistidos no servidor.
- Home já possui header, busca, dois banners, categorias, primeira vitrine, chamada do estúdio e footer. As cinco vitrines completas permanecem no checklist.
- Produto tem prévia 3D e troca de cor; galeria fotográfica e variantes reais ainda pendentes.
- Admin tem shell recolhível, tema claro/escuro, perfil, notificações informativas, KPIs/gráfico fictícios, filtros e detalhe de pedidos, catálogo e quadro de produção demonstrativos. Os demais módulos são indicados como planejados.
- Botão flutuante abre atendimento com os canais oficiais; chat em tempo real não conectado.
- Checkout possui validação de campos e revisão local, sem transmitir dados ou cobrar. Login é uma página informativa até integrar autenticação.
- Banco: proposta SQL em `db/001_initial.sql`. Não executada. Neon e Blob permanecem desconectados; nenhuma credencial foi gravada no código.
- Código do estúdio separado em modal, hook de estado/editor e visualizador Three.js. Componentes da loja separados por responsabilidade.
- Testes automatizados: seis cenários para grade, mínimo, quantidade adulterada, produtos divergentes, contagens inválidas e persistência inválida. Build de produção e TypeScript verificados. Teste visual/interativo em navegador ainda pendente.

- Compatibilidade WebMCP opcional: leitura do catálogo e abertura do estúdio, com detecção de suporte. Contrato em navegador compatível não verificado nesta etapa.

## Checklist completo

### Fundação

- [x] Análise do briefing e do editor de referência.
- [x] Documento de stack, escopo e pendências.
- [x] Base Next/React/TypeScript instalada e compilando.
- [x] Tokens visuais, componentes compartilhados e responsividade.
- [ ] Testar teclado, foco, mobile e erros.

### Loja

- [ ] Home: header, busca, slider, carrossel de categorias, cinco vitrines e footer.
- [x] Catálogo/categorias com busca, ordenação e filtros.
- [x] Cards: favoritos, comparação, carrinho e personalizar.
- [ ] Produto: galeria, variantes, grade, técnica, descrição e estúdio.
- [x] Carrinho com snapshot da personalização e edição.
- [ ] Checkout com endereço, frete e pagamento reais.
- [ ] Login, recuperação, conta, pedidos e projetos salvos.
- [x] Painel flutuante de atendimento e preferências de armazenamento.
- [ ] Chat em tempo real e gestão de consentimento para integrações futuras.

### Estúdio comprador

- [x] Abrir pelo card e pelo produto.
- [x] Cor da peça e frente/costas independentes.
- [x] Upload de logo PNG/JPEG/WebP com limites e validação.
- [x] Textos, cores, fontes, mover, escala, rotação e excluir.
- [x] Camadas, seleção, desfazer/refazer e centralizar.
- [x] Prévia 3D rotacionável sincronizada com a arte 2D.
- [x] Salvar rascunho, reabrir projeto e exportar prova/projeto.
- [x] Grade de tamanhos, mínimo e adicionar ao carrinho.
- [ ] Áreas físicas, resolução, limites, mangas e validação de impressão.
- [ ] Modelos 3D de produção por peça com UVs e materiais reais.

### Administração

- [x] Shell demonstrativo: sidebar recolhível, perfil, painel de notificações e tema.
- [ ] Tradução da interface, perfil real e notificações conectadas.
- [ ] Visão geral, pedidos, produtos, clientes, tráfego e relatórios.
- [ ] Banners, avaliações, cupons e promoções.
- [ ] Integrações, configurações, chat e disparos.
- [ ] Estúdio interno: modelos, áreas, técnicas e preços.
- [ ] Projetos recebidos, aprovação versionada e fila de produção.
- [ ] Permissões administrativas verificadas no servidor.

### Backend e lançamento

- [ ] Modelagem SQL e migrações revisadas (sem alterar dados existentes automaticamente).
- [ ] Neon integrado com validação e autorização.
- [ ] Blob privado, uploads autorizados e downloads controlados.
- [ ] Sessões seguras e papéis de usuário.
- [ ] Checkout com preços no servidor, idempotência e webhooks.
- [ ] Integração de frete e e-mails transacionais.
- [ ] Exportações homologadas com a fábrica.
- [ ] Build, testes do fluxo, observabilidade, backup e deploy.

## Critério de pronto

Botão visível não equivale a integração concluída. Métricas fictícias devem ser identificadas. Rascunhos locais são demonstração neste dispositivo; pedidos reais exigem persistência e autorização no servidor. Produção exige aprovação dos gabaritos e das saídas técnicas pela fábrica.

## Correções e entrega — 25/09/2026

- [x] Remover `Html` do fallback Suspense do Three: indicador de carregamento fora do Canvas.
- [x] Inicializar Fabric quando o portal Radix montar; React mantém apenas o host, Fabric gerencia seu canvas.
- [x] Adicionar interface “Gerar com IA”, revisão e aplicação da imagem no editor.
- [x] API de imagens OpenAI no servidor, validação de descrição e mensagens de erro.
- [x] Limites persistentes: 3 tentativas por origem/dia e 20 globais/dia. Falhas consomem reserva; nenhuma chamada paga sem configuração completa.
- [ ] Ativar geração real: configurar `OPENAI_API_KEY`, `DATABASE_URL`, executar `db/002_ai_generation_limits.sql` e definir `AI_IMAGE_GENERATION_ENABLED=true` na Vercel. Modelo padrão `gpt-image-2`, configurável por `OPENAI_IMAGE_MODEL`.
- [ ] Validar geração real com credencial do projeto. Nenhuma imagem foi gerada por API nesta entrega.

A aplicação publicada continua uma demonstração: checkout não cobra nem cria pedido real; autenticação e administração usam dados demonstrativos. Carrinho e artes persistem neste navegador. Neon/Blob e fluxo de produção completo permanecem no checklist acima. O upload não foi validado por automação porque a permissão de envio de arquivo no navegador foi recusada.

### Enquadramento do estúdio
- [x] Camiseta inteira no enquadramento inicial, adaptado às dimensões disponíveis.
- [x] Aproximar, afastar e enquadrar em 2D e 3D, com percentuais independentes (50%–200%).
- [x] Canvas Fabric e câmera usam a mesma escala visual, sem modificar coordenadas da arte exportada.
- [x] Validação no navegador: texto, alternância 2D/3D, controles de zoom, inclusão no carrinho; nenhum erro de console na verificação.
- [x] TypeScript, seis testes de validação de carrinho/projeto e build de produção aprovados.

Publicação solicitada: commit e push no GitHub. Nenhum deploy manual na Vercel; a integração Git pode disparar automaticamente.
