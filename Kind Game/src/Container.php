namespace KindGame;

use KindGame\Repository\UsuarioRepository;
use KindGame\Service\AuthService;

final class Container
{
    public static function usuarios(): UsuarioRepository
    {
        return new UsuarioRepository(Database::conexao());
    }

    public static function auth(): AuthService
    {
        return new AuthService(self::usuarios());
    }
}