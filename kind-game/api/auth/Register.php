<?php
declare(strict_types=1);

$bootstrap = file_exists(__DIR__ . '/../src/bootstrap.php')
    ? __DIR__ . '/../src/bootstrap.php'
    : __DIR__ . '/../../src/bootstrap.php';

require $bootstrap;

use KindGame\AppException;
use KindGame\Auth;
use KindGame\Database;
use KindGame\Logger;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['POST']);
Auth::validarCsrf();

$dados = Request::corpoJson();

$nome  = trim((string) ($dados['nome'] ?? ''));
$email = filter_var(trim((string) ($dados['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$senha = (string) ($dados['senha'] ?? '');

// 1. Validações de entrada (Nome, E-mail e Senha Forte)
if (mb_strlen($nome) < 2 || mb_strlen($nome) > 50) {
    throw new AppException('Nome inválido (use de 2 a 50 caracteres).', 422);
}

if (!$email) {
    throw new AppException('Informe um endereço de e-mail válido.', 422);
}

// Exige no mínimo 6 caracteres, pelo menos uma letra e pelo menos um número
if (strlen($senha) < 6 || !preg_match('/[a-zA-Z]/', $senha) || !preg_match('/[0-9]/', $senha)) {
    throw new AppException('A senha deve ter no mínimo 6 caracteres e conter pelo menos uma letra e um número.', 422, [
        'campos' => ['senha' => 'A senha precisa ter números e letras (mínimo 6 caracteres).']
    ]);
}

$pdo = Database::conexao();

// 2. Verifica se o e-mail já está cadastrado
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :email');
$stmt->execute([':email' => $email]);

if ($stmt->fetch()) {
    throw new AppException('Este e-mail já está cadastrado no sistema.', 422, [
        'campos' => ['email' => 'E-mail já cadastrado.']
    ]);
}

// 3. Criptografa a senha do usuário
$senhaCriptografada = password_hash($senha, PASSWORD_DEFAULT);

// 4. Insere o novo usuário
try {
    $stmt = $pdo->prepare('
        INSERT INTO usuarios (nome, email, senha_hash, papel)
        VALUES (:nome, :email, :senha, :papel)
    ');
    $stmt->execute([
        ':nome'  => $nome,
        ':email' => $email,
        ':senha' => $senhaCriptografada,
        ':papel' => 'jogador'
    ]);
} catch (\PDOException $e) {
    if (str_contains($e->getMessage(), 'Unknown column') || $e->getCode() === '42S22') {
        $stmt = $pdo->prepare('
            INSERT INTO usuarios (nome, email, senha, papel)
            VALUES (:nome, :email, :senha, :papel)
        ');
        $stmt->execute([
            ':nome'  => $nome,
            ':email' => $email,
            ':senha' => $senhaCriptografada,
            ':papel' => 'jogador'
        ]);
    } else {
        throw $e;
    }
}

$idCriado = (int) $pdo->lastInsertId();

// 5. Inicia a sessão automaticamente
$_SESSION['usuario_id']   = $idCriado;
$_SESSION['usuario_nome'] = $nome;

$ipCliente = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
Logger::registrar('info', 'usuario_criado', ['usuario_id' => $idCriado, 'ip' => $ipCliente]);

Response::sucesso([
    'usuario' => [
        'id'    => $idCriado,
        'nome'  => $nome,
        'email' => $email,
        'papel' => 'jogador'
    ]
], 201);