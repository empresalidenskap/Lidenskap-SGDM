# Ciberseguridad: Tercera entrega

Docente: Vladimir Padula

Requisitos de la letra de proyecto para esta entrega:

- [x] Aspectos de hashing, cifrado y firma digital implementados en el proyecto (documento de especificación de implementaciones)
  (documentado en [CRIPTOGRAFIA.md](./CRIPTOGRAFIA.md))
  - Hashing: bcrypt en la app, SHA-512 en `/etc/shadow`, SHA-256 de cada respaldo.
  - Cifrado: HTTPS (TLS), SSH y respaldos con AES-256 (`respaldo_sgdm.sh`).
  - Firma digital: certificado firmado por la CA de Lidenskap y cada respaldo
    firmado con RSA 4096 (`respaldo_sgdm.sh verificar`).
  - [ ] Falta en el servidor real: copiar `respaldo_sgdm.sh`,
    `gestion_servidor_sgdm.sh` y `consultas_monitoreo_bd_sgdm.sh` nuevos, hacer un respaldo, guardar
    `/etc/sgdm/respaldos/cifrado.clave` fuera del servidor y borrar los
    respaldos viejos sin cifrar (también de Google Drive).
- [x] Implementación de certificado SSL dentro del servidor
  (`ssl_sgdm.sh`, documentado en [SSL.md](./SSL.md))
  - CA propia "Lidenskap CA SGDM" que firma el certificado del servidor;
    importándola en cada PC, el navegador confía sin avisos.
  - HTTPS en Apache (`mod_ssl`) y redirección de `http` a `https`.
  - [ ] Falta correrlo en el servidor real (`sudo ssl_sgdm.sh instalar`) e
    importar la CA en las PCs de la defensa.
- [x] Políticas de seguridad de usuario
- [x] Informe OWASP de aspectos de seguridad del sitio

## Corrección de la segunda entrega de Ciberseguridad

Pendientes arrastrados de la segunda entrega:

- [ ] Esquema de red con implementaciones de seguridad
- [ ] Correcciones indicadas por el docente sobre la segunda entrega (completar al recibir la devolución)
