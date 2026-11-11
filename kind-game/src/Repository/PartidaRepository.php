<?php
declare(strict_types=1);

namespace KindGame\Repository;

use PDO;

/** Acesso a dados do histórico de partidas. */
final class PartidaRepository implements PartidaRepositoryInterface
{
    public function __construct(private PDO $pdo)
    {
    }

    public function criar(int $usuarioId, array $dados): int
    {
        $st = $this->pdo->prepare(
            'INSERT INTO partidas (usuario_id, resultado, motivo, vida_final, vida_oponente, turnos)
             VALUES (:usuario, :resultado, :motivo, :vida_final, :vida_oponente, :turnos)'
        );
        $st->execute([
            ':usuario'       => $usuarioId,
            ':resultado'     => $dados['resultado'],
            ':motivo'        => $dados['motivo'],
            ':vida_final'    => $dados['vida_final'],
            ':vida_oponente' => $dados['vida_oponente'],
            ':turnos'        => $dados['turnos'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function buscarPorId(int $id): ?array
    {
        $st = $this->pdo->prepare('SELECT * FROM partidas WHERE id = :id LIMIT 1');
        $st->execute([':id' => $id]);
        $linha = $st->fetch();
        return $linha === false ? null : $linha;
    }

    public function listarPorUsuario(int $usuarioId, int $limite, int $offset): array
    {
        $st = $this->pdo->prepare(
            'SELECT id, resultado, motivo, vida_final, vida_oponente, turnos, jogada_em
               FROM partidas
              WHERE usuario_id = :usuario
              ORDER BY jogada_em DESC, id DESC
              LIMIT :limite OFFSET :offset'
        );
        $st->bindValue(':usuario', $usuarioId, PDO::PARAM_INT);
        $st->bindValue(':limite', $limite, PDO::PARAM_INT);
        $st->bindValue(':offset', $offset, PDO::PARAM_INT);
        $st->execute();
        return $st->fetchAll();
    }

    public function resumo(int $usuarioId): array
    {
        $st = $this->pdo->prepare(
            "SELECT COUNT(*) AS total,
                    COALESCE(SUM(resultado = 'vitoria'), 0) AS vitorias,
                    COALESCE(SUM(vida_final), 0) AS soma_vida_final
               FROM partidas
              WHERE usuario_id = :usuario"
        );
        $st->execute([':usuario' => $usuarioId]);
        $linha = $st->fetch();
        return [
            'total'           => (int) $linha['total'],
            'vitorias'        => (int) $linha['vitorias'],
            'soma_vida_final' => (int) $linha['soma_vida_final'],
        ];
    }

    public function excluir(int $id): bool
    {
        $st = $this->pdo->prepare('DELETE FROM partidas WHERE id = :id');
        $st->execute([':id' => $id]);
        return $st->rowCount() > 0;
    }
}
