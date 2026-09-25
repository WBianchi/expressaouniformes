# Expressão Uniformes

Primeira base de uma loja B2B com estúdio de personalização 2D/3D e demonstração do painel administrativo.

## Executar

Requer Node.js 22 ou mais recente.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

A porta é exibida pelo Next. Na sessão inicial: http://localhost:3001.

## O que está implementado

- Home, catálogo com filtros/busca/ordenação, favoritos e comparação.
- Página de produto com prévia WebGL e entrada no estúdio.
- Estúdio modal (Fabric.js), upload de logo, textos, fontes, cores, transformação, camadas, desfazer/refazer, frente e costas.
- Prévia 3D real com modelo GLB e decalques das mesmas artes.
- Grade de tamanhos, mínimo de 30, carrinho local com snapshot e reedição.
- Exportação PNG para conferência e JSON editável; rascunhos locais.
- Checkout de demonstração (não envia dados nem cobra).
- Admin de demonstração: visão geral, filtros de pedidos, detalhes, catálogo, editor e quadro de produção; demais módulos explicitamente planejados.

## Limites desta etapa

Produtos, preços e métricas são fictícios. O modelo GLB representa uma camiseta de demonstração, não uma peça homologada da fábrica. PNG exportado não é matriz de bordado ou arquivo técnico validado para impressão. Login, banco, Blob, pagamentos e frete não estão conectados. O admin só contém exemplos públicos e não é uma área autenticada. Não inserir dados de clientes reais até implementar autenticação e autorização no servidor.

Dados locais podem ser perdidos ao limpar o navegador. Logos grandes podem atingir a cota local; exporte o projeto para manter uma cópia. Links de atendimento vão aos canais oficiais, sem simular chat em tempo real.

## Próximos passos e arquitetura

Consulte [docs/PROJETO.md](docs/PROJETO.md). Migração proposta em `db/001_initial.sql`, não aplicada. Chaves previstas em `.env.example`; nenhuma credencial é incluída no código. O banco deve ser inspecionado antes de executar a migração.

## Assets

- `public/images/uniformes.png` e `logo.png`: site da Expressão Uniformes, https://expressaouniformes.com.br/ (material do cliente).
- `public/shirt.glb`: pmndrs/examples, `examples/t-shirt-configurator/src/shirt_baked_collapsed.glb`, https://github.com/pmndrs/examples. Licença do repositório em `docs/PMNDRS-LICENSE.txt`. Modelo usado como demonstração; substituir por modelos homologados antes da operação.
