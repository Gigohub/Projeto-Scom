use PDO;

final class Database
{
    private static ?PDO $pdo = null;

    public static function conexao(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                Config::obter('DB_HOST', '127.0.0.1'), Config::obter('DB_PORT', '3306'), Config::obter('DB_NAME', 'kind_game'));
            self::$pdo = new PDO($dsn, Config::obter('DB_USER', 'root'), Config::obter('DB_PASS', ''), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$pdo;
    }
}