export type GrupoPatron = 'gup' | 'dan';
export type RetrasoInicio = 0 | 3 | 10;

export interface Patron {
  id: string;
  nombre: string;
  nombreReglamento: string;
  movimientos: number | null;
  limiteSegundos: number;
  grado: string;
  grupo: GrupoPatron;
}

/** Opciones de espera antes de que corra el límite oficial. */
export const RETRASOS_INICIO = [0, 3, 10] as const satisfies readonly RetrasoInicio[];

/**
 * Límites del art. 8.6.2.1, ITF Tournament Rules, versión 22.03.2026.
 * El tiempo abarca desde el primer movimiento hasta anunciar el nombre de la forma.
 */
export const PATRONES: readonly Patron[] = [
  { id: 'chon-ji', nombre: 'Chon-Ji', nombreReglamento: 'CHON-JI', movimientos: 19, limiteSegundos: 30, grado: '9º Gup', grupo: 'gup' },
  { id: 'dan-gun', nombre: 'Dan-Gun', nombreReglamento: 'DAN-GUN', movimientos: 21, limiteSegundos: 34, grado: '8º Gup', grupo: 'gup' },
  { id: 'do-san', nombre: 'Do-San', nombreReglamento: 'DO-SAN', movimientos: 24, limiteSegundos: 41, grado: '7º Gup', grupo: 'gup' },
  { id: 'won-hyo', nombre: 'Won-Hyo', nombreReglamento: 'WON-HYO', movimientos: 28, limiteSegundos: 47, grado: '6º Gup', grupo: 'gup' },
  { id: 'yul-gok', nombre: 'Yul-Gok', nombreReglamento: 'YUL-GOK', movimientos: 38, limiteSegundos: 52, grado: '5º Gup', grupo: 'gup' },
  { id: 'joong-gun', nombre: 'Joong-Gun', nombreReglamento: 'JOONG-GUN', movimientos: 32, limiteSegundos: 55, grado: '4º Gup', grupo: 'gup' },
  { id: 'toi-gye', nombre: 'Toi-Gye', nombreReglamento: 'TOI-GE', movimientos: 37, limiteSegundos: 66, grado: '3º Gup', grupo: 'gup' },
  { id: 'hwa-rang', nombre: 'Hwa-Rang', nombreReglamento: 'HWA-RANG', movimientos: 29, limiteSegundos: 49, grado: '2º Gup', grupo: 'gup' },
  { id: 'choong-moo', nombre: 'Choong-Moo', nombreReglamento: 'CHOONG-MOO', movimientos: 30, limiteSegundos: 52, grado: '1º Gup', grupo: 'gup' },
  { id: 'kwang-gae', nombre: 'Kwang-Gae', nombreReglamento: 'KWANG-GAE', movimientos: 39, limiteSegundos: 74, grado: '1º Dan', grupo: 'dan' },
  { id: 'po-eun', nombre: 'Po-Eun', nombreReglamento: 'PO-EUN', movimientos: 36, limiteSegundos: 44, grado: '1º Dan', grupo: 'dan' },
  { id: 'ge-baek', nombre: 'Ge-Baek', nombreReglamento: 'GE-BAEK', movimientos: 44, limiteSegundos: 63, grado: '1º Dan', grupo: 'dan' },
  { id: 'eui-am', nombre: 'Eui-Am', nombreReglamento: 'EUI-AM', movimientos: 45, limiteSegundos: 74, grado: '2º Dan', grupo: 'dan' },
  { id: 'choong-jang', nombre: 'Choong-Jang', nombreReglamento: 'CHOONG-JANG', movimientos: 52, limiteSegundos: 87, grado: '2º Dan', grupo: 'dan' },
  { id: 'juche', nombre: 'Juche', nombreReglamento: 'JUCHE', movimientos: 45, limiteSegundos: 100, grado: '2º Dan', grupo: 'dan' },
  { id: 'sam-il', nombre: 'Sam-Il', nombreReglamento: 'SAM-IL', movimientos: 33, limiteSegundos: 62, grado: '3º Dan', grupo: 'dan' },
  { id: 'yoo-sin', nombre: 'Yoo-Sin', nombreReglamento: 'YU-SIN', movimientos: 68, limiteSegundos: 104, grado: '3º Dan', grupo: 'dan' },
  { id: 'choi-yong', nombre: 'Choi-Yong', nombreReglamento: 'CHOI-YONG', movimientos: 46, limiteSegundos: 75, grado: '3º Dan', grupo: 'dan' },
  { id: 'yon-gae', nombre: 'Yon-Gae', nombreReglamento: 'YON-GAE', movimientos: 49, limiteSegundos: 87, grado: '4º Dan', grupo: 'dan' },
  { id: 'ul-ji', nombre: 'Ul-Ji', nombreReglamento: 'UL-JI', movimientos: 42, limiteSegundos: 66, grado: '4º Dan', grupo: 'dan' },
  { id: 'moon-moo', nombre: 'Moon-Moo', nombreReglamento: 'MOON-MOO', movimientos: 61, limiteSegundos: 101, grado: '4º Dan', grupo: 'dan' },
  { id: 'so-san', nombre: 'So-San', nombreReglamento: 'SO-SAN', movimientos: 72, limiteSegundos: 110, grado: '5º Dan', grupo: 'dan' },
  { id: 'se-jong', nombre: 'Se-Jong', nombreReglamento: 'SE-JONG', movimientos: 24, limiteSegundos: 51, grado: '5º Dan', grupo: 'dan' },
  { id: 'chang-hon', nombre: 'Chang-Hon', nombreReglamento: 'CHANG-HON', movimientos: null, limiteSegundos: 94, grado: 'Reglamento 2026', grupo: 'dan' },
];

const LIMITES_REGLAMENTO: Record<string, number> = {
  'CHON-JI': 30, 'DAN-GUN': 34, 'DO-SAN': 41, 'WON-HYO': 47, 'YUL-GOK': 52, 'JOONG-GUN': 55,
  'TOI-GE': 66, 'HWA-RANG': 49, 'CHOONG-MOO': 52, 'KWANG-GAE': 74, 'PO-EUN': 44, 'GE-BAEK': 63,
  'EUI-AM': 74, 'CHOONG-JANG': 87, 'JUCHE': 100, 'SAM-IL': 62, 'YU-SIN': 104, 'CHOI-YONG': 75,
  'YON-GAE': 87, 'UL-JI': 66, 'MOON-MOO': 101, 'SO-SAN': 110, 'SE-JONG': 51, 'CHANG-HON': 94,
};

/**
 * Busca una forma publicada por su identificador.
 * @param id Identificador estable, por ejemplo `chon-ji`.
 * @returns La forma o `undefined` si no existe.
 */
export function obtenerPatron(id: string): Patron | undefined {
  return PATRONES.find((patron) => patron.id === id);
}

/**
 * Comprueba que cada límite del catálogo coincida con la tabla del reglamento.
 * @returns Nada.
 * @throws Error Si falta una forma o el límite no coincide.
 */
export function verificarLimitesReglamento(): void {
  const nombres = PATRONES.map((patron) => patron.nombreReglamento);
  if (nombres.length !== Object.keys(LIMITES_REGLAMENTO).length || new Set(nombres).size !== nombres.length) {
    throw new Error('El catálogo de formas no coincide con la tabla del reglamento 2026.');
  }
  for (const patron of PATRONES) {
    if (LIMITES_REGLAMENTO[patron.nombreReglamento] !== patron.limiteSegundos) {
      throw new Error(`El límite de ${patron.nombreReglamento} no coincide con el reglamento 2026.`);
    }
  }
}

/**
 * Cadencia para repartir el límite oficial entre los movimientos.
 * @param patron Forma con cantidad de movimientos conocida.
 * @returns Movimientos por segundo, o `null` si el reglamento no publica los movimientos.
 * @throws RangeError Si los movimientos o el límite no son positivos.
 */
export function cadenciaOficial(patron: Patron): number | null {
  if (patron.movimientos == null) return null;
  if (!Number.isInteger(patron.movimientos) || patron.movimientos <= 0 || patron.limiteSegundos <= 0) {
    throw new RangeError('La forma necesita movimientos y un límite positivos para calcular la cadencia.');
  }
  return patron.movimientos / patron.limiteSegundos;
}

/**
 * Traduce una cadencia a un intervalo de metrónomo.
 * @param movimientosPorSegundo Cadencia positiva.
 * @returns Milisegundos entre un movimiento y el siguiente.
 * @throws RangeError Si la cadencia no es un número finito mayor que cero.
 */
export function intervaloMetronomoMs(movimientosPorSegundo: number): number {
  if (!Number.isFinite(movimientosPorSegundo) || movimientosPorSegundo <= 0) {
    throw new RangeError('La cadencia debe ser un número positivo de movimientos por segundo.');
  }
  return 1000 / movimientosPorSegundo;
}

/**
 * Estima cuánto duraría la forma a una cadencia dada.
 * @param movimientos Cantidad positiva de movimientos.
 * @param movimientosPorSegundo Cadencia positiva.
 * @returns Duración proyectada en segundos.
 * @throws RangeError Si alguno de los valores no es finito y positivo.
 */
export function duracionProyectadaSegundos(movimientos: number, movimientosPorSegundo: number): number {
  if (!Number.isFinite(movimientos) || movimientos <= 0 || !Number.isFinite(movimientosPorSegundo) || movimientosPorSegundo <= 0) {
    throw new RangeError('La proyección necesita movimientos y cadencia positivos.');
  }
  return movimientos / movimientosPorSegundo;
}

/**
 * Ubica el pulso del metrónomo respecto del inicio, sin acumular deriva.
 * @param inicioMs Marca de `performance.now()` al comenzar la práctica.
 * @param ahoraMs Marca actual.
 * @param intervaloMs Intervalo positivo entre movimientos.
 * @returns Índice del movimiento en curso, desde cero, y milisegundos hasta el siguiente pulso. En un pulso exacto, `restanteMs` es 0.
 * @throws RangeError Si las marcas no son finitas o el intervalo no es positivo.
 */
export function proximoPulso(inicioMs: number, ahoraMs: number, intervaloMs: number): { indice: number; restanteMs: number } {
  if (![inicioMs, ahoraMs, intervaloMs].every(Number.isFinite) || intervaloMs <= 0) {
    throw new RangeError('El metrónomo necesita marcas de tiempo finitas y un intervalo positivo.');
  }
  const transcurrido = Math.max(0, ahoraMs - inicioMs);
  const indice = Math.floor(transcurrido / intervaloMs);
  const resto = transcurrido % intervaloMs;
  return { indice, restanteMs: resto === 0 ? 0 : intervaloMs - resto };
}

/**
 * Formatea una duración para el cronómetro.
 * @param ms Milisegundos. Los negativos se muestran como cero.
 * @returns Texto `mm:ss.cc`.
 * @throws RangeError Si el valor no es finito.
 */
export function formatearTiempo(ms: number): string {
  if (!Number.isFinite(ms)) throw new RangeError('El tiempo debe ser un número finito.');
  const totalCentesimas = Math.floor(Math.max(0, ms) / 10);
  const centesimas = totalCentesimas % 100;
  const totalSegundos = Math.floor(totalCentesimas / 100);
  const segundos = totalSegundos % 60;
  const minutos = Math.floor(totalSegundos / 60);
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
}

/**
 * Decide si una forma coincide con la búsqueda y el grupo activo.
 * @param patron Forma del catálogo.
 * @param consulta Texto libre. Vacío significa todas.
 * @param grupo `todos`, `gup` o `dan`.
 * @returns Si debe mostrarse.
 */
export function coincidePatron(patron: Patron, consulta: string, grupo: 'todos' | GrupoPatron): boolean {
  if (grupo !== 'todos' && patron.grupo !== grupo) return false;
  const normalizar = (valor: string): string => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
  const texto = normalizar(`${patron.nombre} ${patron.nombreReglamento} ${patron.grado}`);
  return terminos.every((termino) => texto.includes(termino));
}
