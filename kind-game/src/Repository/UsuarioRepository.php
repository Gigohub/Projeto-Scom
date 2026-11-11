<?php
declare(strict_types=1);

namespace KindGame\Repository;

use PDO;

/** Operações de banco de dados para a tabela de usuários. */
final class UsuarioRepository implements UsuarioRepositoryInterface
{
    public function __construct(private PDO $pdo)
    {
    }

    public function buscarPorId(int $id): ?array
    {
        $st = $this->pdo->prepare('SELECT id, nome, email, papel, criado_em FROM usuarios WHERE id = :id LIMIT 1');
        $st->execute([':id' => $id]);
        $res = $st->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public function buscarPorEmail(string $email): ?array
    {
        $st = $this->pdo->prepare('SELECT id, nome, email, senha_hash, papel, criado_em FROM usuarios WHERE email = :email LIMIT 1');
        $st->execute([':email' => $email]);
        $res = $st->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public function criar(string $nome, string $email, string $senhaHash): int
    {
        $st = $this->pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (:nome, :email, :senha_hash)');
        $st->execute([':nome' => $nome, ':email' => $email, ':senha_hash' => $senhaHash]);
        return (int) $this->pdo->lastInsertId();
    }

    public function atualizarNome(int $id, string $nome): bool
    {
        $st = $this->pdo->prepare('UPDATE usuarios SET nome = :nome WHERE id = :id');
        return $st->execute([':nome' => $nome, ':id' => $id]);
    }

    public function atualizarSenha(int $id, string $senhaHash): bool
    {
        $st = $this->pdo->prepare('UPDATE usuarios SET senha_hash = :senha_hash WHERE id = :id');
        return $st->execute([':senha_hash' => $senhaHash, ':id' => $id]);
    }

    public function atualizarPapel(int $id, string $papel): bool
    {
        $st = $this->pdo->prepare('UPDATE usuarios SET papel = :papel WHERE id = :id');
        return $st->execute([':papel' => $papel, ':id' => $id]);
    }

    public function excluir(int $id): bool
    {
        $st = $this->pdo->prepare('DELETE FROM usuarios WHERE id = :id');
        return $st->execute([':id' => $id]);
    }

    public function listarTodos(): array
    {
        $st = $this->pdo->query('SELECT id, nome, email, papel, criado_em FROM usuarios ORDER BY id DESC');
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }
}