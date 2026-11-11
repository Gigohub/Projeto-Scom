<?php
declare(strict_types=1);

namespace KindGame\Repository;

/**
 * Contratos da camada de acesso a dados.
 * Os serviços dependem destas interfaces (não do PDO), o que permite
 * testar a lógica de negócio com repositórios falsos em memória.
 */
interface UsuarioRepositoryInterface
{
    public function criar(string $nome, string $email, string $senhaHash, string $papel = 'jogador'): int;

    /** Inclui senha_hash (necessário para o login). */
    public function buscarPorEmail(string $email): ?array;

    /** Não retorna senha_hash. */
    public function buscarPorId(int $id): ?array;

    /** Lista para o administrador, com total de partidas por usuário. */
    public function listar(): array;

    public function atualizarNome(int $id, string $nome): void;

    public function atualizarSenha(int $id, string $senhaHash): void;

    public function atualizarPapel(int $id, string $papel): void;

    public function excluir(int $id): bool;

    public function contarAdmins(): int;
}

interface PartidaRepositoryInterface
{
    /** @param array{resultado:string,motivo:string,vida_final:int,vida_oponente:int,turnos:int} $dados */
    public function criar(int $usuarioId, array $dados): int;

    public function buscarPorId(int $id): ?array;

    public function listarPorUsuario(int $usuarioId, int $limite, int $offset): array;

    /** @return array{total:int,vitorias:int,soma_vida_final:int} */
    public function resumo(int $usuarioId): array;

    public function excluir(int $id): bool;
}

interface TentativaLoginRepositoryInterface
{
    public function registrarFalha(string $email, string $ip): void;

    public function contarRecentes(string $email, string $ip, int $minutos): int;

    public function limpar(string $email, string $ip): void;
}
