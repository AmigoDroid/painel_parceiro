# Delta TV — Painel do parceiro de conteúdo

Frontend React/Vite independente. Domínio previsto: `https://parceiro.deltatv.com.br`.

```bash
npm ci
cp .env.example .env.production
npm run build
```

No ambiente local, configure `.env.local` com `VITE_API_URL=http://localhost:3000`, execute `npm run dev` e autorize a origem `http://localhost:5176` no CORS do backend.

Login exclusivo: usuário da parceria `kind=content|both`, cadastrado com `role=partner`, utilizando audiência `content_partner`.

Monitoramento no servidor desligado por padrão; configure após homologação. Consulte `CONTENT_PARTNER_README.md` no backend.

## Códigos com múltiplos servidores

Em **Códigos de parceria → Configurar URLs**, selecione de 1 a 8 servidores ativos da mesma parceria. A lista de códigos é paginada no backend (25 por página), com busca no PostgreSQL, para não carregar milhares de registros no celular. O monitor e o resolvedor rodam **na API**, não no Vite nem no Nginx. Consulte `SMART_FAILOVER_README.md` no pacote do backend.
