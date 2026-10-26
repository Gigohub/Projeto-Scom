namespace KindGame;

final class Auth
{
    private const INATIVIDADE_MAXIMA = 1800; // 30 minutos

    public static function iniciarSessao(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_name('KINDSESSID');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        ]);
        session_start();

        if (isset($_SESSION['ultima_atividade']) && time() - $_SESSION['ultima_atividade'] > self::INATIVIDADE_MAXIMA) {
            $_SESSION = [];
            session_regenerate_id(true);
        }
        $_SESSION['ultima_atividade'] = time();
    }

    public static function tokenCsrf(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function validarCsrf(): void
    {
        $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $esperado = $_SESSION['csrf'] ?? '';
        if (!is_string($enviado) || $esperado === '' || !hash_equals($esperado, $enviado)) {
            throw new AppException('Token CSRF inválido ou ausente.', 403);
        }
    }
}