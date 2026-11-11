========================================================================
 KIND GAME — Manual de Instalação e Execução (XAMPP + PHP + MySQL)
========================================================================

 Kind Game é um jogo de cartas Colecionáveis (TCG) para navegador integrado 
 a uma plataforma web completa em PHP/MySQL com autenticação de usuários, 
 estatísticas de partidas e painel administrativo.

------------------------------------------------------------------------
 1. REQUISITOS DO SISTEMA
------------------------------------------------------------------------
 - XAMPP Control Panel instalado (com Apache e MySQL)
 - PHP 8.0 ou superior
 - Banco de dados MySQL / MariaDB
 - Navegador moderno (Chrome, Edge, Firefox, Brave)

------------------------------------------------------------------------
 2. PASSO A PASSO DE INSTALAÇÃO (A PARTIR DA PASTA ZIP)
------------------------------------------------------------------------

 Passo 1: Extrair o Projeto
 --------------------------
 1. Localize o arquivo ZIP do projeto (ex: `kind-game.zip`).
 2. Extraia o conteúdo diretamente no diretório do XAMPP:
    C:\xampp\htdocs\kind-game\
    
    (Certifique-se de que a estrutura dos arquivos como `homepage.html`, 
     `index.html`, `dashboard.html`, pastas `api/` e `src/` fiquem dentro 
     da pasta `kind-game`).

 Passo 2: Iniciar os Serviços no XAMPP
 --------------------------------------
 1. Abra o `XAMPP Control Panel`.
 2. Clique no botão "Start" ao lado de **Apache**.
 3. Clique no botão "Start" ao lado de **MySQL**.

 Passo 3: Criar e Importar o Banco de Dados
 ------------------------------------------
 1. Abra o navegador e acesse: http://localhost/phpmyadmin
 2. Clique na aba **Banco de dados** (Databases).
 3. Crie um novo banco com o nome `kindgame` (utf8mb4_unicode_ci).
 4. Selecione o banco `kindgame` recém-criado e vá na aba **Importar** (Import).
 5. Escolha o arquivo de schema localizado em:
    C:\xampp\htdocs\kind-game\database\schema.sql
 6. Clique em **Executar** para criar as tabelas `usuarios` e `partidas`.

 Passo 4: Configurar Arquivo de Ambiente (.env)
 ----------------------------------------------
 1. Na raiz da pasta do projeto (`C:\xampp\htdocs\kind-game\`), crie uma 
    cópia do arquivo `.env.example` e renomeie-o para `.env`.
 2. Abra o arquivo `.env` e confirme as credenciais do banco:
    DB_HOST=127.0.0.1
    DB_NAME=kindgame
    DB_USER=root
    DB_PASS=
    DB_PORT=3306

------------------------------------------------------------------------
 3. COMO ACESSAR A APLICAÇÃO
------------------------------------------------------------------------
 Acesse as páginas principais pelo navegador usando as URLs:

 - Página Inicial (Landing Page):
   http://localhost/kind-game/homepage.html

 - Registro e Login:
   http://localhost/kind-game/login.html
   * Requisitos de cadastro: Nome (2-50 chars), E-mail válido e Senha 
     forte (mínimo 6 caracteres, contendo pelo menos 1 letra e 1 número).

 - Duelo TCG (Jogo contra IA):
   http://localhost/kind-game/index.html

 - Dashboard do Jogador & Painel Admin:
   http://localhost/kind-game/dashboard.html

------------------------------------------------------------------------
 4. FUNCIONALIDADES DO SISTEMA
------------------------------------------------------------------------
 - Autenticação & Segurança:
   • Criptografia de senhas com `password_hash()` (bcrypt).
   • Validação de complexidade de senha no backend e frontend.
   • Proteção contra requisições forjadas via tokens CSRF.
   • Controle de sessões com expiração automática.

 - Perfil & Dashboard:
   • Alteração de nome de jogador em tempo real sem recarregar a página.
   • Exibição de vitórias e derrotas integradas no cabeçalho da homepage.
   • Estatísticas avançadas: total de jogos, vitórias, derrotas, taxa de 
     vitória (%) e média de pontos de vida finais (LP).
   • Histórico paginado de partidas com opção de exclusão.

 - Administração de Usuários (Apenas contas 'admin'):
   • Visualização de todos os usuários cadastrados.
   • Promover ou rebaixar papéis entre 'admin' e 'jogador'.
   • Exclusão de contas de usuários (com bloqueio de autoexclusão de admin).

------------------------------------------------------------------------
 5. TESTES AUTOMATIZADOS E LOGS
------------------------------------------------------------------------
 - Para rodar a suíte de testes pelo terminal do Windows:
   C:\xampp\php\php.exe C:\xampp\htdocs\kind-game\tests\run.php

 - Os logs do sistema (erros e ações administrativas) são gravados em:
   C:\xampp\htdocs\kind-game\logs\app.log

------------------------------------------------------------------------
 6. ESTRUTURA DE DIRETÓRIOS
------------------------------------------------------------------------
 /kind-game
 ├── api/                <- Endpoints HTTP (register, perfil, partidas, usuarios)
 ├── css/                <- Estilos CSS (landing.css, auth.css, etc.)
 ├── database/           <- Script SQL de criação do banco (schema.sql)
 ├── images/             <- Ilustrações e imagens das cartas
 ├── js/                 <- Arquivos JavaScript (api.js, dashboard.js, landing.js)
 ├── logs/               <- Registros de log do sistema
 ├── src/                <- Regras de negócio, Database PDO, Auth e Logger
 ├── tests/              <- Testes automatizados PHP
 ├── dashboard.html      <- Painel de usuário e administração
 ├── homepage.html       <- Landing page institucional com dados do usuário
 ├── index.html          <- Arena de duelo do jogo
 ├── login.html          <- Formulário de autenticação e registro
 └── README.txt          <- Instruções do projeto
========================================================================