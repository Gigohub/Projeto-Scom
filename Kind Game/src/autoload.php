<?php
declare(strict_types=1);

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