namespace KindGame\Service;

use KindGame\AppException;
use KindGame\Repository\UsuarioRepositoryInterface;
use KindGame\Validator;

final class AuthService
{
    public function __construct(private UsuarioRepositoryInterface $usuarios)
    {
    }

    public function registrar(array $dados): array
    {
        $nome = Validator::limpar(is_string($dados['nome'] ?? null) ? $dados['nome'] : '');
        $email = $this->normalizarEmail($dados['email'] ?? '');
        $senha = $dados['senha'] ?? null;

        $erros = array_filter([
            'nome'  => Validator::nome($nome),
            'email' => Validator::email($email),
            'senha' => Validator::senha($senha),
        ]);
        if ($erros !== []) {
            throw new AppException('Dados inválidos.', 422, $erros);
        }

        if ($this->usuarios->buscarPorEmail($email) !== null) {
            throw new AppException('Este e-mail já está cadastrado.', 409, ['email' => 'Este e-mail já está cadastrado.']);
        }

        $id = $this->usuarios->criar($nome, $email, password_hash($senha, PASSWORD_DEFAULT));

        return ['id' => $id, 'nome' => $nome, 'email' => $email, 'papel' => 'jogador'];
    }

    private function normalizarEmail(mixed $bruto): string
    {
        return is_string($bruto) ? mb_strtolower(trim($bruto)) : '';
    }
}