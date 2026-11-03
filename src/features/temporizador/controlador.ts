import {
  RETRASOS_INICIO,
  cadenciaOficial,
  coincidePatron,
  duracionProyectadaSegundos,
  formatearTiempo,
  intervaloMetronomoMs,
  obtenerPatron,
  proximoPulso,
  type Patron,
  type RetrasoInicio,
} from './patrones.ts';

const CLAVE_AJUSTES = 'fechitat:temporizador';
const numeros = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

interface Ajustes {
  retraso: RetrasoInicio;
  metronomo: boolean;
  sonido: boolean;
}

interface BloqueoPantalla { release(): Promise<void> }

/**
 * Conecta el selector, el retraso, el metrónomo y el cronómetro de una página ya renderizada.
 * @param raiz Contenedor `#temporizador-formas`.
 * @returns Nada.
 * @throws Error Si falta un control obligatorio del temporizador.
 */
export function iniciarTemporizador(raiz: HTMLElement): void {
  const buscar = requerido<HTMLInputElement>(raiz, '[data-buscar]');
  const filtros = [...raiz.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const botones = [...raiz.querySelectorAll<HTMLButtonElement>('[data-patron]')];
  const vacio = requerido<HTMLElement>(raiz, '[data-vacio]');
  const panel = requerido<HTMLElement>(raiz, '[data-panel]');
  const nombre = requerido<HTMLElement>(raiz, '[data-nombre]');
  const grado = requerido<HTMLElement>(raiz, '[data-grado]');
  const limite = requerido<HTMLElement>(raiz, '[data-limite]');
  const nota = requerido<HTMLElement>(raiz, '[data-nota]');
  const movimientosInput = requerido<HTMLInputElement>(raiz, '[data-movimientos-input]');
  const retrasos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-retraso]')];
  const metronomo = requerido<HTMLInputElement>(raiz, '[data-metronomo]');
  const cadencia = requerido<HTMLInputElement>(raiz, '[data-cadencia]');
  const cadenciaTexto = requerido<HTMLElement>(raiz, '[data-cadencia-texto]');
  const proyeccion = requerido<HTMLElement>(raiz, '[data-proyeccion]');
  const sonido = requerido<HTMLInputElement>(raiz, '[data-sonido]');
  const iniciar = requerido<HTMLButtonElement>(raiz, '[data-iniciar]');
  const overlay = requerido<HTMLElement>(raiz, '[data-overlay]');
  const overlayNombre = requerido<HTMLElement>(raiz, '[data-overlay-nombre]');
  const tiempo = requerido<HTMLElement>(raiz, '[data-tiempo]');
  const estado = requerido<HTMLElement>(raiz, '[data-estado]');
  const movimiento = requerido<HTMLElement>(raiz, '[data-movimiento]');
  const reloj = requerido<HTMLElement>(raiz, '[data-reloj]');
  const pulso = requerido<HTMLElement>(raiz, '[data-pulso]');
  const pausar = requerido<HTMLButtonElement>(raiz, '[data-pausar]');
  const detener = requerido<HTMLButtonElement>(raiz, '[data-detener]');
  const anuncio = requerido<HTMLElement>(raiz, '[data-anuncio]');

  const ajustes = leerAjustes();
  let patron: Patron | undefined;
  let grupo: 'todos' | 'gup' | 'dan' = 'todos';
  let fase: 'idle' | 'delay' | 'running' | 'paused' | 'exceeded' = 'idle';
  let pausadoDesde: 'delay' | 'run' | null = null;
  let frame = 0;
  let inicioPractica = 0;
  let inicioRetraso = 0;
  let retrasoRestanteMs = 0;
  let acumuladoMs = 0;
  let ultimoIndice = -1;
  let ultimoSegundoAnuncio = -1;
  let ultimoRetrasoMostrado = -1;
  let audio: AudioContext | undefined;
  let pantalla: BloqueoPantalla | undefined;

  sonido.checked = ajustes.sonido;
  metronomo.checked = ajustes.metronomo;
  marcarRetraso(ajustes.retraso);

  function aplicarFiltro(): void {
    const consulta = buscar.value;
    let visibles = 0;
    for (const boton of botones) {
      const actual = obtenerPatron(boton.dataset.id ?? '');
      const visible = actual ? coincidePatron(actual, consulta, grupo) : false;
      const item = boton.closest('li');
      if (item) item.hidden = !visible;
      if (visible) visibles += 1;
    }
    const aviso = raiz.querySelector<HTMLElement>('[data-sin-resultados]');
    if (aviso) aviso.hidden = visibles > 0;
  }

  function marcarRetraso(segundos: RetrasoInicio): void {
    ajustes.retraso = segundos;
    for (const boton of retrasos) {
      const activo = Number(boton.dataset.retraso) === segundos;
      boton.setAttribute('aria-pressed', String(activo));
      boton.classList.toggle('is-activo', activo);
    }
    guardarAjustes(ajustes);
  }

  function movimientosActivos(): number | null {
    const valor = Number(movimientosInput.value);
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  }

  function ritmoActual(): number | null {
    const valor = Number(cadencia.value);
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }

  function actualizarCadencia(): void {
    const valor = ritmoActual();
    const movimientos = movimientosActivos();
    if (valor == null) {
      cadenciaTexto.textContent = 'Indica movimientos por segundo.';
      proyeccion.textContent = '';
      return;
    }
    cadenciaTexto.textContent = `${numeros.format(valor)} mov/s · ${numeros.format(1 / valor)} s por movimiento`;
    if (!patron || movimientos == null) {
      proyeccion.textContent = 'Sin cantidad de movimientos no se puede proyectar el final.';
      return;
    }
    const proyectada = duracionProyectadaSegundos(movimientos, valor);
    const diferencia = proyectada - patron.limiteSegundos;
    proyeccion.textContent = diferencia > 0.05
      ? `A este ritmo superas el límite por ${numeros.format(diferencia)} s.`
      : `A este ritmo los movimientos caben en ${numeros.format(proyectada)} s. El límite incluye anunciar el nombre.`;
  }

  function seleccionar(id: string, desplazar: boolean): void {
    const elegido = obtenerPatron(id);
    if (!elegido) return;
    patron = elegido;
    for (const boton of botones) boton.setAttribute('aria-pressed', String(boton.dataset.id === id));
    nombre.textContent = elegido.nombre;
    grado.textContent = elegido.grado;
    limite.textContent = formatearTiempo(elegido.limiteSegundos * 1000);
    movimientosInput.value = elegido.movimientos == null ? '' : String(elegido.movimientos);
    nota.textContent = elegido.movimientos == null
      ? 'El reglamento 2026 publica 94 s, pero no la cantidad de movimientos.'
      : `${elegido.movimientos} movimientos · límite ${elegido.limiteSegundos} s`;
    const oficial = cadenciaOficial(elegido);
    cadencia.value = oficial ? oficial.toFixed(2) : '';
    vacio.hidden = true;
    panel.hidden = false;
    const url = new URL(window.location.href);
    url.searchParams.set('forma', id);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    actualizarCadencia();
    if (desplazar) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  async function asegurarAudio(): Promise<void> {
    if (!ajustes.sonido) return;
    const ventana = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Contexto = window.AudioContext ?? ventana.webkitAudioContext;
    if (!Contexto) return;
    audio ??= new Contexto();
    if (audio.state === 'suspended') await audio.resume();
  }

  function tono(frecuencia: number, duracion: number, volumen = 0.08): void {
    if (!audio) return;
    const oscilador = audio.createOscillator();
    const ganancia = audio.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.value = frecuencia;
    ganancia.gain.setValueAtTime(0.0001, audio.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(volumen, audio.currentTime + 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracion);
    oscilador.connect(ganancia).connect(audio.destination);
    oscilador.start();
    oscilador.stop(audio.currentTime + duracion + 0.02);
  }

  function marcarPulso(): void {
    pulso.classList.remove('is-pulso');
    void pulso.offsetWidth;
    pulso.classList.add('is-pulso');
  }

  function pintar(transcurridoMs: number): void {
    if (!patron) return;
    const limiteMs = patron.limiteSegundos * 1000;
    const restante = limiteMs - transcurridoMs;
    const excedido = restante < 0;
    tiempo.textContent = `${excedido ? '+' : ''}${formatearTiempo(Math.abs(restante))}`;
    tiempo.classList.toggle('is-excedido', excedido);
    reloj.style.setProperty('--progreso', String(Math.min(1, Math.max(0, transcurridoMs / limiteMs))));
    estado.textContent = excedido ? 'Tiempo excedido' : fase === 'paused' ? 'En pausa' : 'En curso';
    const ritmo = metronomo.checked ? ritmoActual() : null;
    const movimientos = movimientosActivos();
    if (ritmo) {
      const pulsoActual = proximoPulso(inicioPractica, inicioPractica + transcurridoMs, intervaloMetronomoMs(ritmo));
      const numero = pulsoActual.indice + 1;
      movimiento.textContent = movimientos ? `Movimiento ${Math.min(numero, movimientos)} de ${movimientos}` : `Pulso ${numero}`;
      const dentro = movimientos == null || numero <= movimientos;
      if (dentro && pulsoActual.indice !== ultimoIndice) {
        const salto = pulsoActual.indice - ultimoIndice;
        if (ajustes.sonido && salto > 0 && salto < 3) tono(980, 0.045, 0.05);
        marcarPulso();
        ultimoIndice = pulsoActual.indice;
      }
    } else {
      movimiento.textContent = 'Metrónomo apagado';
    }
    const segundo = Math.floor(Math.abs(restante) / 1000);
    if (segundo !== ultimoSegundoAnuncio) {
      ultimoSegundoAnuncio = segundo;
      anuncio.textContent = excedido
        ? `${patron.nombre}: tiempo excedido por ${formatearTiempo(-restante)}`
        : `${patron.nombre}: quedan ${formatearTiempo(restante)}`;
    }
  }

  function cuadro(): void {
    if (fase === 'delay') {
      const restante = ajustes.retraso * 1000 - (performance.now() - inicioRetraso);
      const segundos = Math.max(1, Math.ceil(restante / 1000));
      if (segundos !== ultimoRetrasoMostrado) {
        if (ultimoRetrasoMostrado !== -1) tono(660, 0.08, 0.07);
        ultimoRetrasoMostrado = segundos;
      }
      tiempo.textContent = String(segundos);
      estado.textContent = 'Prepárate';
      movimiento.textContent = 'El límite empieza al terminar la espera';
      reloj.style.setProperty('--progreso', '0');
      if (restante <= 0) comenzarPractica();
      else frame = window.requestAnimationFrame(cuadro);
      return;
    }
    if ((fase !== 'running' && fase !== 'exceeded') || !patron) return;
    const transcurrido = acumuladoMs + (performance.now() - inicioPractica);
    if (fase === 'running' && transcurrido >= patron.limiteSegundos * 1000) {
      fase = 'exceeded';
      overlay.dataset.fase = 'exceeded';
      tono(440, 0.18, 0.12);
      window.setTimeout(() => tono(330, 0.28, 0.12), 180);
    }
    pintar(transcurrido);
    frame = window.requestAnimationFrame(cuadro);
  }

  function comenzarPractica(): void {
    fase = 'running';
    pausadoDesde = null;
    inicioPractica = performance.now();
    ultimoIndice = -1;
    ultimoSegundoAnuncio = -1;
    overlay.dataset.fase = 'running';
    pausar.textContent = 'Pausar';
    tono(880, 0.12, 0.1);
    frame = window.requestAnimationFrame(cuadro);
  }

  async function partir(): Promise<void> {
    if (!patron || fase === 'running' || fase === 'delay') return;
    await asegurarAudio();
    acumuladoMs = 0;
    ultimoIndice = -1;
    overlay.hidden = false;
    overlayNombre.textContent = patron.nombre;
    document.body.style.overflow = 'hidden';
    const navegador = navigator as Navigator & { wakeLock?: { request(tipo: 'screen'): Promise<BloqueoPantalla> } };
    try { pantalla = await navegador.wakeLock?.request('screen'); } catch { pantalla = undefined; }
    if (ajustes.retraso > 0) {
      fase = 'delay';
      ultimoRetrasoMostrado = ajustes.retraso;
      inicioRetraso = performance.now();
      overlay.dataset.fase = 'delay';
      tiempo.textContent = String(ajustes.retraso);
      estado.textContent = 'Prepárate';
      movimiento.textContent = 'El límite empieza al terminar la espera';
      tono(660, 0.08, 0.07);
      frame = window.requestAnimationFrame(cuadro);
      return;
    }
    comenzarPractica();
  }

  function pausarOReanudar(): void {
    if (fase === 'delay') {
      retrasoRestanteMs = Math.max(0, ajustes.retraso * 1000 - (performance.now() - inicioRetraso));
      window.cancelAnimationFrame(frame);
      fase = 'paused';
      pausadoDesde = 'delay';
      overlay.dataset.fase = 'paused';
      estado.textContent = 'En pausa';
      pausar.textContent = 'Continuar';
      return;
    }
    if (fase === 'running' || fase === 'exceeded') {
      acumuladoMs += performance.now() - inicioPractica;
      window.cancelAnimationFrame(frame);
      fase = 'paused';
      pausadoDesde = 'run';
      overlay.dataset.fase = 'paused';
      estado.textContent = 'En pausa';
      pausar.textContent = 'Continuar';
      return;
    }
    if (fase !== 'paused') return;
    if (pausadoDesde === 'delay') {
      inicioRetraso = performance.now() - (ajustes.retraso * 1000 - retrasoRestanteMs);
      fase = 'delay';
      overlay.dataset.fase = 'delay';
      pausar.textContent = 'Pausar';
      frame = window.requestAnimationFrame(cuadro);
      return;
    }
    inicioPractica = performance.now();
    fase = patron && acumuladoMs >= patron.limiteSegundos * 1000 ? 'exceeded' : 'running';
    overlay.dataset.fase = fase;
    pausar.textContent = 'Pausar';
    frame = window.requestAnimationFrame(cuadro);
  }

  async function parar(): Promise<void> {
    window.cancelAnimationFrame(frame);
    fase = 'idle';
    pausadoDesde = null;
    overlay.hidden = true;
    overlay.dataset.fase = 'idle';
    document.body.style.overflow = '';
    try { await pantalla?.release(); } catch { /* El navegador ya liberó la pantalla. */ }
    pantalla = undefined;
    pausar.textContent = 'Pausar';
  }

  buscar.addEventListener('input', aplicarFiltro);
  for (const boton of filtros) {
    boton.addEventListener('click', () => {
      const siguiente = boton.dataset.filtro;
      grupo = siguiente === 'gup' || siguiente === 'dan' ? siguiente : 'todos';
      for (const otro of filtros) otro.setAttribute('aria-pressed', String(otro === boton));
      aplicarFiltro();
    });
  }
  for (const boton of botones) boton.addEventListener('click', () => seleccionar(boton.dataset.id ?? '', true));
  for (const boton of retrasos) {
    boton.addEventListener('click', () => {
      const segundos = Number(boton.dataset.retraso);
      if ((RETRASOS_INICIO as readonly number[]).includes(segundos)) marcarRetraso(segundos as RetrasoInicio);
    });
  }
  metronomo.addEventListener('change', () => { ajustes.metronomo = metronomo.checked; guardarAjustes(ajustes); });
  sonido.addEventListener('change', () => { ajustes.sonido = sonido.checked; guardarAjustes(ajustes); });
  cadencia.addEventListener('input', actualizarCadencia);
  movimientosInput.addEventListener('input', actualizarCadencia);
  raiz.querySelector('[data-ritmo-oficial]')?.addEventListener('click', () => {
    if (!patron) return;
    const oficial = cadenciaOficial({ ...patron, movimientos: movimientosActivos() });
    if (!oficial) return;
    cadencia.value = oficial.toFixed(2);
    metronomo.checked = true;
    ajustes.metronomo = true;
    guardarAjustes(ajustes);
    actualizarCadencia();
  });
  iniciar.addEventListener('click', () => { void partir(); });
  pausar.addEventListener('click', pausarOReanudar);
  detener.addEventListener('click', () => { void parar(); });
  window.addEventListener('keydown', (evento) => {
    if (!overlay.isConnected || overlay.hidden) return;
    if (evento.target instanceof HTMLInputElement || evento.target instanceof HTMLTextAreaElement) return;
    if (evento.code === 'Space' && !overlay.hidden) {
      evento.preventDefault();
      pausarOReanudar();
    } else if (evento.code === 'Escape' && !overlay.hidden) {
      void parar();
    }
  });

  document.addEventListener('astro:before-swap', () => { void parar(); }, { once: true });
  const inicial = new URLSearchParams(window.location.search).get('forma');
  if (inicial && obtenerPatron(inicial)) seleccionar(inicial, false);
  aplicarFiltro();
}

function leerAjustes(): Ajustes {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_AJUSTES) ?? '') as Partial<Ajustes>;
    const retraso = (RETRASOS_INICIO as readonly number[]).includes(guardado.retraso ?? -1)
      ? guardado.retraso as RetrasoInicio
      : 3;
    return { retraso, metronomo: guardado.metronomo !== false, sonido: guardado.sonido !== false };
  } catch {
    return { retraso: 3, metronomo: true, sonido: true };
  }
}

function guardarAjustes(ajustes: Ajustes): void {
  try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes)); } catch { /* El modo privado puede bloquear el almacenamiento. */ }
}

function requerido<T extends Element>(raiz: ParentNode, selector: string): T {
  const nodo = raiz.querySelector<T>(selector);
  if (!nodo) throw new Error(`Falta el elemento del temporizador: ${selector}`);
  return nodo;
}
