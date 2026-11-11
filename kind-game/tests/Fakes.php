<?php
declare(strict_types=1);

namespace KindGame\Tests;

use KindGame\Repository\PartidaRepositoryInterface;
use KindGame\Repository\TentativaLoginRepositoryInterface;
use KindGame\Repository\UsuarioRepositoryInterface;

/** Repositórios em memória: permitem testar a lógica de negócio sem banco de dados. */
final class UsuarioRepoFalso implements UsuarioRepositoryInterface
{
    public array $linhas = [];
    private int $proximoId = 1;

    public function criar(string $nome, string $email, string $senhaHash, string $papel = 'jogador'): int
    {
        $id = $this->proximoId++;
        $this->linhas[$id] = [
            'id' => $id, 'nome' => $nome, 'email' => $email,
            'senha_hash' => $senhaHash, 'papel' => $papel, 'criado_em' => '2026-01-01 00:00:00',
        ];
        return $id;
    }

    public function buscarPorEmail(string $email): ?array
    {
        foreach ($this->linhas as $linha) {
            if ($linha['email'] === $email) {
                return $linha;
            }
        }
        return null;
    }

    public function buscarPorId(int $id): ?array
    {
        if (!isset($this->linhas[$id])) {
            return null;
        }
        $linha = $this->linhas[$id];
        unset($linha['senha_hash']);
        return $linha;
    }

    public function listar(): array
    {
        return array_map(fn ($l) => $l + ['total_partidas' => 0], array_values($this->linhas));
    }

    public function atualizarNome(int $id, string $nome): void
    {
        $this->linhas[$id]['nome'] = $nome;
    }

    public function atualizarSenha(int $id, string $senhaHash): void
    {
        $this->linhas[$id]['senha_hash'] = $senhaHash;
    }

    public function atualizarPapel(int $id, string $papel): void
    {
        $this->linhas[$id]['papel'] = $papel;
    }

    public function excluir(int $id): bool
    {
        $existe = isset($this->linhas[$id]);
        unset($this->linhas[$id]);
        return $existe;
    }

    public function contarAdmins(): int
    {
        return count(array_filter($this->linhas, fn ($l) => $l['papel'] === 'admin'));
    }
}

final class PartidaRepoFalso implements PartidaRepositoryInterface
{
    public array $linhas = [];
    private int $proximoId = 1;

    public function criar(int $usuarioId, array $dados): int
    {
        $id = $this->proximoId++;
        $this->linhas[$id] = ['id' => $id, 'usuario_id' => $usuarioId, 'jogada_em' => '2026-01-01 00:00:00'] + $dados;
        return $id;
    }

    public function buscarPorId(int $id): ?array
    {
        return $this->linhas[$id] ?? null;
    }

    public function listarPorUsuario(int $usuarioId, int $limite, int $offset): array
    {
        $do_usuario = array_values(array_filter($this->linhas, fn ($l) => $l['usuario_id'] === $usuarioId));
        $do_usuario = array_reverse($do_usuario);
        return array_slice($do_usuario, $offset, $limite);
    }

    public function resumo(int $usuarioId): array
    {
        $do_usuario = array_filter($this->linhas, fn ($l) => $l['usuario_id'] === $usuarioId);
        return [
            'total'           => count($do_usuario),
            'vitorias'        => count(array_filter($do_usuario, fn ($l) => $l['resultado'] === 'vitoria')),
            'soma_vida_final' => array_sum(array_column($do_usuario, 'vida_final')),
        ];
    }

    public function excluir(int $id): bool
    {
        $existe = isset($this->linhas[$id]);
        unset($this->linhas[$id]);
        return $existe;
    }
}

final class TentativaRepoFalso implements TentativaLoginRepositoryInterface
{
    public array $falhas = [];

    public function registrarFalha(string $email, string $ip): void
    {
        $this->falhas[] = [$email, $ip];
    }

    public function contarRecentes(string $email, string $ip, int $minutos): int
    {
        return count(array_filter($this->falhas, fn ($f) => $f === [$email, $ip]));
    }

    public function limpar(string $email, string $ip): void
    {
        $this->falhas = array_values(array_filter($this->falhas, fn ($f) => $f !== [$email, $ip]));
    }
}
