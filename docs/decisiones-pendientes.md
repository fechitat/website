# Decisiones Pendientes y Registro de Convenciones — FECHITAT

Este documento registra todas las decisiones arquitectónicas tomadas por defecto (según la regla 5: valor más seguro y reversible), junto con los puntos abiertos para resolución explícita del usuario en los checkpoints.

---

## 1. Decisiones Tomadas por Defecto (Seguras y Reversibles)

| ID | Tema | Valor Adoptado por Defecto | Justificación Técnica | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | **Preservación de imagen en `club`** | Se añade `coverImage` (con hotspot) al schema `club`. | El frontend en `escuelas/[slug].astro` muestra la foto de instalaciones (`escuela.foto`) en la cabecera e imagen OpenGraph. Omitirlo degradaría la UI actual. | Activo |
| **DEC-002** | **Orden visible de Hitos 2011** | En la migración inicial, "Expansión a regiones" recibe `order: 1` y "Creación de FECHITAT" recibe `order: 2`. | Criterio de estricta no-regresión visual con respecto al oráculo de producción, hasta que el usuario apruebe reordenar cronológicamente (junio antes de diciembre). | Pendiente de aprobación |
| **DEC-003** | **Unificación de término "Directorio" en Studio** | Se propone y utiliza **"Directorio Oficial"** para la estructura de Studio (`organizationUnit` con `type: 'board'`). | La web actual mezcla "Directiva" y "Directorio". La denominación estatutaria formal en Chile para federaciones deportivas es "Directorio". | Propuesto |
| **DEC-004** | **Normalización de ciudad "Sindempart, Coquimbo"** | `city: "Coquimbo"`, y "Sindempart" se conserva como sector/dirección si aplica. | Sindempart es un sector residencial de Coquimbo. Dejarlo como ciudad ensucia los filtros facetados de `/escuelas`. | Activo |
| **DEC-005** | **Escuelas sin región ni ciudad (`kings-tkd`, `pyujeon-kwan`)** | Se mantienen con `active: true` y campos de ubicación vacíos / "Sin región". | Ninguna escuela debe desaparecer del directorio por datos incompletos. Se reportan como advertencias. | Activo |
| **DEC-006** | **Tratamiento de `testimonio`** | Se mantiene el schema y grupo en Studio bajo "Patrimonio Institucional", sin documentos creados. | El código en `padres.astro` renderiza condicionalmente `testimonios.map()`. Si en el futuro se agregan documentos, la página los mostrará automáticamente. | Activo |
| **DEC-007** | **Borradores no publicados en producción** | Se ignoran los borradores (`drafts.*`) y se migra exclusivamente la versión publicada (`_id` sin prefijo `drafts.`). | Evita publicar accidentalmente cambios no aprobados (ej. `drafts.escuela-silla-la-serena` con "Sj.Osvaldo Rojas"). | Activo |
| **DEC-008** | **Títulos honoríficos y Dan** | Si no hay `dan` explícito, opera `legacyTitle`. No se asigna Dan inventado a ninguna persona. | Conserva exactamente "Sb." y "Bs." donde hoy se muestran y garantiza que nadie reciba "Maestro" sin Dan ≥ 7. | Activo |

---

## 2. Puntos Abiertos para Resolución por el Usuario (Checkpoint 1)

1. **Hitos de 2011:**
   - ¿Deseas mantener en la línea de tiempo de `/federacion` el orden visual histórico donde "Expansión a regiones" (diciembre 2011) aparece antes que "Creación de FECHITAT" (junio 2011), o prefieres que lo corrijamos al orden cronológico real?
2. **Etiqueta en Sanity Studio para el Directorio:**
   - ¿Apruebas el nombre **"Directorio Oficial"** (o prefieres "Directiva Nacional") para el item del organigrama superior en el Studio?
3. **Métricas en `/jovenes`:**
   - En `/jovenes` las cifras "2 Medallas mundiales" y "3.er Lugar mundial" están cableadas en el HTML. Proponemos vincularlas a `federation.metrics` (`showOn: ['jovenes']`, modo manual). ¿De acuerdo?
