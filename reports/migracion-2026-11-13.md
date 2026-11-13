# Reporte de Migración Sanity FECHITAT — 2026-11-13

**Dataset destino:** `production`  
**Modo de ejecución:** `SIMULACIÓN (--dry-run)`  
**Fecha:** 2026-11-13T01:42:31.122Z  

---

## 1. Conteo de Documentos

| Tipo de Contenido | Documentos Origen | Documentos Destino | Estado |
| :--- | :---: | :---: | :--- |
| **Personas (`person`)** | 7 (organigrama) + 4 (escuelas) | **8** | Deduplicado exacto por nombre normalizado |
| **Unidades (`organizationUnit`)** | 2 (comisiones) + 1 (directorio) | **3** | Directorio Oficial, Disciplina, DPC |
| **Clubes / Escuelas (`club`)** | 14 | **14** | Slugs conservados, presidentes vinculados |
| **Documentos (`officialDocument`)** | 1 | **1** | Protocolo de disciplina (status: current) |
| **Eventos (`event`)** | 4 | **4** | Campos ciudad/lugar/dirección separados |
| **Noticias (`post`)** | 2 | **2** | Autores institucionales FECHITAT |
| **Hitos (`historicalMilestone`)** | 5 | **5** | Orden cronológico oficial (Creación 1, Expansión 2) |
| **Federación (`federation`)** | 2 (métricas sueltas) | **1** | Singleton con 4 métricas (home y jovenes) |
| **Total de Documentos** | **37** | **38** | **Idempotente y determinista** |

---

## 2. Casos de Deduplicación de Personas Resueltos

Las siguientes personas fueron identificadas en múltiples orígenes y unificadas en un único documento `person`:

| Persona | ID Determinista | Orígenes Detectados y Fusionados |
| :--- | :--- | :--- |
| **Osvaldo Rojas** | `person.osvaldo-rojas` | Directorio Oficial (Presidente) + Comisión Disciplina + Club Sil-la La Serena |
| **Juan Bravo** | `person.juan-bravo` | Directorio Oficial (Vicepresidente) + Club Quauhtli |
| **Antonia Astorga** | `person.antonia-astorga` | Directorio Oficial (Secretaria) + Club Sil-la Santiago |

---

## 3. Tabla de Normalizaciones Aplicadas

### 3.1 Nombres y Títulos de Personas
| String Origen | Nombre Limpio (`name`) | Grado Dan (`dan`) | Título Legado (`legacyTitle`) | ID Resultante |
| :--- | :--- | :---: | :--- | :--- |
| `Sb.Antonia Astorga` | `Antonia Astorga` | — | `Sb.` | `person.antonia-astorga` |
| `Sb.Jose Reyes` | `Jose Reyes` | — | `Sb.` | `person.jose-reyes` |
| `Sb.Juan Bravo` | `Juan Bravo` | — | `Sb.` | `person.juan-bravo` |
| `Sb.Jonathan Palma` | `Jonathan Palma` | 4 | — | `person.jonathan-palma` |
| `Javier Muñoz` | `Javier Muñoz` | 3 | — | `person.javier-munoz` |
| `Osvaldo Rojas` | `Osvaldo Rojas` | — | — | `person.osvaldo-rojas` |
| `Bs.Alfredo Puyol` | `Alfredo Puyol` | — | `Bs.` | `person.alfredo-puyol` |
| `Bs.Felipe Plaza` | `Felipe Plaza` | — | `Bs.` | `person.felipe-plaza` |

### 3.2 Escuelas y Contacto
| Club | Campo | Valor Origen | Valor Normalizado |
| :--- | :--- | :--- | :--- |
| **Club Deportivo Quauhtli** | `city` | `Sindempart, Coquimbo` | `Coquimbo` |
| **Academia Sipjin Coquimbo** | `whatsapp` | `+56 9 9270 1908` | `56992701908` |
| **So San-Do** | `whatsapp` | `+56 9 7456 4339` | `56974564339` |

### 3.3 Hitos de 2011 (Línea de Tiempo)
| Hito Histórico | Año | Fecha (`date`) | Orden (`order`) | Criterio |
| :--- | :---: | :---: | :---: | :--- |
| **Expansión a regiones** | 2011 | *(Sin fecha)* | 2 | Orden cronológico 2 (Sin fecha falsa) |
| **Creación de FECHITAT** | 2011 | `2011-06-01` | 1 | Orden cronológico 1 (Fundación) |

---

## 4. Datos Faltantes y Advertencias

1. **Escuelas sin Presidente/Instructor asignado (10):**
   - Espiritu de Honor
   - Club Deportivo Espíritu Indomable
   - Jung Do Kwan Ovalle
   - Escuela Kings TKD
   - Club Deportivo Pyujeon Kwan
   - Escuela Pyujeon Kwan Iquique
   - Quauhtli Guanaqueros
   - Sil-la Coquimbo
   - So San-Do
   - Universidad del Alba

2. **Escuelas con ubicación o logo pendiente (4):**
   - Jung Do Kwan Ovalle
   - Escuela Kings TKD
   - Club Deportivo Pyujeon Kwan
   - Escuela Pyujeon Kwan Iquique

3. **Retratos de baja resolución (< 400×500 px, activos a 100×100 px):**
   - Antonia Astorga (image-18e9f68bbdd11d327bd99bf4986fe148ff6ae927-100x100-png)
   - Jose Reyes (image-5dfb78a9d81de4cdf923988756218a279a7982c8-100x100-png)
   - Juan Bravo (image-38325b7851716c87730d3101017e0612de62d471-100x100-png)
   - Jonathan Palma (image-340fd20e04c98ef63c528f5a973c3b7ceac0283e-100x100-png)
   - Javier Muñoz (image-50a0c8029f2eb1318544f72318c70a76186dc559-100x100-png)
   - Alfredo Puyol (image-6417c53b60fd4021df531ba9125ec6db60916ce2-100x100-png)

4. **Personas sin grado Dan confirmado en base de datos:**
   - Antonia Astorga
   - Jose Reyes
   - Juan Bravo
   - Osvaldo Rojas
   - Alfredo Puyol
   - Felipe Plaza

---

## 5. Borradores Detectados (Aislados sin publicar)
Se omitieron deliberadamente de la migración los siguientes **3** borradores del CMS:
- `drafts.98d4994b-dc04-4819-82f7-40a61bc7d756`
- `drafts.PvZDPMYPRMMM1Fg3hgYISa`
- `drafts.escuela-silla-la-serena`
