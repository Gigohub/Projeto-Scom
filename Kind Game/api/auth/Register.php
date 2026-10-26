<?php
declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Container;
use KindGame\Logger;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['POST']);
Auth::validarCsrf();

$usuario = Container::auth()->registrar(Request::corpoJson());

Logger::registrar('info', 'usuario_criado', ['usuario_id' => $usuario['id'], 'ip' => Request::ip()]);
Response::sucesso(['usuario' => $usuario], 201);