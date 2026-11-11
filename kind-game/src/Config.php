<?php
declare(strict_types=1);

namespace KindGame;

/** Lê o arquivo .env (fora do código-fonte versionado). */
final class Config
{
    private static array $valores = [];

    public static function carregar(string $caminhoEnv): void
    {
        if (!is_file($caminhoEnv)) {
            throw new \RuntimeException('Arquivo .env não encontrado. Copie .env.example para .env.');
        }
        $linhas = file($caminhoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($linhas as $linha) {
            $linha = trim($linha);
            if ($linha === '' || $linha[0] === '#' || !str_contains($linha, '=')) {
                continue;
            }
            [$chave, $valor] = explode('=', $linha, 2);
            self::$valores[trim($chave)] = trim($valor);
        }
    }

    public static function obter(string $chave, string $padrao = ''): string
    {
        return self::$valores[$chave] ?? $padrao;
    }

    /** Detalhes técnicos de erro só aparecem quando APP_ENV=development. */
    public static function emDesenvolvimento(): bool
    {
        return self::obter('APP_ENV', 'production') === 'development';
    }
}
