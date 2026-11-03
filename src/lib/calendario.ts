/**
 * Utilidades para generar enlaces de calendario (Google Calendar).
 */

const PAD = (n: number) => String(n).padStart(2, '0');

/**
 * Convierte una fecha ISO (datetime de Sanity) al formato que entiende
 * Google Calendar (YYYYMMDDTHHMMSSZ, siempre en UTC).
 *
 * @param iso - Fecha ISO 8601 (zulú o con offset).
 * @returns Cadena en formato YYYYMMDDTHHMMSSZ.
 */
export function aFormatoGoogleCalendar(iso: string): string {
  const fecha = new Date(iso);
  return (
    `${fecha.getUTCFullYear()}${PAD(fecha.getUTCMonth() + 1)}${PAD(fecha.getUTCDate())}` +
    `T${PAD(fecha.getUTCHours())}${PAD(fecha.getUTCMinutes())}${PAD(fecha.getUTCSeconds())}Z`
  );
}

/** Duración por defecto (en horas) cuando el evento no declara fecha de fin. */
const DURACION_DEFECTO_HORAS = 2;

/**
 * Construye la URL de "Agregar a Google Calendar" para un evento.
 *
 * @param evento - Evento con título, fecha (ISO), fecha de fin opcional, lugar y descripción.
 * @returns URL completa de Google Calendar con los parámetros codificados.
 */
export function urlGoogleCalendar(evento: {
  titulo: string;
  fecha: string;
  fechaFin?: string;
  direccion?: string;
  ciudad?: string;
  lugar?: string;
  descripcion?: string;
}): string {
  const inicio = aFormatoGoogleCalendar(evento.fecha);
  const fin = evento.fechaFin
    ? aFormatoGoogleCalendar(evento.fechaFin)
    : aFormatoGoogleCalendar(new Date(new Date(evento.fecha).getTime() + DURACION_DEFECTO_HORAS * 3_600_000).toISOString());

  const ubicacion = [evento.direccion, evento.ciudad, evento.lugar]
    .filter(Boolean)
    .join(', ');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.titulo,
    dates: `${inicio}/${fin}`,
    ctz: 'America/Santiago',
  });

  if (ubicacion) params.set('location', ubicacion);
  if (evento.descripcion) params.set('details', evento.descripcion);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera un Data URI de archivo iCalendar (.ics) para Apple Calendar, Outlook o dispositivos móviles.
 */
export function dataUrlIcs(evento: {
  titulo: string;
  fecha: string;
  fechaFin?: string;
  direccion?: string;
  ciudad?: string;
  lugar?: string;
  descripcion?: string;
}): string {
  const inicio = aFormatoGoogleCalendar(evento.fecha);
  const fin = evento.fechaFin
    ? aFormatoGoogleCalendar(evento.fechaFin)
    : aFormatoGoogleCalendar(new Date(new Date(evento.fecha).getTime() + DURACION_DEFECTO_HORAS * 3_600_000).toISOString());
  const ubicacion = [evento.direccion, evento.ciudad, evento.lugar].filter(Boolean).join(', ');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FECHITAT//Eventos//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${evento.titulo}`,
    `DESCRIPTION:${evento.descripcion || 'Evento oficial FECHITAT'}`,
    `LOCATION:${ubicacion || 'Chile'}`,
    `DTSTART:${inicio}`,
    `DTEND:${fin}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}