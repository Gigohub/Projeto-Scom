<?php
declare(strict_types=1);

namespace KindGame;

/** Log de aplicação em logs/app.log, sempre com timestamp (ISO 8601). */
final class Logger
{
    public static function registrar(string $nivel, string $evento, array $contexto = []): void
    {
        $partes = [];
        foreach ($contexto as $chave => $valor) {
            $partes[] = $chave . '=' . self::limpar((string) $valor);
        }
        $linha = sprintf("%s [%s] %s %s\n", date('c'), strtoupper($nivel), $evento, implode(' ', $partes));
        @file_put_contents(dirname(__DIR__) . '/logs/app.log', $linha, FILE_APPEND | LOCK_EX);
    }

    /** Evita "log injection": quebras de linha vindas do usuário viram espaço. */
    private static function limpar(string $valor): string
    {
        return substr(str_replace(["\r", "\n"], ' ', $valor), 0, 200);
    }
}
