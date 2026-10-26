final class Logger
{
    public static function registrar(string $nivel, string $evento, array $contexto = []): void
    {
        $partes = [];
        foreach ($contexto as $chave => $valor) {
            $partes[] = $chave . '=' . substr(str_replace(["\r", "\n"], ' ', (string) $valor), 0, 200);
        }
        $linha = sprintf("%s [%s] %s %s\n", date('c'), strtoupper($nivel), $evento, implode(' ', $partes));
        @file_put_contents(dirname(__DIR__) . '/logs/app.log', $linha, FILE_APPEND | LOCK_EX);
    }
}