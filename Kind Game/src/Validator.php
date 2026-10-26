namespace KindGame;

final class Validator
{
    public static function nome(mixed $valor): ?string
    {
        if (!is_string($valor)) {
            return 'Informe seu nome.';
        }
        $tamanho = mb_strlen($valor);
        if ($tamanho < 2 || $tamanho > 50) {
            return 'O nome deve ter entre 2 e 50 caracteres.';
        }
        if (!preg_match('/^[\p{L}\p{N} ._\-]+$/u', $valor)) {
            return 'O nome contém caracteres inválidos.';
        }
        return null;
    }

    public static function email(mixed $valor): ?string
    {
        if (!is_string($valor) || $valor === '') {
            return 'Informe seu e-mail.';
        }
        if (mb_strlen($valor) > 120 || filter_var($valor, FILTER_VALIDATE_EMAIL) === false) {
            return 'E-mail inválido.';
        }
        return null;
    }

    public static function senha(mixed $valor): ?string
    {
        if (!is_string($valor)) {
            return 'Informe uma senha.';
        }
        if (mb_strlen($valor) < 8 || strlen($valor) > 72) {
            return 'A senha deve ter entre 8 e 72 caracteres.';
        }
        if (!preg_match('/[A-Za-z]/', $valor) || !preg_match('/\d/', $valor)) {
            return 'A senha deve conter letras e números.';
        }
        return null;
    }

    public static function inteiro(mixed $valor, int $min, int $max): ?string
    {
        if (!is_int($valor)) {
            return 'Deve ser um número inteiro.';
        }
        return ($valor < $min || $valor > $max) ? "Deve estar entre {$min} e {$max}." : null;
    }

    public static function opcao(mixed $valor, array $permitidos): ?string
    {
        if (!is_string($valor) || !in_array($valor, $permitidos, true)) {
            return 'Valor inválido. Permitidos: ' . implode(', ', $permitidos) . '.';
        }
        return null;
    }

    public static function limpar(string $texto): string
    {
        $texto = preg_replace('/[\x00-\x1F\x7F]/u', '', $texto) ?? '';
        $texto = preg_replace('/\s+/u', ' ', $texto) ?? '';
        return trim($texto);
    }
}