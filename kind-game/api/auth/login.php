<?php
declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Container;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['POST']);

$corpo = Request::corpoJson();
$email = is_string($corpo['email'] ?? null) ? trim(mb_strtolower($corpo['email'])) : '';
$senha = is_string($corpo['senha'] ?? null) ? $corpo['senha'] : '';

if ($email === '' || $senha === '') {
    Response::erro(422, 'Preencha todos os campos.');
}

try {
    $pdo = Container::db();
    $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, papel FROM usuarios WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
        unset($usuario['senha_hash']);
        $novoToken = Auth::entrar($usuario);
        Response::sucesso(['usuario' => $usuario, 'csrf_token' => $novoToken]);
    } else {
        Response::erro(401, 'E-mail ou senha incorretos.');
    }
} catch (Throwable $e) {
    Response::erro(500, 'Erro: ' . $e->getMessage() . ' em ' . basename($e->getFile()) . ':' . $e->getLine());
}