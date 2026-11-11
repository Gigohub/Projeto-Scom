<?php
declare(strict_types=1);

namespace KindGame;

use KindGame\Repository\PartidaRepository;
use KindGame\Repository\TentativaLoginRepository;
use KindGame\Repository\UsuarioRepository;
use KindGame\Service\AuthService;
use KindGame\Service\PartidaService;
use KindGame\Service\UsuarioService;

/** Monta os objetos da aplicação (evita repetir `new` em cada endpoint). */
final class Container
{
    public static function usuarios(): UsuarioRepository
    {
        return new UsuarioRepository(Database::conexao());
    }

    public static function auth(): AuthService
    {
        return new AuthService(self::usuarios(), new TentativaLoginRepository(Database::conexao()));
    }

    public static function partidas(): PartidaService
    {
        return new PartidaService(new PartidaRepository(Database::conexao()));
    }

    public static function usuariosAdmin(): UsuarioService
    {
        return new UsuarioService(self::usuarios());
    }
    public static function db(): \PDO
{
    return Database::conexao();
}
}
