# Painel parceiro — Créditos, dispositivos e contrato

Mantenha `VITE_API_URL=https://api.deltatv.com.br` no `.env.production` e execute `npm ci && npm run build`.

Acesse `https://parceiro.deltatv.com.br` após configurar DNS e Nginx (etapa separada).

O painel mostra a modalidade contratada, total de ativações, créditos na carteira, créditos ainda disponíveis em códigos e consumo. Códigos têm páginas de 25 registros; dispositivos têm páginas de 20; nenhuma página carrega milhares de linhas de uma vez.

Os créditos só podem ser criados pelo admin. O parceiro pode reservar créditos em um código e devolver somente créditos não consumidos, inclusive se o código for revogado ou o contrato mudar de modalidade.

Na tela de Dispositivos, a ação de desvínculo tem confirmação e motivo obrigatório: revoga o acesso daquela lista e apaga as credenciais do backend. Não afeta ativações de outros parceiros nem uma licença pessoal independente.

O monitor mostra a prioridade efetiva calculada por saúde e latência; não altera o valor manual no cadastro a cada teste.

Primeiro atualize o backend, rode a migration, depois publique o frontend. Teste com banco de homologação antes de colocar um parceiro real no plano por créditos.
