/**
 * Lógica de títulos honoríficos y normalización de nombres para FECHITAT.
 *
 * Fuente de umbrales marciales:
 * Manual de Examen FECHITAT, p. 11:
 * - Dan 1 a 3: Bs. (Boo-Sabum / Asistente de Instructor)
 * - Dan 4 a 6: Sb. (Sabum / Instructor)
 * - Dan 7 a 8: Maestro / Sj. (Sahyun / Maestro)
 * - Dan 9: Gran Maestro / Sasonim (Sasung / Gran Maestro)
 *
 * NOTA: VERIFICAR con FECHITAT si se requiere mostrar el título coreano (Sj., Sasonim)
 * o su equivalente en español (Maestro, Gran Maestro). Por defecto se utiliza el
 * término de mayor reconocimiento institucional ("Maestro", "Gran Maestro") para Dan >= 7.
 */

export interface PersonHonorificInput {
  name: string;
  dan?: number | null;
  legacyTitle?: string | null;
}

/** Umbrales marciales oficiales FECHITAT — VERIFICAR con FECHITAT */
export const DAN_THRESHOLDS = {
  MIN_BOO_SABUM: 1,
  MAX_BOO_SABUM: 3,
  MIN_SABUM: 4,
  MAX_SABUM: 6,
  MIN_MAESTRO: 7,
  MAX_MAESTRO: 8,
  GRAN_MAESTRO: 9,
} as const;

/** Lista de prefijos marciales y de cortesía reconocidos para extracción y desduplicación */
export const RECOGNIZED_PREFIXES = [
  'Gran Maestro',
  'Gran maestro',
  'Maestro',
  'Master',
  'Sasonim',
  'Prof.',
  'Prof',
  'Sj.',
  'Sj',
  'Sb.',
  'Sb',
  'Bs.',
  'Bs',
] as const;

/**
 * Calcula el título honorífico oficial según el grado Dan y títulos legados.
 * Regla inquebrantable: NUNCA se muestra "Maestro" a alguien sin Dan >= 7.
 */
export function getHonorific(person: PersonHonorificInput): string {
  const dan = person.dan;

  if (typeof dan === 'number' && Number.isInteger(dan) && dan >= 1) {
    if (dan >= DAN_THRESHOLDS.GRAN_MAESTRO) {
      return 'Gran Maestro';
    }
    if (dan >= DAN_THRESHOLDS.MIN_MAESTRO && dan <= DAN_THRESHOLDS.MAX_MAESTRO) {
      return 'Maestro';
    }
    if (dan >= DAN_THRESHOLDS.MIN_SABUM && dan <= DAN_THRESHOLDS.MAX_SABUM) {
      return 'Sb.';
    }
    if (dan >= DAN_THRESHOLDS.MIN_BOO_SABUM && dan <= DAN_THRESHOLDS.MAX_BOO_SABUM) {
      return 'Bs.';
    }
  }

  // Si no tiene Dan registrado, utiliza el título legado si existe y no infringe la regla de Maestro
  if (person.legacyTitle && person.legacyTitle.trim()) {
    const trimmed = person.legacyTitle.trim();
    // Protección estricta: prohibido mostrar "Maestro" o "Gran Maestro" sin Dan verificado >= 7
    const lower = trimmed.toLowerCase();
    if (lower.includes('maestro') || lower.includes('master') || lower.includes('sasonim')) {
      return '';
    }
    return trimmed;
  }

  return '';
}

/**
 * Genera el nombre formateado para presentación pública (ej. "Sb. Juan Bravo" u "Osvaldo Rojas").
 */
export function formatPersonFullName(person: PersonHonorificInput): string {
  const honorific = getHonorific(person);
  const cleanName = person.name.trim();
  if (!honorific) {
    return cleanName;
  }
  // Si el honorífico termina en punto (ej. "Sb.", "Bs.") se separa con espacio
  return `${honorific} ${cleanName}`.replace(/\s+/g, ' ').trim();
}

/**
 * Extrae y separa el prefijo de título marcial del nombre de una persona.
 * Usado para normalizar strings antiguos ("Sb.Juan Bravo" -> { name: "Juan Bravo", legacyTitle: "Sb." })
 */
export function extractHonorificAndName(rawName: string = ''): {
  name: string;
  legacyTitle: string | null;
} {
  let cleaned = rawName.trim();
  let foundPrefix: string | null = null;

  for (const prefix of RECOGNIZED_PREFIXES) {
    // Coincidencia insensible a mayúsculas al inicio de la cadena
    const regex = new RegExp(`^${prefix.replace('.', '\\.')}\\s*`, 'i');
    if (regex.test(cleaned)) {
      foundPrefix = prefix.endsWith('.') ? prefix : `${prefix}.`;
      cleaned = cleaned.replace(regex, '').trim();
      break;
    }
  }

  // Colapsar espacios internos
  cleaned = cleaned.replace(/\s+/g, ' ');

  return {
    name: cleaned,
    legacyTitle: foundPrefix,
  };
}
