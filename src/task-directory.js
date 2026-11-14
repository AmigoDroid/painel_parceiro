/** Catálogo de ações e sinônimos. Rotas existentes, nunca cria autorizações. */
export const TASKS = [
  {"label": "Cadastrar cliente", "route": "customers", "description": "Gerenciar clientes do parceiro", "keywords": ["novo", "cliente", "usuario", "cadastro"]},
  {"label": "Localizar TV", "route": "devices", "description": "Vínculos e ativações de dispositivos", "keywords": ["mac", "aparelho", "tv"]},
  {"label": "Diagnosticar TV offline", "route": "support", "description": "Identificar problemas da TV", "keywords": ["falha", "erro", "conexao", "suporte"]},
  {"label": "Consultar licenças", "route": "licenses", "description": "Licenças e ativações do contrato", "keywords": ["licenca", "renovar", "ativar"]},
  {"label": "Criar código de parceria", "route": "codes", "description": "Códigos e configurações", "keywords": ["codigo", "tv", "ativacao"]},
  {"label": "Configurar servidores", "route": "servers", "description": "URLs usadas na entrega de conteúdo", "keywords": ["link", "iptv", "origem", "base", "url"]},
  {"label": "Ver saúde dos links", "route": "monitor", "description": "Disponibilidade e latência", "keywords": ["offline", "resposta", "falha", "servidor"]},
  {"label": "Consultar pagamentos", "route": "billing", "description": "Cobranças e faturas", "keywords": ["pix", "financeiro", "extrato"]},
  {"label": "Ver créditos", "route": "credits", "description": "Movimentações e saldos", "keywords": ["saldo", "credito"]},
  {"label": "Player Web", "route": "web", "description": "Acesso via navegador", "keywords": ["webroku", "web", "roku"]},
  {"label": "Baixar aplicativos", "route": "downloads", "description": "Links e instruções de instalação", "keywords": ["roku", "android", "samsung", "lg", "app"]},
  {"label": "Meus aplicativos", "route": "white-label", "description": "Aplicativos personalizados", "keywords": ["white", "label"]},
  {"label": "Personalizar aplicativo", "route": "studio", "description": "Editor visual dos aplicativos habilitados", "keywords": ["simulador", "roku", "designer", "tema"]},
  {"label": "Editar minha conta", "route": "account", "description": "Perfil e segurança", "keywords": ["senha", "nome", "email"]},
  {"label": "Histórico de login", "route": "access", "description": "Dispositivos e acessos", "keywords": ["ip", "auditoria"]},
  {"label": "Central de Ajuda", "route": "help", "description": "Tutoriais guiados", "keywords": ["duvida", "suporte", "ajuda"]},
];
