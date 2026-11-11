-- Kind Game - script de criacao do banco (MySQL/MariaDB do XAMPP)
-- Importar no phpMyAdmin (aba "Importar") ou rodar: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS kind_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kind_game;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(50)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  senha_hash    VARCHAR(255) NOT NULL,
  papel         ENUM('jogador','admin') NOT NULL DEFAULT 'jogador',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS partidas (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id     INT UNSIGNED NOT NULL,
  resultado      ENUM('vitoria','derrota') NOT NULL,
  motivo         ENUM('lp','combo_sagrado') NOT NULL DEFAULT 'lp',
  vida_final     INT UNSIGNED NOT NULL,
  vida_oponente  INT UNSIGNED NOT NULL,
  turnos         SMALLINT UNSIGNED NOT NULL,
  jogada_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_partidas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  INDEX idx_partidas_usuario_data (usuario_id, jogada_em)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tentativas_login (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email      VARCHAR(120) NOT NULL,
  ip         VARCHAR(45)  NOT NULL,
  criado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tentativas (email, ip, criado_em)
) ENGINE=InnoDB;

-- Usuario de banco com privilegios minimos (troque a senha!):
-- CREATE USER 'kind_user'@'localhost' IDENTIFIED BY 'troque_esta_senha';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON kind_game.* TO 'kind_user'@'localhost';
-- FLUSH PRIVILEGES;
