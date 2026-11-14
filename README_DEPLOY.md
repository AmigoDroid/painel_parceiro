# DeltaTV Parceiro — build independente para Nginx

Este pacote foi corrigido para ser instalado diretamente em `/var/www/painel_parceiro`.

- O comando `npm run build` usa `node scripts/verify-env.mjs && vite build`.
- A biblioteca `@deltatv/ui` está incluída em `vendor/deltatv-ui` e é resolvida por alias no `vite.config.js`.
- O arquivo `.env.production` NÃO foi incluído intencionalmente. Preserve sua configuração atual ou defina `VITE_API_URL=https://api.deltatv.com.br`.

## Teste seguro sem substituir produção

```bash
mkdir -p /var/www/painel_parceiro_teste
unzip DeltaTV-parceiro-standalone-build-corrigido.zip -d /var/www/painel_parceiro_teste
cd /var/www/painel_parceiro_teste
printf 'VITE_API_URL=https://api.deltatv.com.br\n' > .env.production
npm install
npm run build
```

O Nginx pode continuar servindo os arquivos compilados da pasta `dist/`. Não é necessário alterar o Nginx para corrigir o build.

## Alternativa sem sobrescrever o código existente

Use `DeltaTV-parceiro-hotfix-build.zip`, extraia na raiz de `/var/www/painel_parceiro` e execute:

```bash
node scripts/patch-package.mjs
npm install
npm run build
```

O hotfix atualiza apenas a configuração de build e a biblioteca compartilhada, preservando as páginas do projeto instalado. Faça backup da pasta antes de aplicá-lo.

## Validação

Arquivos e imports compartilhados foram checados estaticamente, e a verificação do ambiente foi executada. A compilação Vite completa não foi concluída neste ambiente devido à indisponibilidade do cache de dependências npm.
