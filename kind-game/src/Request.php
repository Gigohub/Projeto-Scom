<?php
declare(strict_types=1);

namespace KindGame;

final class Request
{
    /**
     * Retorna o método HTTP da requisição (GET, POST, DELETE, etc).
     */
    public static function metodo(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    /**
     * Valida se o método da requisição está entre os permitidos.
     */
    public static function exigirMetodos(array $metodosPermitidos): void
    {
        if (!in_array(self::metodo(), $metodosPermitidos, true)) {
            throw new AppException('Método HTTP não permitido.', 405);
        }
    }

    /**
     * Obtém e decodifica o corpo JSON da requisição.
     */
    public static function corpoJson(): array
    {
        $conteudo = file_get_contents('php://input');
        if (empty($conteudo)) {
            return [];
        }

        $dados = json_decode($conteudo, true);
        return is_array($dados) ? $dados : [];
    }

    /**
     * Lê um parâmetro numérico da URL (query string) com valor padrão.
     */
    public static function inteiroDaQuery(string $chave, int $padrao): int
    {
        $valor = $_GET[$chave] ?? null;
        return (is_string($valor) && ctype_digit($valor)) ? (int) $valor : $padrao;
    }

    /**
     * Lê um cabeçalho HTTP enviado na requisição (ex: X-CSRF-Token).
     */
    public static function cabecalho(string $nome): ?string
    {
        $chaveServer = 'HTTP_' . strtoupper(str_replace('-', '_', $nome));
        if (isset($_SERVER[$chaveServer])) {
            return (string) $_SERVER[$chaveServer];
        }

        if (function_exists('getallheaders')) {
            $cabecalhos = getallheaders();
            foreach ($cabecalhos as $chave => $valor) {
                if (strcasecmp($chave, $nome) === 0) {
                    return (string) $valor;
                }
            }
        }

        return null;
    }
}