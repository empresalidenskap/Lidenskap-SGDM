# Ingeniería de Software: Tercera entrega

Docente: Pablo Flores

Requisitos de la letra de proyecto para esta entrega:

- [ ] Documento de calidad de software en entornos web (familia ISO 25000)
- [ ] Plan de testing con implementación de pruebas de testing manual y unitario (PHPUnit, Cypress, etc.)
- [ ] Encuesta de percepción de calidad
- [ ] Plan de seguridad web basado en OWASP
- [ ] Cálculo de métricas de proyecto (punto de función)
- [ ] Diagrama de Gantt (cronograma de la gestión del proyecto completo)
- [ ] Manual de usuario operacionales
- [ ] Manual de administrador

## Corrección de la segunda entrega de Ingeniería de Software

Pendientes arrastrados de la segunda entrega:

- [ ] Diagrama de Gantt (hasta la segunda entrega)
- [ ] Detallar los RNF de seguridad técnica (sanitización, hashing con bcrypt, OWASP Top 10) en el documento de Drive
- [ ] Correcciones indicadas por el docente sobre la segunda entrega (completar al recibir la devolución)

## Cambios del sistema para reflejar en el ESRE y los diagramas (Drive)

La aplicación cambió en la tercera entrega y el ESRE (Google Docs, no se
edita desde el repositorio) tiene que acompañarla:

- [ ] **Roles por torneo**: globales solo Administrador y Usuario público;
  Organizador, Árbitro y Participante dependen de cada torneo y terminan
  solos cuando el torneo finaliza (misma cuenta, el historial queda).
  Actualizar la matriz de roles (RF-14, RF-19).
- [ ] **Solicitudes e invitaciones**: el Usuario público pide crear un torneo
  (aprueba el Administrador), participar, arbitrar o unirse a un equipo
  (aprueba el Organizador de ese torneo); el Organizador invita a una cuenta
  y la persona acepta o rechaza; el Administrador asigna directo. Extiende
  RF-15.
- [ ] **Equipos**: los crea un Usuario público (el capitán es solo una
  etiqueta) o el Organizador; límite de integrantes por torneo; un equipo
  juega un solo torneo activo a la vez.
- [ ] **Fases del torneo** (RF-08): planificado → inscripciones abiertas →
  inscripciones cerradas (se rechaza lo pendiente y se sortea el orden) →
  en curso (al generar el fixture) → finalizado.
- [ ] **Resultados** (RF-11): los carga el árbitro asignado al partido o el
  Organizador; solo el Organizador los valida y recién ahí son oficiales.
- [ ] **Formatos** (RF-10, RF-17): eliminación directa al mejor de 1 (un
  partido, sin empate); el sistema suizo pasa a ser la etapa suiza de los
  esports: series al mejor de 3, cruce entre los del mismo récord sin repetir
  rivales, se clasifica con N victorias y queda eliminado con N derrotas (2
  hasta 8 inscriptos, 3 hasta 16, 4 hasta 32).
- [ ] Actualizar los casos de uso y el diagrama UML con estos flujos
  ([`diagramaUML.drawio`](../Segunda%20Entrega/diagramaUML.drawio)).
