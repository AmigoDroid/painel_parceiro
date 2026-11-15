# Painel do Parceiro como aplicativo (PWA) + favicon

O painel agora tem favicon e pode ser instalado pelo Chrome/Edge (desktop e Android) como app.

## Arquivos (pasta `public/`, copiados para a raiz do `dist/` pelo `npm run build`)
| Arquivo | Função |
|---|---|
| `favicon.svg`, `favicon.ico`, `favicon-32.png` | Ícone da aba do navegador |
| `apple-touch-icon.png` | Ícone ao adicionar à tela inicial no iPhone/iPad |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Ícones do app instalado |
| `manifest.webmanifest` | Nome, cores, ícones e modo `standalone` |
| `sw.js` + `pwa-register.js` | Service worker (exigência do Chrome); navegação sempre pela rede, página `offline.html` se cair a conexão |

## Requisitos no servidor (Nginx)
1. **HTTPS obrigatório** (já é o caso em parceiro.deltatv.com.br).
2. Servir o manifest com o tipo correto e não deixar o `sw.js` em cache longo:

```nginx
location = /sw.js               { add_header Cache-Control "no-cache"; try_files $uri =404; }
location = /manifest.webmanifest { default_type application/manifest+json; add_header Cache-Control "no-cache"; try_files $uri =404; }
```
3. Se houver cabeçalho `Content-Security-Policy` restritivo, inclua `worker-src 'self'` e `manifest-src 'self'`.

## Como instalar (usuário)
Abra o painel no Chrome → ícone "Instalar" na barra de endereços (ou ⋮ → *Transmitir, salvar e compartilhar* → *Instalar página como app*).
No Android: ⋮ → *Instalar app*. No iPhone (Safari): Compartilhar → *Adicionar à Tela de Início*.

## Atualizar o app depois de um deploy
Nada a fazer: as páginas vêm sempre da rede. Só altere `VERSION` em `public/sw.js` se mudar a lógica do service worker.

## Trocar o ícone
Substitua os arquivos de `public/` mantendo nomes e tamanhos (192, 512, maskable 512 com a arte dentro dos 80% centrais).
