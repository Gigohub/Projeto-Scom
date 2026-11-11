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

Request::exigirMetodos(['GET', 'PUT', 'DELETE']);

// Exige login e verifica se o usuário é administrador
$usuario = Auth::exigirLogin();
if (($usuario['papel'] ?? '') !== 'admin') {
    throw new AppException('Acesso negado. Recurso exclusivo para administradores.', 403);
}

$pdo = Database::conexao();

switch (Request::metodo()) {
    case 'GET':
        // Identifica dinamicamente o nome da chave estrangeira na tabela partidas
        $colunaUsuario = 'usuario_id';
        try {
            $check =$pdo->query("SHOW COLUMNS FROM partidas LIKE 'usuario_id'");
            if (!$check->fetch()) {$colunaUsuario = 'id_usuario';
            }
        } catch (\Throwable $e) {
            // Caso ocorra erro de estrutura, mantém o padrão usuario_id
        }

        try {
            $stmt =$pdo->query("
                SELECT 
                    u.id, 
                    u.nome, 
                    u.email, 
                    u.papel, 
                    COUNT(p.id) AS total_partidas
                FROM usuarios u
                LEFT JOIN partidas p ON p.{$colunaUsuario} = u.id
                GROUP BY u.id, u.nome, u.email, u.papel
                ORDER BY u.id ASC
            ");
            $lista =$stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            $stmt =$pdo->query('SELECT id, nome, email, papel FROM usuarios ORDER BY id ASC');
            $lista =$stmt->fetchAll(\PDO::FETCH_ASSOC);
            foreach ($lista as &$row) {$row['total_partidas'] = 0;
            }
        }

        $usuarios = array_map(static function ($u) {$qtd = $u['total_partidas'] ?? $u['partidas'] ?? 0;
            return [
                'id'       => (int) $u['id'],
                'nome'     => (string) $u['nome'],
                'email'    => (string) $u['email'],
                'papel'    => (string) $u['papel'],
                'partidas' => (int) $qtd,
            ];
        }, $lista);

        Response::sucesso(['usuarios' => $usuarios]);
        break;

    case 'PUT':
        Auth::validarCsrf();
        $idAlvo = Request::inteiroDaQuery('id', 0);$corpo = Request::corpoJson();
        $novoPapel = ($corpo['papel'] ?? 'jogador') === 'admin' ? 'admin' : 'jogador';

        if ($idAlvo <= 0) {
            throw new AppException('ID de usuário inválido.', 422);
        }

        $stmt = $pdo->prepare('UPDATE usuarios SET papel = :papel WHERE id = :id');$stmt->execute([':papel' => $novoPapel, ':id' =>$idAlvo]);

        Logger::registrar('info', 'papel_alterado', [
            'admin_id'   => $usuario['id'],
            'alvo_id'    => $idAlvo,
            'novo_papel' => $novoPapel,
        ]);

        Response::sucesso(['mensagem' => 'Papel do usuário atualizado.']);
        break;

    case 'DELETE':
        Auth::validarCsrf();
        $idAlvo = Request::inteiroDaQuery('id', 0);

        if ($idAlvo <= 0) {
            throw new AppException('ID de usuário inválido.', 422);
        }

        if ($idAlvo === (int)$usuario['id']) {
            throw new AppException('Você não pode excluir a sua própria conta de administrador.', 400);
        }

        $stmt =$pdo->prepare('DELETE FROM usuarios WHERE id = :id');
        $stmt->execute([':id' =>$idAlvo]);

        Logger::registrar('info', 'usuario_excluido', [
            'admin_id' => $usuario['id'],
            'alvo_id'  => $idAlvo,
        ]);

        Response::sucesso(['mensagem' => 'Usuário excluído com sucesso.']);
        break;
}