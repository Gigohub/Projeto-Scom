<?php
declare(strict_types=1);

/**
 * Testes automatizados da lógica de negócio (sem PHPUnit e sem banco de dados).
 * Executar:  php tests/run.php        (no XAMPP: C:\xampp\php\php.exe tests\run.php)
 */

require __DIR__ . '/../src/autoload.php';
require __DIR__ . '/Fakes.php';

use KindGame\AppException;
use KindGame\Service\AuthService;
use KindGame\Service\PartidaService;
use KindGame\Service\UsuarioService;
use KindGame\Tests\PartidaRepoFalso;
use KindGame\Tests\TentativaRepoFalso;
use KindGame\Tests\UsuarioRepoFalso;

$total = 0;
$falhas = 0;

function teste(string $nome, callable $corpo): void
{
    global $total, $falhas;
    $total++;
    try {
        $corpo();
        echo "  [OK]    {$nome}\n";
    } catch (Throwable $e) {
        $falhas++;
        echo "  [FALHA] {$nome}\n          -> " . $e->getMessage() . "\n";
    }
}

function afirmar(bool $condicao, string $mensagem = 'Asserção falhou'): void
{
    if (!$condicao) {
        throw new RuntimeException($mensagem);
    }
}

function afirmarIgual(mixed $esperado, mixed $atual, string $mensagem = ''): void
{
    if ($esperado !== $atual) {
        throw new RuntimeException(
            ($mensagem !== '' ? $mensagem . ': ' : '') . 'esperado ' . var_export($esperado, true) . ', obtido ' . var_export($atual, true)
        );
    }
}

/** Executa $fn e exige uma AppException com o status informado. */
function esperarErro(callable $fn, int $status): AppException
{
    try {
        $fn();
    } catch (AppException $e) {
        afirmarIgual($status, $e->status(), 'status HTTP');
        return $e;
    }
    throw new RuntimeException("Esperava AppException {$status}, mas nenhuma exceção foi lançada.");
}

function criarAuth(): array
{
    $usuarios = new UsuarioRepoFalso();
    $tentativas = new TentativaRepoFalso();
    return [new AuthService($usuarios, $tentativas), $usuarios, $tentativas];
}

function cadastrarPadrao(AuthService $auth): array
{
    return $auth->registrar(['nome' => 'Caio Gabriel', 'email' => 'caio@teste.com', 'senha' => 'Senha1234']);
}

$VITORIA_LP = ['resultado' => 'vitoria', 'motivo' => 'lp', 'vida_final' => 3000, 'vida_oponente' => 0, 'turnos' => 7];
$DERROTA_LP = ['resultado' => 'derrota', 'motivo' => 'lp', 'vida_final' => 0, 'vida_oponente' => 1200, 'turnos' => 9];
$VITORIA_COMBO = ['resultado' => 'vitoria', 'motivo' => 'combo_sagrado', 'vida_final' => 1000, 'vida_oponente' => 4000, 'turnos' => 3];

echo "\nCadastro\n";

teste('cadastro válido guarda o hash (nunca a senha em texto)', function () {
    [$auth, $repo] = criarAuth();
    $usuario = $auth->registrar(['nome' => 'Caio Gabriel', 'email' => 'Caio@Teste.com', 'senha' => 'Senha1234']);
    afirmarIgual('caio@teste.com', $usuario['email'], 'e-mail normalizado');
    $linha = $repo->linhas[$usuario['id']];
    afirmar($linha['senha_hash'] !== 'Senha1234', 'senha não pode ser salva em texto');
    afirmar(password_verify('Senha1234', $linha['senha_hash']), 'hash deve validar a senha original');
    afirmarIgual('jogador', $linha['papel'], 'papel padrão');
});

teste('cadastro rejeita e-mail inválido (422)', function () {
    [$auth] = criarAuth();
    $erro = esperarErro(fn () => $auth->registrar(['nome' => 'Caio', 'email' => 'nao-e-email', 'senha' => 'Senha1234']), 422);
    afirmar(isset($erro->campos()['email']), 'deve apontar o campo email');
});

teste('cadastro rejeita senha fraca: curta ou sem número (422)', function () {
    [$auth] = criarAuth();
    esperarErro(fn () => $auth->registrar(['nome' => 'Caio', 'email' => 'a@b.com', 'senha' => 'abc']), 422);
    esperarErro(fn () => $auth->registrar(['nome' => 'Caio', 'email' => 'a@b.com', 'senha' => 'somenteletras']), 422);
});

teste('cadastro rejeita e-mail duplicado (409)', function () {
    [$auth] = criarAuth();
    cadastrarPadrao($auth);
    esperarErro(fn () => cadastrarPadrao($auth), 409);
});

teste('segurança: payload de SQL Injection no e-mail é rejeitado', function () {
    [$auth] = criarAuth();
    esperarErro(fn () => $auth->registrar(['nome' => 'Caio', 'email' => "' OR '1'='1' --", 'senha' => 'Senha1234']), 422);
    esperarErro(fn () => $auth->autenticar(['email' => "admin' --", 'senha' => 'x'], '127.0.0.1'), 422);
});

teste('segurança: payload XSS no nome é rejeitado', function () {
    [$auth] = criarAuth();
    $erro = esperarErro(fn () => $auth->registrar(['nome' => '<script>alert(1)</script>', 'email' => 'a@b.com', 'senha' => 'Senha1234']), 422);
    afirmar(isset($erro->campos()['nome']), 'deve apontar o campo nome');
});

echo "\nLogin\n";

teste('login válido retorna o usuário sem expor o hash', function () {
    [$auth] = criarAuth();
    cadastrarPadrao($auth);
    $usuario = $auth->autenticar(['email' => 'CAIO@teste.com', 'senha' => 'Senha1234'], '127.0.0.1');
    afirmarIgual('caio@teste.com', $usuario['email']);
    afirmar(!array_key_exists('senha_hash', $usuario), 'não pode vazar senha_hash');
});

teste('login com senha errada retorna 401 com mensagem genérica', function () {
    [$auth] = criarAuth();
    cadastrarPadrao($auth);
    $erro = esperarErro(fn () => $auth->autenticar(['email' => 'caio@teste.com', 'senha' => 'Errada123'], '127.0.0.1'), 401);
    afirmarIgual('E-mail ou senha inválidos.', $erro->getMessage());
});

teste('login com e-mail inexistente retorna a MESMA mensagem (sem enumerar usuários)', function () {
    [$auth] = criarAuth();
    $erro = esperarErro(fn () => $auth->autenticar(['email' => 'ninguem@teste.com', 'senha' => 'Senha1234'], '127.0.0.1'), 401);
    afirmarIgual('E-mail ou senha inválidos.', $erro->getMessage());
});

teste('após 5 falhas o login é bloqueado (429), mesmo com a senha certa', function () {
    [$auth] = criarAuth();
    cadastrarPadrao($auth);
    for ($i = 0; $i < 5; $i++) {
        esperarErro(fn () => $auth->autenticar(['email' => 'caio@teste.com', 'senha' => 'Errada123'], '10.0.0.1'), 401);
    }
    esperarErro(fn () => $auth->autenticar(['email' => 'caio@teste.com', 'senha' => 'Senha1234'], '10.0.0.1'), 429);
});

echo "\nHistórico de partidas\n";

teste('partida válida (vitória por LP) é registrada', function () use ($VITORIA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    $partida = $servico->registrar(1, $VITORIA_LP);
    afirmarIgual(1, $partida['id']);
    afirmarIgual('vitoria', $partida['resultado']);
    afirmarIgual(3000, $partida['vida_final']);
});

teste('partida com resultado inválido ("empate") é rejeitada (422)', function () use ($VITORIA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    $erro = esperarErro(fn () => $servico->registrar(1, ['resultado' => 'empate'] + $VITORIA_LP), 422);
    afirmar(isset($erro->campos()['resultado']));
});

teste('partida com vida negativa ou não numérica é rejeitada (422)', function () use ($VITORIA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    esperarErro(fn () => $servico->registrar(1, ['vida_final' => -5] + $VITORIA_LP), 422);
    esperarErro(fn () => $servico->registrar(1, ['vida_final' => '3000; DROP TABLE partidas'] + $VITORIA_LP), 422);
});

teste('partida inconsistente é rejeitada: derrota por LP com vida final > 0', function () use ($DERROTA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    esperarErro(fn () => $servico->registrar(1, ['vida_final' => 500] + $DERROTA_LP), 422);
});

teste('estatísticas: total, vitórias, derrotas, taxa e média de vida final', function () use ($VITORIA_LP, $DERROTA_LP, $VITORIA_COMBO) {
    $servico = new PartidaService(new PartidaRepoFalso());
    $servico->registrar(1, $VITORIA_LP);
    $servico->registrar(1, $DERROTA_LP);
    $servico->registrar(1, $VITORIA_COMBO);
    $lista = $servico->listar(1, 1, 10);
    $est = $lista['estatisticas'];
    afirmarIgual(3, $est['total']);
    afirmarIgual(2, $est['vitorias']);
    afirmarIgual(1, $est['derrotas']);
    afirmarIgual(66.7, $est['taxa_vitoria']);
    afirmarIgual(1333, $est['media_vida_final']);
    afirmarIgual(3, count($lista['itens']));
});

teste('paginação limita o tamanho da página a 50', function () {
    $servico = new PartidaService(new PartidaRepoFalso());
    afirmarIgual(50, $servico->listar(1, 1, 1000)['limite']);
    afirmarIgual(1, $servico->listar(1, 0, 0)['pagina']);
});

teste('histórico é isolado por usuário', function () use ($VITORIA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    $servico->registrar(1, $VITORIA_LP);
    afirmarIgual(0, count($servico->listar(2, 1, 10)['itens']));
});

echo "\nControle de acesso\n";

teste('jogador não exclui partida de outro (403); o dono exclui; o admin exclui', function () use ($VITORIA_LP) {
    $servico = new PartidaService(new PartidaRepoFalso());
    $a = $servico->registrar(1, $VITORIA_LP)['id'];
    $b = $servico->registrar(1, $VITORIA_LP)['id'];
    esperarErro(fn () => $servico->excluir(2, 'jogador', $a), 403);
    $servico->excluir(1, 'jogador', $a);
    $servico->excluir(99, 'admin', $b);
    esperarErro(fn () => $servico->excluir(1, 'jogador', $a), 404);
});

teste('o último administrador não pode ser rebaixado nem excluído (409)', function () {
    $repo = new UsuarioRepoFalso();
    $idAdmin = $repo->criar('Admin', 'admin@teste.com', 'hash', 'admin');
    $servico = new UsuarioService($repo);
    esperarErro(fn () => $servico->alterarPapel($idAdmin, 'jogador'), 409);
    esperarErro(fn () => $servico->excluir($idAdmin), 409);
});

teste('admin pode promover um jogador e rebaixar quando há outro admin', function () {
    $repo = new UsuarioRepoFalso();
    $admin = $repo->criar('Admin', 'admin@teste.com', 'hash', 'admin');
    $jogador = $repo->criar('Jogador', 'j@teste.com', 'hash', 'jogador');
    $servico = new UsuarioService($repo);
    afirmarIgual('admin', $servico->alterarPapel($jogador, 'admin')['papel']);
    afirmarIgual('jogador', $servico->alterarPapel($admin, 'jogador')['papel']);
});

teste('papel inexistente é rejeitado (422)', function () {
    $repo = new UsuarioRepoFalso();
    $id = $repo->criar('Jogador', 'j@teste.com', 'hash', 'jogador');
    esperarErro(fn () => (new UsuarioService($repo))->alterarPapel($id, 'superadmin'), 422);
});

echo "\nResultado: " . ($total - $falhas) . " de {$total} testes passaram.\n";
exit($falhas === 0 ? 0 : 1);
