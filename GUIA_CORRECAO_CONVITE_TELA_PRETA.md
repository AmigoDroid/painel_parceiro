# Delta TV — correção do convite com tela preta e URL desaparecendo

## Diagnóstico confirmado nos arquivos

O `index.html` anterior executava `window.history.replaceState` e trocava `/convite/TOKEN` por `/` antes de carregar o React. O frontend publico e o privado tambem compartilhavam o mesmo import inicial (`App.jsx`), de modo que uma falha nos modulos do painel podia impedir o convite de renderizar.

## Mudanças

- A rota capturada fica visível como **`/convite`** (sem segredo).
- O segredo fica temporariamente no `sessionStorage` **dessa aba** para permitir F5 em `/convite`; e removido ao concluir ou ir ao login.
- `index.html` carrega `src/invite-entry.jsx` quando for convite e `src/main.jsx` quando for portal normal. A entrada publica só importa formulário, API e CSS.
- Incluídos mensagens de falha de carregamento e ErrorBoundary, evitando tela completamente preta em erros de importação/renderização.
- Links antigos `?convite=...` e `#convite=...` ainda são aceitos.
- O formulário só libera os campos depois de confirmação da API: `POST /api/v1/auth/partner-invite/verify`.

## Instalação

O patch `deltatv_patch_convite_tela_preta.zip` contém somente o frontend. Copie os arquivos para a pasta **fonte** do painel parceiro, preservando `.env.production`; então:

```
npm ci
npm run build
```

Publique o diretório `dist` gerado na pasta que o Nginx realmente serve. **Nunca** copie `src` em vez de `dist` para o servidor estático. Você não precisa alterar backend ou migrations para este patch; o backend da última versão já gera `/convite/TOKEN`.

### Nginx do domínio parceiro

```
location / { try_files $uri $uri/ /index.html; }
```

Confirme o `root` com `sudo nginx -T | grep -n -A 15 -B 5 'server_name parceiro.deltatv.com.br'`.
Se o Nginx não tem fallback SPA, `/convite/TOKEN` não recebe HTML.

### Diagnóstico na VPS

```
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' https://parceiro.deltatv.com.br/convite/TESTE
curl -fsSL https://parceiro.deltatv.com.br/convite/TESTE | grep -F 'delta-invite-version'
```

O HTML de produção deve conter `delta-invite-version`, a marca da versão atual. Se retornar 404, `index.html` não é servido nessa rota. Se retornar 200 mas a tela ainda estiver preta, inspecione **DevTools → Console e Network**, incluindo pedidos JS com erro `404` ou tipo `text/html` em vez de JavaScript.

### Segurança

Não compartilhe links reais de convite com terceiros nem em logs. Desabilite rastreamento de cliques no provedor SMTP para mensagens de cadastro. Tokens de convite são credenciais de uso único.

## Limitação de validação

Testes locais de captura e sintaxe executados. Build completo Vite e teste no dominio de produção pendentes.
