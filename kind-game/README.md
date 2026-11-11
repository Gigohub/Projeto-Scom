# Kind Game — backend (PHP + MySQL no XAMPP)

## Requisitos
XAMPP com PHP 8.0+ e MySQL/MariaDB.

## Como executar
1. Copie o conteúdo desta pasta para `C:\xampp\htdocs\kind-game\` (junto com os arquivos do jogo).
2. No painel do XAMPP, inicie **Apache** e **MySQL**.
3. Abra `http://localhost/phpmyadmin`, aba **Importar**, e importe `database/schema.sql`.
4. Copie `.env.example` para `.env` e ajuste `DB_USER`/`DB_PASS` (nunca versione o `.env`).
5. Acesse `http://localhost/kind-game/cadastro.html`.
6. Testes: `C:\xampp\php\php.exe tests\run.php`

## Estrutura
- `api/` endpoints HTTP (camada de interface)
- `src/Service/` regras de negócio
- `src/Repository/` acesso a dados (PDO, consultas parametrizadas)
- `database/schema.sql` script de criação do banco
- `docs/API.md` documentação da API
- `tests/` testes automatizados
- `logs/app.log` logs com timestamp (não versionado)
