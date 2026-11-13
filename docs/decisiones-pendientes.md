# Decisiones Pendientes y Registro de Convenciones — FECHITAT

Este documento registra todas las decisiones arquitectónicas tomadas por defecto (según la regla 5: valor más seguro y reversible), junto con los puntos abiertos para resolución explícita del usuario en los checkpoints.

---

## 1. Decisiones Tomadas por Defecto (Seguras y Reversibles)

| ID | Tema | Valor Adoptado por Defecto | Justificación Técnica | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | **Preservación de imagen en `club`** | Se añade `coverImage` (con hotspot) al schema `club`. | El frontend en `escuelas/[slug].astro` muestra la foto de instalaciones (`escuela.foto`) en la cabecera e imagen OpenGraph. Omitirlo degradaría la UI actual. | Activo |
| **DEC-002** | **Orden cronológico de Hitos 2011** | "Creación de FECHITAT" (`order: 1`, `date: '2011-06-01'`) y "Expansión a regiones" (`order: 2`, `date: null`). Consulta: `order(year asc, date asc, order asc)`. | Decidido por el usuario en Checkpoint 1. El Manual de Examen no fija mes ni día para la expansión regional ("al poco tiempo de creada la federación"). | **Aprobado** |
| **DEC-003** | **Unificación de término en Studio** | **"Directorio Oficial"** para la estructura de Studio (`organizationUnit` con `type: 'board'`). | Decidido por el usuario en Checkpoint 1. | **Aprobado** |
| **DEC-004** | **Normalización de ciudad "Sindempart, Coquimbo"** | `city: "Coquimbo"`, y "Sindempart" se conserva como sector/dirección si aplica. | Sindempart es un sector residencial de Coquimbo. Dejarlo como ciudad ensucia los filtros facetados de `/escuelas`. | Activo |
| **DEC-005** | **Escuelas sin región ni ciudad (`kings-tkd`, `pyujeon-kwan`)** | Se mantienen con `active: true` y campos de ubicación vacíos / "Sin región". | Ninguna escuela debe desaparecer del directorio por datos incompletos. Se reportan como advertencias. | Activo |
| **DEC-006** | **Tratamiento de `testimonio`** | Se mantiene el schema y grupo en Studio bajo "Patrimonio Institucional", sin documentos creados. | El código en `padres.astro` renderiza condicionalmente `testimonios.map()`. Si en el futuro se agregan documentos, la página los mostrará automáticamente. | Activo |
| **DEC-007** | **Borradores no publicados en producción** | Se ignoran los borradores (`drafts.*`) y se migra exclusivamente la versión publicada (`_id` sin prefijo `drafts.`). | Evita publicar accidentalmente cambios no aprobados (ej. `drafts.escuela-silla-la-serena` con "Sj.Osvaldo Rojas"). | Activo |
| **DEC-008** | **Títulos honoríficos (Manual de Examen FECHITAT p. 11)** | Dan 1–3: "Bs.", Dan 4–6: "Sb.", Dan 7–8: "Sj." / "Maestro", Dan 9: "Sasonim" / "Gran Maestro". Prefijos reconocidos: "Bs.", "Sb.", "Sj.", "Sasonim", "Maestro", "Gran Maestro", "Master", "Prof.". | Si no hay `dan` explícito, opera `legacyTitle`. No se asigna Dan inventado. Se reconoce "Sj." para deduplicación. | **Aprobado** |
| **DEC-009** | **Métricas de /jovenes y /padres** | Cifras de /jovenes pasan a `federation.metrics` (`showOn: ['jovenes']`, modo manual). En /padres no hay cifras de resultados (solo texto formativo y FAQs), por lo que no se tocan. | Decidido por el usuario en Checkpoint 1. | **Aprobado** |
| **DEC-010** | **Separación de campos de ubicación en Eventos** | `event` mantiene campos separados: `city` (ciudad), `venue` (lugar/recinto) y `address` (dirección física). | Decidido por el usuario en Checkpoint 1. No fusionar en un solo string. | **Aprobado** |
| **DEC-011** | **Preservación ortográfica de nombres fuente** | No corregir ortografía en silencio (ej. "Sb.Jose Reyes" se normaliza como `name: "Jose Reyes"` con `legacyTitle: "Sb."`). | Decidido por el usuario en Checkpoint 1. Toda divergencia se lista en reportes. | **Aprobado** |
| **DEC-012** | **Sin invención de fechas de cese (`endDate`)** | No inventar `endDate` para miembros inactivos si no existe el dato; reportarlos. | Decidido por el usuario en Checkpoint 1. | **Aprobado** |
| **DEC-013** | **Autores de blog institucionales** | "Comisión Técnica FECHITAT" y "Prensa FECHITAT" son entidades institucionales; no se crean registros en `person` para autores sin relevancia pública individual. `post.author` queda opcional (vacío muestra "FECHITAT"). | Decidido por el usuario en Checkpoint 1. | **Aprobado** |

---

## 2. Puntos Abiertos para Resolución por el Usuario (Checkpoint 1)

1. **Hitos de 2011:**
   - ¿Deseas mantener en la línea de tiempo de `/federacion` el orden visual histórico donde "Expansión a regiones" (diciembre 2011) aparece antes que "Creación de FECHITAT" (junio 2011), o prefieres que lo corrijamos al orden cronológico real?
2. **Etiqueta en Sanity Studio para el Directorio:**
   - ¿Apruebas el nombre **"Directorio Oficial"** (o prefieres "Directiva Nacional") para el item del organigrama superior en el Studio?
3. **Métricas en `/jovenes`:**
   - En `/jovenes` las cifras "2 Medallas mundiales" y "3.er Lugar mundial" están cableadas en el HTML. Proponemos vincularlas a `federation.metrics` (`showOn: ['jovenes']`, modo manual). ¿De acuerdo?
