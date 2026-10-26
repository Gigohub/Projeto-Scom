<?php
declare(strict_types=1);

/**
 * Ponto de entrada comum de todos os endpoints: autoload, tratamento
 * centralizado de erros, cabeçalhos de segurança e sessão.
 */

use KindGame\AppException;
use KindGame\Auth;
use KindGame\Config;
use KindGame\Logger;
use KindGame\Response;

require_once __DIR__ . '/autoload.php';

date_default_timezone_set('America/Sao_Paulo');
error_reporting(E_ALL);
ini_set('display_errors', '0'); ]

// Warnings e notices viram exceções, caindo no tratador abaixo.
set_error_handler(function (int $nivel, string $msg, string $arquivo, int $linha): bool {
    if (!(error_reporting() & $nivel)) {
        return false; // respeita o operador @ (ex.: @file_put_contents no Logger)
    }
    if ($nivel === E_DEPRECATED || $nivel === E_USER_DEPRECATED) {
        return true; // avisos de depreciação não derrubam a requisição
    }
    throw new ErrorException($msg, 0, $nivel, $arquivo, $linha);
});

// Tratamento centralizado: erros esperados (AppException) e inesperados (500).
set_exception_handler(function (Throwable $e): void {
    if ($e instanceof AppException) {
        Response::erro($e->status(), $e->getMessage(), $e->campos());
        return;
    }
    $local = basename($e->getFile()) . ':' . $e->getLine();
    Logger::registrar('error', 'erro_interno', [
        'tipo'     => get_class($e),
        'mensagem' => $e->getMessage(),
        'local'    => $local,
        'rota'     => $_SERVER['REQUEST_URI'] ?? '',
    ]);
    Response::erro(500, 'Erro interno do servidor.', [], get_class($e) . ': ' . $e->getMessage() . ' em ' . $local);
});

Config::carregar(dirname(__DIR__) . '/.env');

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

Auth::iniciarSessao();
