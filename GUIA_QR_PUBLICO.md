# Dream Player V4 — publicação da página pública por QR

A página pública do SPA é `https://parceiro.deltatv.com.br/upload/playlist?app=<appId>&mac=<MAC>&t=<token>`. O navegador remove os parâmetros da barra no script inicial do `index.html`, antes de montar React e o painel privado. O conteúdo do link de QR **não é** uma senha IPTV, mas o token temporário permite concluir um pareamento e é sensível.

## Requisitos de publicação

1. Verifique que a rota `/upload/playlist` entrega o mesmo `index.html` do SPA do parceiro (não encaminhe para o frontend antigo `/upload/playlist`). Confirme a configuração Nginx real antes de aplicar mudanças. Exemplo para revisar/adaptar no **server** já existente do painel:

```nginx
location = /upload/playlist {
    access_log off;
    add_header Cache-Control "no-store" always;
    add_header Referrer-Policy "no-referrer" always;
    try_files /index.html =404;
}
```

Se sua configuração atual usa `root`/`alias` ou regras especiais de SPA, adapte o `try_files`; não substitua outras rotas. Evite logar `$request_uri` em regras de proxy/CDN que recebam esse caminho, e configure o CDN para não armazenar nem registrar a URL completa, quando possível. O servidor recebe a URL **antes** da limpeza no navegador; portanto, `history.replaceState` sozinho NÃO protege logs de Nginx/CDN. Comprovantes de acesso da plataforma CDN devem ser revistos à parte.

2. O `index.html` importa `src/public-upload-entry.jsx` ao detectar essa rota. O código do painel privado (`App.jsx`, WebSocket e autenticação) não é importado nesse caso. As credenciais não são persistidas em armazenamento local, nem enviadas na URL.
3. O backend deve publicar `/api/v1/public/client-apps/:identifier`, `.../verify` e `.../link`. O primeiro GET devolve apenas nome, logo, tema e disponibilidade; as duas consultas com token usam POST, `Cache-Control: no-store` e rate limit. O CORS deve permitir o host do painel do parceiro somente nesse caminho.
4. A logo padrão do Dream Player é publicada como `/dreamplayer.png` no painel do parceiro. No Admin, confira se o endereço da logo e o tema foram salvos no cadastro do app `dreamplayer`.
5. No backend, execute em **homologação** as migrações `20261123000001-client-apps-and-plan-slots.cjs` e `20261123000002-client-app-public-qr.cjs`; os dados antigos do DeltaTV permanecem intactos. Não rode `sequelize.sync()` e não edite migrações antigas.
6. Teste sem sessão e **com sessão logada** no parceiro: em ambos os casos o QR abre somente o formulário público; MAC e app são somente leitura; a TV recebe a lista ao final do polling. Gere token expirado/alterado e tente usá-lo uma segunda vez: a operação deve ser recusada.

## Cuidados

- O QR contém um token de curta validade (um pareamento por vez), nunca credenciais IPTV. Quem fotografar um QR válido poderá tentar utilizar o token antes de seu dono; o limite de tentativas e a expiração mitigam, não eliminam, esse risco.
- A URL de destino deve caber na versão máxima suportada pelo codificador QR Roku e o domínio deve usar HTTPS.
- O fluxo público antigo `/client/activate/partner` com código e `/playlist/by-url` continua separado: novos apps não podem usá-lo.
- A verificação em banco PostgreSQL e em Roku físico é obrigatória antes de uso real.
