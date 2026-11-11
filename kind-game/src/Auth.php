<?php
declare(strict_types=1);

namespace KindGame;

use PDO;
use Throwable;

final class Auth
{
    private const NOME_SESSAO = 'KINDSESSID';
    private const TEMPO_INATIVIDADE = 1800; // 30 minutos

    /**
     * Inicia a sessão PHP de forma segura (HttpOnly, SameSite Lax, expiração).
     */
    public static function iniciarSessao(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $ehHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

        session_name(self::NOME_SESSAO);
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $ehHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();

        // Expira a sessão por inatividade após 30 minutos
        if (isset($_SESSION['ultimo_acesso'])) {
            if (time() - (int)$_SESSION['ultimo_acesso'] > self::TEMPO_INATIVIDADE) {
                self::encerrar();
                return;
            }
        }
        $_SESSION['ultimo_acesso'] = time();
    }

    /**
     * Registra a autenticação do usuário na sessão e gera novo token CSRF.
     */
    public static function entrar(array $usuario): void
    {
        self::iniciarSessao();
        session_regenerate_id(true);

        $_SESSION['usuario_id']    = (int) $usuario['id'];
        $_SESSION['usuario_nome']  = (string) $usuario['nome'];
        $_SESSION['usuario_email'] = (string) $usuario['email'];
        $_SESSION['usuario_papel'] = (string) ($usuario['papel'] ?? 'jogador');
        $_SESSION['ultimo_acesso'] = time();

        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    /**
     * Realiza o logout, limpa a superglobal $_SESSION e destrói o cookie.
     */
    public static function encerrar(): void
    {
        self::iniciarSessao();
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
    }

    /**
     * Retorna o ID do usuário logado na sessão ou null.
     */
    public static function usuarioId(): ?int
    {
        self::iniciarSessao();
        return isset($_SESSION['usuario_id']) ? (int) $_SESSION['usuario_id'] : null;
    }

    /**
     * Retorna os dados do usuário autenticado (re-lendo do banco se houver PDO disponível).
     */
    public static function usuario(?PDO $pdo = null): ?array
    {
        self::iniciarSessao();
        $id = self::usuarioId();

        if ($id === null) {
            return null;
        }

        try {
            $pdo = $pdo ?? Database::conexao();
            $st = $pdo->prepare('SELECT id, nome, email, papel FROM usuarios WHERE id = :id LIMIT 1');
            $st->execute([':id' => $id]);
            $usuario = $st->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                self::encerrar();
                return null;
            }

            $_SESSION['usuario_nome']  = $usuario['nome'];
            $_SESSION['usuario_email'] = $usuario['email'];
            $_SESSION['usuario_papel'] = $usuario['papel'];

            return [
                'id'    => (int) $usuario['id'],
                'nome'  => (string) $usuario['nome'],
                'email' => (string) $usuario['email'],
                'papel' => (string) $usuario['papel'],
            ];
        } catch (Throwable $e) {
            return [
                'id'    => (int) $_SESSION['usuario_id'],
                'nome'  => (string) ($_SESSION['usuario_nome'] ?? ''),
                'email' => (string) ($_SESSION['usuario_email'] ?? ''),
                'papel' => (string) ($_SESSION['usuario_papel'] ?? 'jogador'),
            ];
        }
    }

    /**
     * Proteção de rota: exige autenticação.
     * Suporta chamadas sem argumentos: Auth::exigirLogin()
     * Suporta passagem de papel: Auth::exigirLogin('admin')
     * Suporta passagem de PDO: Auth::exigirLogin($pdo)
     */
    public static function exigirLogin($papelOuPdo = null, ?PDO $pdo = null): array
    {
        self::iniciarSessao();

        $papelNecessario = null;
        $conexaoPdo = $pdo;

        if (is_string($papelOuPdo)) {
            $papelNecessario = $papelOuPdo;
        } elseif ($papelOuPdo instanceof PDO) {
            $conexaoPdo = $papelOuPdo;
        }

        $usuario = self::usuario($conexaoPdo);

        if ($usuario === null) {
            throw new AppException('Você precisa estar autenticado.', 401);
        }

        if ($papelNecessario !== null && ($usuario['papel'] ?? '') !== $papelNecessario) {
            throw new AppException('Você não tem permissão para acessar este recurso.', 403);
        }

        return $usuario;
    }

    /**
     * Exige um papel de acesso específico (ex: 'admin').
     */
    public static function exigirPapel(string $papel, ?PDO $pdo = null): array
    {
        return self::exigirLogin($papel, $pdo);
    }

    /**
     * Obtém o token CSRF ativo na sessão.
     */
    public static function tokenCsrf(): string
    {
        self::iniciarSessao();

        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Valida o token CSRF contra o cabeçalho X-CSRF-Token ou requisição POST.
     */
    public static function validarCsrf(): void
    {
        self::iniciarSessao();

        $tokenSessao = $_SESSION['csrf_token'] ?? null;
        $tokenEnviado = Request::cabecalho('X-CSRF-Token') 
            ?? ($_POST['csrf_token'] ?? null);

        if (!$tokenSessao || !$tokenEnviado || !hash_equals((string) $tokenSessao, (string) $tokenEnviado)) {
            throw new AppException('Token CSRF inválido ou ausente.', 403);
        }
    }
}