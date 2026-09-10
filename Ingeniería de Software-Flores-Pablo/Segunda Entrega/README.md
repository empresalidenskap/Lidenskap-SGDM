# Ingeniería de Software: Segunda entrega

Docente: Pablo Flores

Requisitos de la letra de proyecto para esta entrega:

- [x] Actualización del ESRE con requisitos específicos (funcionales y no funcionales)
- [x] Diagramas UML de Casos de Uso (planilla y diagramación)
- [x] Diagramas de clase 
- [x] Estudio de factibilidad
- [x] Plan de contingencias
- [ ] Diagrama de Gantt (hasta la segunda entrega)
      
## link del draw.io de drive para editar
https://drive.google.com/file/d/1ZgYbPPQchzdYM_kwcEUKYEmYvBtgKPsF/view?usp=drive_link

## Correcciones pendientes de la primera entrega

- [x] Rol **Árbitro** implementado en el código (`ARBITRO` en
      [`db/01-schema.sql`](../../SGDM%20App/db/01-schema.sql),
      [`RoleLabels.php`](../../SGDM%20App/app/src/RoleLabels.php) y
      [`main.js`](../../SGDM%20App/app/assets/js/main.js): solo lee y
      actualiza resultados, sin crear/eliminar, asignable desde el panel por
      Administrador u Organizador — RF-11).
  - [x] Falta trasladar el rol **ROL-05 Árbitro** a la tabla del Bloque B
        (Roles y Perfiles de Usuario) del documento "Ingeniería de software
        Segunda entrega" en Drive — no se puede editar el Google Doc desde
        acá, texto listo para pegar (ver mensaje de la sesión que hizo el
        cambio de código).
- [ ] Detallar explícitamente los RNF de seguridad técnica: sanitización de
      datos, hashing de contraseñas con bcrypt y protección contra OWASP
      Top 10 (texto también preparado para pegar en el mismo documento).
