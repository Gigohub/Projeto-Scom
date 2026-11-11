<?php
declare(strict_types=1);

/**
 * Autoloader mínimo: transforma KindGame\Repository\UsuarioRepository
 * em src/Repository/UsuarioRepository.php. Dispensa o Composer no XAMPP.
 */
spl_autoload_register(function (string $classe): void {
    $prefixo = 'KindGame\\';
    if (strncmp($classe, $prefixo, strlen($prefixo)) !== 0) {
        return;
    }
    $relativo = str_replace('\\', '/', substr($classe, strlen($prefixo)));
    $arquivo = __DIR__ . '/' . $relativo . '.php';
    if (is_file($arquivo)) {
        require $arquivo;
    }
});

// As interfaces ficam todas em um único arquivo, então são carregadas à mão.
require_once __DIR__ . '/Repository/Contratos.php';
