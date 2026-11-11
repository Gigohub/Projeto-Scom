<?php
declare(strict_types=1);

namespace KindGame;

/** Respostas JSON padronizadas: {sucesso, dados} ou {sucesso, erro:{status, mensagem, ...}}. */
final class Response
{
    public static function json(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function sucesso(array $dados = [], int $status = 200): void
    {
        self::json($status, ['sucesso' => true, 'dados' => $dados]);
    }

    public static function erro(int $status, string $mensagem, array $campos = [], ?string $detalhes = null): void
    {
        $erro = ['status' => $status, 'mensagem' => $mensagem];
        if ($campos !== []) {
            $erro['campos'] = $campos;
        }
        if ($detalhes !== null && Config::emDesenvolvimento()) {
            $erro['detalhes'] = $detalhes; // só em modo de desenvolvimento
        }
        self::json($status, ['sucesso' => false, 'erro' => $erro]);
    }
}
