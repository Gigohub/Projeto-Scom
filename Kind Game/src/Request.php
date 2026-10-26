final class Request
{
    public static function metodo(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public static function exigirMetodos(array $permitidos): void
    {
        if (!in_array(self::metodo(), $permitidos, true)) {
            header('Allow: ' . implode(', ', $permitidos));
            throw new AppException('Método não permitido.', 405);
        }
    }

    public static function corpoJson(): array
    {
        $bruto = file_get_contents('php://input');
        if ($bruto === false || $bruto === '') {
            return [];
        }
        if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
            throw new AppException('Content-Type deve ser application/json.', 415);
        }
        if (strlen($bruto) > 10240) {
            throw new AppException('Corpo da requisição muito grande.', 413);
        }
        $dados = json_decode($bruto, true);
        if (!is_array($dados)) {
            throw new AppException('JSON inválido.', 400);
        }
        return $dados;
    }

    public static function ip(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    public static function inteiroDaQuery(string $chave, int $padrao): int
    {
        $valor = $_GET[$chave] ?? null;
        return (is_string($valor) && ctype_digit($valor)) ? (int) $valor : $padrao;
    }
}