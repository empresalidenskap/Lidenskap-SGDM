-- Cuentas de demostración
SET NAMES utf8mb4;
USE sgdm;

INSERT INTO usuario (id_rol, nombre, apellido, email, password) VALUES
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'ADMIN'),
     'Administrador', 'General', 'admin@lidenskap.com',
     '$2y$10$l4a2rk0pTxHpVe64iI.ZpuyJz6u7NEDflA5YwOv38fxacWrdOs7k6'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'ORGANIZADOR'),
     'Organizador', 'Torneo', 'organizador@lidenskap.com',
     '$2y$10$Z6fCNbE/EEhpj6QoWQHcI.P8s2w4RqGunxVKttsQDC5v6UH9Uygnu'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PARTICIPANTE'),
     'Diego', 'Silva', 'atleta@lidenskap.com',
     '$2y$10$GCQ.BGhc/t/b8P2Bhc1rtudw/yi7qoprChLw0y16Sl7oVU81YXN4u'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO'),
     'Usuario', 'Publico', 'publico@lidenskap.com',
     '$2y$10$DOQtrUmPcEk0GHCpryYB7.HXLeOXDJqffferhmCVULcz61fwRju.u');
