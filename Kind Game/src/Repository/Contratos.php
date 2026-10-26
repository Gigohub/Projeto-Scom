namespace KindGame\Repository;

interface UsuarioRepositoryInterface
{
    public function criar(string $nome, string $email, string $senhaHash, string $papel = 'jogador'): int;
    public function buscarPorEmail(string $email): ?array;   // inclui senha_hash (para o login)
    public function buscarPorId(int $id): ?array;            // NÃO inclui senha_hash
    public function listar(): array;                         // para o admin
    public function atualizarNome(int $id, string $nome): void;
    public function atualizarSenha(int $id, string $senhaHash): void;
    public function atualizarPapel(int $id, string $papel): void;
    public function excluir(int $id): bool;
    public function contarAdmins(): int;
}