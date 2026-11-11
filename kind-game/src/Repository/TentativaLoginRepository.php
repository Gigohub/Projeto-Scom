<?php
declare(strict_types=1);

namespace KindGame\Repository;

use PDO;

/** Registro de falhas de login (limite simples contra força bruta). */
final class TentativaLoginRepository implements TentativaLoginRepositoryInterface
{
    public function __construct(private PDO $pdo)
    {
    }

    public function registrarFalha(string $email, string $ip): void
    {
        $st = $this->pdo->prepare('INSERT INTO tentativas_login (email, ip) VALUES (:email, :ip)');
        $st->execute([':email' => $email, ':ip' => $ip]);
    }

    public function contarRecentes(string $email, string $ip, int $minutos): int
    {
        // (int) garante que apenas um número entra no SQL (INTERVAL não aceita placeholder em todos os drivers).
        $sql = 'SELECT COUNT(*) FROM tentativas_login
                 WHERE email = :email AND ip = :ip
                   AND criado_em >= DATE_SUB(NOW(), INTERVAL ' . (int) $minutos . ' MINUTE)';
        $st = $this->pdo->prepare($sql);
        $st->execute([':email' => $email, ':ip' => $ip]);
        return (int) $st->fetchColumn();
    }

    public function limpar(string $email, string $ip): void
    {
        $st = $this->pdo->prepare('DELETE FROM tentativas_login WHERE email = :email AND ip = :ip');
        $st->execute([':email' => $email, ':ip' => $ip]);
    }
}
