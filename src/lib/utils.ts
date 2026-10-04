/**
 * Funciones de utilidad transversales para la web de FECHITAT.
 */

/**
 * Normaliza un texto para comparaciones y búsquedas insensibles a mayúsculas y acentos:
 * Convierte a minúsculas en español (es-CL), descompone y remueve diacríticos y limpia espacios.
 */
export function normalizarTexto(texto: string = ''): string {
  return texto
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
