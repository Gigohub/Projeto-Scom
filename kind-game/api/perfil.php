<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use KindGame\AppException;
use KindGame\Auth;
use KindGame\Database;
use KindGame\Logger;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['PUT']);
$usuario = Auth::exigirLogin();
Auth::validarCsrf();

$corpo = Request::corpoJson();
$nome = trim((string) ($corpo['nome'] ?? ''));

// Validação do nome (2 a 50 caracteres)
if (mb_strlen($nome) < 2 || mb_strlen($nome) > 50 || !preg_match('/^[a-zA-Z0-9_.\- áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$/u', $nome)) {
    throw new AppException('Nome de jogador inválido.', 422, [
        'campos' => ['nome' => 'Use de 2 a 50 caracteres (letras, números, espaços, ponto, hífen ou sublinhado).']
    ]);
}

$pdo = Database::conexao();
$st = $pdo->prepare('UPDATE usuarios SET nome = :nome WHERE id = :id');
$st->execute([
    ':nome' => $nome,
    ':id'   => (int) $usuario['id'],
]);

$_SESSION['usuario_nome'] = $nome;

Logger::registrar('info', 'perfil_atualizado', [
    'usuario_id' => $usuario['id'],
    'novo_nome'  => $nome
]);

Response::sucesso([
    'usuario' => [
        'id'    => (int) $usuario['id'],
        'nome'  => $nome,
        'email' => $usuario['email'],
        'papel' => $usuario['papel'],
    ]
]);