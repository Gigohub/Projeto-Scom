<?php
declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Database;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['GET']);

try {
    Auth::iniciarSessao();
    $id = Auth::usuarioId();

    if ($id === null) {
        Response::erro(401, 'Você precisa estar autenticado.');
    }

    $pdo = Database::conexao();
    $stmt = $pdo->prepare('SELECT id, nome, email, papel FROM usuarios WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        Auth::encerrar();
        Response::erro(401, 'Usuário não encontrado.');
    }

    Response::sucesso([
        'usuario' => [
            'id'    => (int) $usuario['id'],
            'nome'  => $usuario['nome'],
            'email' => $usuario['email'],
            'papel' => $usuario['papel'] ?? 'jogador',
        ],
        'csrf_token' => Auth::tokenCsrf(),
    ]);
} catch (Throwable $e) {
    Response::erro(401, 'Sessão inválida ou expirada.');
}