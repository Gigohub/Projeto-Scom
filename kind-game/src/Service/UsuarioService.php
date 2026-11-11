<?php
declare(strict_types=1);

namespace KindGame\Service;

use KindGame\AppException;
use KindGame\Repository\UsuarioRepositoryInterface;
use KindGame\Validator;

/** Operações administrativas sobre usuários (perfil "admin"). */
final class UsuarioService
{
    public function __construct(private UsuarioRepositoryInterface $usuarios)
    {
    }

    public function listar(): array
    {
        return $this->usuarios->listar();
    }

    public function alterarPapel(int $alvoId, mixed $papel): array
    {
        $erro = Validator::opcao($papel, ['jogador', 'admin']);
        if ($erro !== null) {
            throw new AppException('Dados inválidos.', 422, ['papel' => $erro]);
        }
        $alvo = $this->usuarios->buscarPorId($alvoId) ?? throw new AppException('Usuário não encontrado.', 404);

        if ($alvo['papel'] === 'admin' && $papel === 'jogador' && $this->usuarios->contarAdmins() <= 1) {
            throw new AppException('Não é possível rebaixar o último administrador.', 409);
        }
        $this->usuarios->atualizarPapel($alvoId, $papel);

        return $this->usuarios->buscarPorId($alvoId);
    }

    public function excluir(int $alvoId): void
    {
        $alvo = $this->usuarios->buscarPorId($alvoId) ?? throw new AppException('Usuário não encontrado.', 404);

        if ($alvo['papel'] === 'admin' && $this->usuarios->contarAdmins() <= 1) {
            throw new AppException('Não é possível excluir o último administrador.', 409);
        }
        $this->usuarios->excluir($alvoId); // as partidas somem junto (ON DELETE CASCADE)
    }
}
