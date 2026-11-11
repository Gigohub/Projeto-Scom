<?php
declare(strict_types=1);

namespace KindGame\Service;

use KindGame\AppException;
use KindGame\Repository\PartidaRepositoryInterface;
use KindGame\Validator;

/** Regras de negócio do histórico de partidas. */
final class PartidaService
{
    public const VIDA_MAXIMA = 100000;
    public const TURNOS_MAXIMOS = 500;
    public const TAMANHO_MAXIMO_PAGINA = 50;

    public function __construct(private PartidaRepositoryInterface $partidas)
    {
    }

    public function registrar(int $usuarioId, array $dados): array
    {
        $dados['motivo'] = $dados['motivo'] ?? 'lp';

        $erros = array_filter([
            'resultado'     => Validator::opcao($dados['resultado'] ?? null, ['vitoria', 'derrota']),
            'motivo'        => Validator::opcao($dados['motivo'], ['lp', 'combo_sagrado']),
            'vida_final'    => Validator::inteiro($dados['vida_final'] ?? null, 0, self::VIDA_MAXIMA),
            'vida_oponente' => Validator::inteiro($dados['vida_oponente'] ?? null, 0, self::VIDA_MAXIMA),
            'turnos'        => Validator::inteiro($dados['turnos'] ?? null, 1, self::TURNOS_MAXIMOS),
        ]);
        if ($erros !== []) {
            throw new AppException('Dados da partida inválidos.', 422, $erros);
        }

        // Consistência com as regras do jogo: partida decidida por LP termina com
        // algum dos dois jogadores em 0. Isso barra os envios forjados mais óbvios.
        if ($dados['motivo'] === 'lp') {
            if ($dados['resultado'] === 'derrota' && $dados['vida_final'] !== 0) {
                throw new AppException('Dados da partida inconsistentes.', 422, [
                    'vida_final' => 'Em derrota por LP, a vida final do jogador deve ser 0.',
                ]);
            }
            if ($dados['resultado'] === 'vitoria' && ($dados['vida_oponente'] !== 0 || $dados['vida_final'] === 0)) {
                throw new AppException('Dados da partida inconsistentes.', 422, [
                    'vida_oponente' => 'Em vitória por LP, o oponente deve terminar com 0 e o jogador com mais de 0.',
                ]);
            }
        }

        $limpo = [
            'resultado'     => $dados['resultado'],
            'motivo'        => $dados['motivo'],
            'vida_final'    => $dados['vida_final'],
            'vida_oponente' => $dados['vida_oponente'],
            'turnos'        => $dados['turnos'],
        ];
        $id = $this->partidas->criar($usuarioId, $limpo);

        return ['id' => $id] + $limpo;
    }

    public function listar(int $usuarioId, int $pagina, int $limite): array
    {
        $pagina = max(1, $pagina);
        $limite = min(self::TAMANHO_MAXIMO_PAGINA, max(1, $limite));

        $itens = $this->partidas->listarPorUsuario($usuarioId, $limite, ($pagina - 1) * $limite);
        $estatisticas = $this->estatisticas($this->partidas->resumo($usuarioId));

        return [
            'itens'         => $itens,
            'pagina'        => $pagina,
            'limite'        => $limite,
            'total_paginas' => (int) max(1, ceil($estatisticas['total'] / $limite)),
            'estatisticas'  => $estatisticas,
        ];
    }

    /** @param array{total:int,vitorias:int,soma_vida_final:int} $resumo */
    public function estatisticas(array $resumo): array
    {
        $total = $resumo['total'];
        $vitorias = $resumo['vitorias'];

        return [
            'total'            => $total,
            'vitorias'         => $vitorias,
            'derrotas'         => $total - $vitorias,
            'taxa_vitoria'     => $total > 0 ? round($vitorias / $total * 100, 1) : 0.0,
            'media_vida_final' => $total > 0 ? (int) round($resumo['soma_vida_final'] / $total) : 0,
        ];
    }

    /** O dono da partida ou um administrador podem excluir. */
    public function excluir(int $usuarioId, string $papel, int $partidaId): void
    {
        $partida = $this->partidas->buscarPorId($partidaId) ?? throw new AppException('Partida não encontrada.', 404);

        if ((int) $partida['usuario_id'] !== $usuarioId && $papel !== 'admin') {
            throw new AppException('Você não tem permissão para excluir esta partida.', 403);
        }
        $this->partidas->excluir($partidaId);
    }
}
