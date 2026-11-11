<?php
declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Logger;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['POST']);
Auth::validarCsrf();

$id = Auth::usuarioId();
Auth::encerrar(); // limpa $_SESSION, apaga o cookie e destrói a sessão no servidor

if ($id !== null) {
    Logger::registrar('info', 'logout', ['usuario_id' => $id]);
}
Response::sucesso(['mensagem' => 'Sessão encerrada.']);
