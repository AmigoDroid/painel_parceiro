# Delta TV — Painel do Parceiro | Renovação visual

## Escopo

Esta entrega altera **apenas o frontend React/Vite** do painel do parceiro de conteúdo, partindo da versão `deltatv_painel_parceiro_expandido.zip`. Os caminhos HTTP, a autenticação, os fluxos operacionais, as permissões e o protocolo WebSocket foram preservados.

### Melhorias

- Navegação lateral com ícones SVG locais (sem dependência externa), grupos e indicação clara da seção ativa.
- Cabeçalho fixo mais discreto, subtítulo de contexto, acesso rápido às notificações e menu de perfil com **Meu perfil** e **Sair da conta**.
- Resumo visual da operação no início do painel, com acesso rápido a códigos e servidores.
- Sistema visual de cartões, métricas, estados do monitor, botões, alertas e diálogos com espaçamentos consistentes.
- Tabelas de códigos adaptadas para cartões legíveis no celular; botões de ação sem necessidade de deslizar horizontalmente.
- Ajustes de contraste, foco por teclado, suporte a `Escape` para fechar menus e `prefers-reduced-motion`.
- Novo tema escuro e cor de destaque violeta. Nenhuma biblioteca de ícones adicionada.

### Arquivos modificados

- `src/App.jsx` — navegação, cabeçalho, perfil, introdução da Visão Geral e ícones.
- `src/style.css` — estilo visual e regras responsivas.
- `index.html` — cor do navegador em dispositivos móveis.

### Arquivos adicionados

- `src/Icon.jsx` — ícones SVG embutidos e reutilizáveis.

## Instalação

1. Faça backup da versão atualmente publicada.
2. Substitua os arquivos do frontend, preservando `.env.production` e o diretório `.git` do seu repositório local.
3. Na raiz do projeto, rode `npm ci` e `npm run build`.
4. Publique o conteúdo de `dist/` pelo Nginx da forma habitual.

## Testes e limites da validação

- Todos os módulos JSX/JS passaram em análise sintática com o parser TypeScript.
- Importações locais verificadas.
- Prévia independente de layout verificou ausência de estouro horizontal em 320, 390, 768, 1024 e 1440 px para a Visão Geral e a lista de códigos.
- **Não foi possível concluir `npm ci`/`npm run build` neste ambiente.** Necessário validar o build real e os fluxos em um navegador autenticado antes de publicar em produção.
- As prévias gráficas de validação utilizaram valores fictícios e não executam a API.

Não há alteração de banco de dados, migration, backend ou configuração do Nginx nesta entrega.
