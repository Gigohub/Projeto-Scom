<?php
declare(strict_types=1);

namespace KindGame;

/**
 * Erro "esperado" da aplicação (validação, permissão, conflito...).
 * Carrega o status HTTP e, opcionalmente, mensagens por campo.
 */
class AppException extends \RuntimeException
{
    public function __construct(
        string $mensagem,
        private int $status = 400,
        private array $campos = []
    ) {
        parent::__construct($mensagem);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function campos(): array
    {
        return $this->campos;
    }
}
