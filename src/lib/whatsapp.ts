/**
 * Utilidad única para validación y generación de enlaces de WhatsApp en FECHITAT.
 * Corrige errores comunes de espacios, símbolos '+' y formatos internacionales.
 */

/**
 * Limpia y normaliza un número de teléfono a dígitos con código de país (CL: 56).
 * @param phone Teléfono en cualquier formato ("+56 9 9270 1908", "56974203512", "992701908")
 * @returns Cadena de sólo dígitos con código de país (ej. "56992701908") o null si es inválido.
 */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Extraer únicamente dígitos numéricos
  let digits = phone.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  // Si tiene 9 dígitos y empieza con 9 (móvil chileno sin código de país: 9XXXXXXXX)
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = `56${digits}`;
  }

  // Un móvil chileno con código de país tiene 11 dígitos (569XXXXXXXX)
  // Se admiten otros números internacionales válidos entre 10 y 15 dígitos
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Genera una URL válida de https://wa.me/<dígitos>?text=...
 * @param phone Teléfono a normalizar
 * @param message Mensaje predefinido opcional (será codificado con encodeURIComponent)
 * @returns URL de WhatsApp o null si el teléfono es inválido
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string | null
): string | null {
  const digits = normalizeWhatsAppNumber(phone);
  if (!digits) {
    return null;
  }

  if (message && message.trim()) {
    const encoded = encodeURIComponent(message.trim());
    return `https://wa.me/${digits}?text=${encoded}`;
  }

  return `https://wa.me/${digits}`;
}
