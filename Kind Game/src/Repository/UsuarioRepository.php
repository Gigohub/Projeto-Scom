namespace KindGame\Repository;

use KindGame\AppException;
use PDO;
use PDOException;

final class UsuarioRepository implements UsuarioRepositoryInterface
{
    public function __construct(private PDO $pdo)
    {
    }

    public function criar(string $nome, string $email, string $senhaHash, string $papel = 'jogador'): int
    {
        try {
            $st = $this->pdo->prepare(
                'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (:nome, :email, :hash, :papel)'
            );
            $st->execute([':nome' => $nome, ':email' => $email, ':hash' => $senhaHash, ':papel' => $papel]);
            return (int) $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) { // violação do UNIQUE do e-mail
                throw new AppException('Este e-mail já está cadastrado.', 409, ['email' => 'Este e-mail já está cadastrado.']);
            }
            throw $e;
        }
    }

    public function buscarPorEmail(string $email): ?array
    {
        $st = $this->pdo->prepare('SELECT id, nome, email, senha_hash, papel, criado_em FROM usuarios WHERE email = :email LIMIT 1');
        $st->execute([':email' => $email]);
        $linha = $st->fetch();
        return $linha === false ? null : $linha;
    }

    public function buscarPorId(int $id): ?array
    {
        $st = $this->pdo->prepare('SELECT id, nome, email, papel, criado_em FROM usuarios WHERE id = :id LIMIT 1');
        $st->execute([':id' => $id]);
        $linha = $st->fetch();
        return $linha === false ? null : $linha;
    }

    public function listar(): array
    {
        return $this->pdo->query(
            'SELECT u.id, u.nome, u.email, u.papel, u.criado_em, COUNT(p.id) AS total_partidas
               FROM usuarios u LEFT JOIN partidas p ON p.usuario_id = u.id
              GROUP BY u.id, u.nome, u.email, u.papel, u.criado_em ORDER BY u.id'
        )->fetchAll();
    }

    public function atualizarNome(int $id, string $nome): void
    {
        $this->pdo->prepare('UPDATE usuarios SET nome = :nome WHERE id = :id')->execute([':nome' => $nome, ':id' => $id]);
    }

    public function atualizarSenha(int $id, string $senhaHash): void
    {
        $this->pdo->prepare('UPDATE usuarios SET senha_hash = :hash WHERE id = :id')->execute([':hash' => $senhaHash, ':id' => $id]);
    }

    public function atualizarPapel(int $id, string $papel): void
    {
        $this->pdo->prepare('UPDATE usuarios SET papel = :papel WHERE id = :id')->execute([':papel' => $papel, ':id' => $id]);
    }

    public function excluir(int $id): bool
    {
        $st = $this->pdo->prepare('DELETE FROM usuarios WHERE id = :id');
        $st->execute([':id' => $id]);
        return $st->rowCount() > 0;
    }

    public function contarAdmins(): int
    {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM usuarios WHERE papel = 'admin'")->fetchColumn();
    }
}