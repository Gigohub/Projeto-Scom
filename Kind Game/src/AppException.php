class AppException extends \RuntimeException
{
    public function __construct(string $mensagem, private int $status = 400, private array $campos = [])
    {
        parent::__construct($mensagem);
    }

    public function status(): int { return $this->status; }
    public function campos(): array { return $this->campos; }
}