<?php
declare(strict_types=1);

namespace KindGame\Service;

use KindGame\AppException;
use KindGame\Repository\TentativaLoginRepositoryInterface;
use KindGame\Repository\UsuarioRepositoryInterface;
use KindGame\Validator;

/** Regras de negócio de cadastro, login e perfil (sem HTTP e sem SQL). */
final class AuthService
{
    private const MAX_FALHAS = 5;
    private const JANELA_MINUTOS = 10;
    private static ?string $hashFalso = null;

    public function __construct(
        private UsuarioRepositoryInterface $usuarios,
        private TentativaLoginRepositoryInterface $tentativas
    ) {
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

        // Senha nunca é guardada em texto: password_hash usa bcrypt/Argon2 com salt automático.
        $id = $this->usuarios->criar($nome, $email, password_hash($senha, PASSWORD_DEFAULT));

        return ['id' => $id, 'nome' => $nome, 'email' => $email, 'papel' => 'jogador'];
    }

    public function autenticar(array $dados, string $ip): array
    {
        $email = $this->normalizarEmail($dados['email'] ?? '');
        $senha = is_string($dados['senha'] ?? null) ? $dados['senha'] : '';

        if (Validator::email($email) !== null || $senha === '') {
            throw new AppException('Informe e-mail e senha válidos.', 422, [
                'email' => Validator::email($email) ?? '',
                'senha' => $senha === '' ? 'Informe sua senha.' : '',
            ]);
        }

        if ($this->tentativas->contarRecentes($email, $ip, self::JANELA_MINUTOS) >= self::MAX_FALHAS) {
            throw new AppException('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.', 429);
        }

        $usuario = $this->usuarios->buscarPorEmail($email);

        // Mesmo para e-mail inexistente fazemos um password_verify, para o tempo
        // de resposta não revelar quais e-mails estão cadastrados.
        $hash = $usuario['senha_hash'] ?? self::hashFalso();
        $senhaConfere = password_verify($senha, $hash);

        if ($usuario === null || !$senhaConfere) {
            $this->tentativas->registrarFalha($email, $ip);
            // Mensagem genérica: não diz se o e-mail existe.
            throw new AppException('E-mail ou senha inválidos.', 401);
        }

        $this->tentativas->limpar($email, $ip);

        if (password_needs_rehash($usuario['senha_hash'], PASSWORD_DEFAULT)) {
            $this->usuarios->atualizarSenha((int) $usuario['id'], password_hash($senha, PASSWORD_DEFAULT));
        }

        return [
            'id'    => (int) $usuario['id'],
            'nome'  => $usuario['nome'],
            'email' => $usuario['email'],
            'papel' => $usuario['papel'],
        ];
    }

    /** Atualiza nome e/ou senha (a troca de senha exige a senha atual). */
    public function atualizarPerfil(int $id, array $dados): array
    {
        $usuario = $this->usuarios->buscarPorId($id) ?? throw new AppException('Usuário não encontrado.', 404);

        $temNome = array_key_exists('nome', $dados);
        $novaSenha = $dados['nova_senha'] ?? null;
        if (!$temNome && $novaSenha === null) {
            throw new AppException('Informe nome e/ou nova_senha para atualizar.', 422);
        }

        $erros = [];
        $nome = null;
        if ($temNome) {
            $nome = Validator::limpar(is_string($dados['nome']) ? $dados['nome'] : '');
            $erroNome = Validator::nome($nome);
            if ($erroNome !== null) {
                $erros['nome'] = $erroNome;
            }
        }

        if ($novaSenha !== null) {
            $erroSenha = Validator::senha($novaSenha);
            if ($erroSenha !== null) {
                $erros['nova_senha'] = $erroSenha;
            } else {
                $completo = $this->usuarios->buscarPorEmail($usuario['email']);
                $atual = $dados['senha_atual'] ?? null;
                if (!is_string($atual) || $completo === null || !password_verify($atual, $completo['senha_hash'])) {
                    $erros['senha_atual'] = 'Senha atual incorreta.';
                }
            }
        }

        if ($erros !== []) {
            throw new AppException('Dados inválidos.', 422, $erros);
        }

        if ($nome !== null) {
            $this->usuarios->atualizarNome($id, $nome);
        }
        if ($novaSenha !== null) {
            $this->usuarios->atualizarSenha($id, password_hash($novaSenha, PASSWORD_DEFAULT));
        }

        return $this->usuarios->buscarPorId($id);
    }

    private function normalizarEmail(mixed $bruto): string
    {
        return is_string($bruto) ? mb_strtolower(trim($bruto)) : '';
    }

    private static function hashFalso(): string
    {
        return self::$hashFalso ??= password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
    }
}
