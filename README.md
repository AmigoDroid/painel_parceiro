# Delta TV — Painel do parceiro de conteúdo

Frontend React/Vite independente. Domínio previsto: `https://parceiro.deltatv.com.br`.

```bash
npm ci
cp .env.example .env.production
npm run build
```

No ambiente local, configure `.env.local` com `VITE_API_URL=http://localhost:3000` e execute `npm run dev`. A porta 5176 já consta do `CORS_ORIGINS` em `backend/.env.example`. Na produção, configure explicitamente `CORS_ORIGINS` com as origens HTTPS reais de cada painel; não use `*` nem dependa dos endereços de desenvolvimento.

Para convites administrativos de **Revenda**, configure `VITE_RESELLER_URL=https://revenda.seudominio.com.br` no build do painel Parceiro. A conclusão do convite abre essa origem; para **Parceiro**, mantém o login local. Sem configuração, o destino da Revenda é `http://localhost:5175` no desenvolvimento e `https://revenda.deltatv.com.br` na produção. A URL configurada deve ser somente a origem HTTPS em produção.

Login exclusivo: usuário da parceria `kind=content|both`, cadastrado com `role=partner`, utilizando audiência `content_partner`.

Monitoramento no servidor desligado por padrão; configure após homologação. Consulte `CONTENT_PARTNER_README.md` no backend.

## Códigos com múltiplos servidores

Em **Códigos de parceria → Configurar URLs**, selecione os servidores ativos da mesma parceria, respeitando o plano (agora sem teto global de oito URLs). A lista de códigos é paginada no backend (25 por página), com busca no PostgreSQL, para não carregar milhares de registros no celular. O monitor e o resolvedor rodam **na API**, não no Vite nem no Nginx. Consulte `SMART_FAILOVER_README.md` no pacote do backend.
