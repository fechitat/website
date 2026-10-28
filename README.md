# FECHITAT web

Sitio institucional de la **Federación Chilena de Taekwon-Do Tradicional** (afiliada a ITF), construido con [Astro](https://astro.build).

Base portada de `fechitat-inspiration/` (prototipo HTML estático), que sigue siendo la fuente de verdad del diseño: sistema de tokens, tipografías, belt bar y riel de hangul.

## Estructura

```
src/
  layouts/
    BaseLayout.astro      # HTML común: header, belt bar, footer, fuentes y estilos
  components/
    Header.astro          # nav sticky + menú responsive (ruta activa automática)
    Footer.astro
    BeltBar.astro         # franja de colores del cinturón (no quitar)
    HangulRail.astro      # riel vertical con scroll-spy (recibe anclas por prop)
    Eyebrow.astro         # mini-etiqueta mono
    Tag.astro             # etiqueta de color (default/red/blue/gold)
    Stat.astro            # contador animado (data-count)
    PageHero.astro        # hero de páginas interiores
    EventBadge.astro      # badge circular de fecha de evento
  pages/
    index.astro           # /
    federacion.astro      # /federacion
    padres.astro          # /padres
    jovenes.astro         # /jovenes
    blog.astro            # redirección 301 a /recursos
    recursos/index.astro  # catálogo unificado; ver docs/architecture/catalogo-recursos.md en la raíz
    eventos.astro         # /eventos
  scripts/
    main.js               # interacciones globales (burger, scroll-spy, contadores)
  styles/
    global.css            # tokens + estilos portados del prototipo
  lib/
    imagenes.js           # URLs placeholder (TODO: reemplazar por CMS)
```

## Comandos

| Comando          | Acción                                    |
| :--------------- | :---------------------------------------- |
| `pnpm install`   | Instala dependencias del proyecto         |
| `pnpm dev`       | Servidor local en `localhost:4321`        |
| `pnpm build`     | Build de producción a `./dist/`           |
| `pnpm preview`   | Previsualiza el build localmente          |

## Notas de migración

- Contenido editable (posts, eventos, directivos, testimonios, estadísticas) aún
  es placeholder; está marcado con `TODO` apuntando a su futura fuente (CMS/Sanity).
- Las imágenes Unsplash en `src/lib/imagenes.js` son placeholder; reemplazar por
  fotos reales subidas al CMS.
- Los formularios (clase de prueba, newsletter) previenen el envío por ahora;
  conectar al servicio de leads elegido (Formspree o function serverless).
