<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Container;
use KindGame\Database;
use KindGame\Logger;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['GET', 'POST', 'DELETE']);

$usuario = Auth::exigirLogin();
$usuarioId = (int) $usuario['id'];
$partidas = Container::partidas();

switch (Request::metodo()) {
    case 'GET':
        Response::sucesso($partidas->listar(
            $usuarioId,
            Request::inteiroDaQuery('pagina', 1),
            Request::inteiroDaQuery('limite', 10)
        ));
        break;

    case 'POST':
        Auth::validarCsrf();
        $partida = $partidas->registrar($usuarioId, Request::corpoJson());
        Logger::registrar('info', 'partida_criada', [
            'partida_id' => $partida['id'],
            'usuario_id' => $usuarioId,
            'resultado'  => $partida['resultado'],
        ]);
        Response::sucesso(['partida' => $partida], 201);
        break;

    case 'DELETE':
        Auth::validarCsrf();
        $partidas->excluir($usuarioId, (string) ($usuario['papel'] ?? 'jogador'), Request::inteiroDaQuery('id', 0));
        Logger::registrar('info', 'partida_excluida', ['usuario_id' => $usuarioId]);
        Response::sucesso(['mensagem' => 'Partida excluída.']);
        break;
}