# DeltaTV — Painel do Parceiro (pacote cumulativo V4)

Arquivos relativos à raiz do projeto `painel_parceiro/`.
Incluem rota da página pública de QR, tela Meus Apps e arquivos da navegação,
sem alterar arquivos espelhados em `painel_parceiro/shared` ou `vendor`.

IMPORTANTE: o componente React `ClientApps.jsx` que mostra erro DENTRO do modal
é fornecido no pacote SEPARADO `DeltaTV_SHARED_UI_CANONICA_COMPLETA.zip`, na
localização `shared/ui/src/ClientApps.jsx`. A alteração do backend NÃO corrige
a interface. É obrigatório sincronizar o componente com o projeto do parceiro e
reconstruir/publicar seu build Vite. Use o fluxo já existente do repositório
canônico; não modifique alias ou Vite para compensar caminhos ausentes.

Este projeto antigo tem cópia em `painel_parceiro/shared/ui/src` e Vite importa
dela. O ZIP original `painel(5).zip` NÃO possui a fonte compartilhada canônica
na raiz e NÃO inclui o comando `npm run sync:shared` na raiz do projeto.
Portanto NÃO afirmamos que bastaria aplicar este ZIP isoladamente.

Testar `npm test`, `npm run build` após sincronizar UI; abrir modal e enviar código
curto/incorreto. Mensagem deve aparecer DENTRO do modal, em pt-BR.
