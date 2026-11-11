<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use KindGame\Auth;
use KindGame\Request;
use KindGame\Response;

Request::exigirMetodos(['GET']);
Response::sucesso(['csrf_token' => Auth::tokenCsrf()]);
