# API do Kind Game

Base: `http://localhost/kind-game/api/` · Formato: JSON (UTF-8) · Autenticação: sessão por cookie `KINDSESSID` (HttpOnly, SameSite=Lax).

**CSRF:** toda requisição `POST`, `PUT` e `DELETE` deve enviar o cabeçalho `X-CSRF-Token` (obtido em `GET csrf.php` ou no login) e `Content-Type: application/json`.

**Formato de sucesso:** `{"sucesso": true, "dados": {...}}`
**Formato de erro:** `{"sucesso": false, "erro": {"status": 422, "mensagem": "...", "campos": {"email": "..."}, "detalhes": "só com APP_ENV=development"}}`

## Resumo

| Método | URL | Acesso | Descrição |
|---|---|---|---|
| GET | `csrf.php` | público | Retorna o token CSRF da sessão |
| POST | `auth/register.php` | público | Cria conta (perfil `jogador`) |
| POST | `auth/login.php` | público | Abre a sessão |
| POST | `auth/logout.php` | público | Encerra a sessão |
| GET | `auth/me.php` | logado | Dados do usuário logado |
| PUT | `perfil.php` | logado | Altera nome e/ou senha |
| GET | `partidas.php?pagina=1&limite=10` | logado | Lista as partidas do usuário + estatísticas |
| POST | `partidas.php` | logado | Salva uma partida |
| DELETE | `partidas.php?id=N` | dono ou admin | Exclui uma partida |
| GET | `admin/usuarios.php` | admin | Lista usuários |
| PUT | `admin/usuarios.php?id=N` | admin | Altera o perfil de um usuário |
| DELETE | `admin/usuarios.php?id=N` | admin | Exclui um usuário (e suas partidas) |

## Matriz de permissões

| Ação | Visitante | Jogador | Admin |
|---|:-:|:-:|:-:|
| Cadastrar / entrar | ✅ | ✅ | ✅ |
| Ver e salvar as próprias partidas | ❌ | ✅ | ✅ |
| Excluir a própria partida | ❌ | ✅ | ✅ |
| Excluir partida de outro usuário | ❌ | ❌ | ✅ |
| Editar o próprio perfil | ❌ | ✅ | ✅ |
| Listar / promover / excluir usuários | ❌ | ❌ | ✅ |

## Endpoints

### POST `auth/register.php`
Corpo: `{"nome": "Caio", "email": "caio@teste.com", "senha": "Senha1234"}`
(nome 2–50 caracteres; e-mail válido até 120; senha 8–72 com letras e números)

Resposta `201`:
```json
{"sucesso": true, "dados": {"usuario": {"id": 1, "nome": "Caio", "email": "caio@teste.com", "papel": "jogador"}}}
```
Status: `201` criado · `403` CSRF inválido · `409` e-mail já cadastrado · `422` dados inválidos · `415` Content-Type incorreto.

### POST `auth/login.php`
Corpo: `{"email": "caio@teste.com", "senha": "Senha1234"}`

Resposta `200`:
```json
{"sucesso": true, "dados": {"usuario": {"id": 1, "nome": "Caio", "email": "caio@teste.com", "papel": "jogador"}, "csrf_token": "9f2c..."}}
```
Status: `200` · `401` e-mail ou senha inválidos · `403` CSRF · `422` campos inválidos · `429` mais de 5 falhas em 10 min.

### POST `auth/logout.php`
Sem corpo. Resposta `200`: `{"sucesso": true, "dados": {"mensagem": "Sessão encerrada."}}`. Status: `200` · `403` CSRF.

### GET `auth/me.php`
Resposta `200`: `{"sucesso": true, "dados": {"usuario": {...}, "csrf_token": "..."}}`. Status: `200` · `401`.

### PUT `perfil.php`
Corpo (um ou ambos): `{"nome": "Novo Nome"}` ou `{"senha_atual": "Senha1234", "nova_senha": "Outra5678"}`.
Status: `200` · `401` · `403` · `422`.

### GET `partidas.php?pagina=1&limite=10`
Resposta `200`:
```json
{"sucesso": true, "dados": {
  "itens": [{"id": 3, "resultado": "vitoria", "motivo": "lp", "vida_final": 3000, "vida_oponente": 0, "turnos": 7, "jogada_em": "2026-10-13 14:03:22"}],
  "pagina": 1, "limite": 10, "total_paginas": 1,
  "estatisticas": {"total": 3, "vitorias": 2, "derrotas": 1, "taxa_vitoria": 66.7, "media_vida_final": 1333}
}}
```
Status: `200` · `401`.

### POST `partidas.php`
Corpo:
```json
{"resultado": "vitoria", "motivo": "lp", "vida_final": 3000, "vida_oponente": 0, "turnos": 7}
```
`resultado`: `vitoria` | `derrota` · `motivo`: `lp` (padrão) | `combo_sagrado` · LP de 0 a 100000 · turnos de 1 a 500.
Regra: por `lp`, derrota exige `vida_final = 0`; vitória exige `vida_oponente = 0` e `vida_final > 0`.

Resposta `201`: `{"sucesso": true, "dados": {"partida": {"id": 3, "resultado": "vitoria", ...}}}`
Status: `201` · `401` · `403` CSRF · `422`.

### DELETE `partidas.php?id=3`
Status: `200` · `401` · `403` (partida de outro usuário) · `404`.

### GET `admin/usuarios.php`
Resposta `200`: `{"sucesso": true, "dados": {"usuarios": [{"id": 1, "nome": "...", "email": "...", "papel": "admin", "criado_em": "...", "total_partidas": 4}]}}`
Status: `200` · `401` · `403`.

### PUT `admin/usuarios.php?id=2`
Corpo: `{"papel": "admin"}`. Status: `200` · `401` · `403` · `404` · `409` (último admin) · `422`.

### DELETE `admin/usuarios.php?id=2`
Status: `200` · `401` · `403` · `404` · `409` (último admin).

## Códigos usados

`200` OK · `201` Criado · `400` JSON inválido · `401` não autenticado · `403` sem permissão ou CSRF inválido · `404` não encontrado · `405` método não permitido · `409` conflito · `413` corpo grande · `415` tipo de conteúdo · `422` validação · `429` muitas tentativas · `500` erro interno.
