import { play, setEnabled, unlock } from 'cuelume';
import {
  RETRASOS_INICIO,
  cadenciaOficial,
  coincidePatron,
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
  const selectForma = raiz.querySelector<HTMLSelectElement>('[data-select-forma]');
  const buscar = raiz.querySelector<HTMLInputElement>('[data-buscar]');
  const filtros = [...raiz.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const listaFormas = raiz.querySelector<HTMLElement>('[data-lista-formas]');
  const cuerpoLista = raiz.querySelector<HTMLElement>('[data-lista-cuerpo]');
  const colapsar = raiz.querySelector<HTMLButtonElement>('[data-colapsar]');
  const colapsarNombre = raiz.querySelector<HTMLElement>('[data-colapsar-nombre]');
  const cargarMas = raiz.querySelector<HTMLButtonElement>('[data-cargar-mas]');
  const resto = raiz.querySelector<HTMLTemplateElement>('[data-resto]');
  const vacio = raiz.querySelector<HTMLElement>('[data-vacio]');
  const panel = requerido<HTMLElement>(raiz, '[data-panel]');
  const nombre = requerido<HTMLElement>(raiz, '[data-nombre]');
  const grado = requerido<HTMLElement>(raiz, '[data-grado]');
  const limite = requerido<HTMLElement>(raiz, '[data-limite]');
  const movimientosTexto = raiz.querySelector<HTMLElement>('[data-movimientos]');
  const cadenciaTexto = raiz.querySelector<HTMLElement>('[data-cadencia]');
  const retrasos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-retraso]')];
  const metronomos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-metronomo]')];
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
  const pantallaCompleta = raiz.querySelector<HTMLButtonElement>('[data-pantalla-completa]');

  function vibrar(secuencia: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(secuencia);
      }
    } catch { /* Ignorar si no está soportado */ }
  }

  pantallaCompleta?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      overlay.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

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
  let pantalla: BloqueoPantalla | undefined;

  sonido.checked = ajustes.sonido;
  setEnabled(ajustes.sonido);
  marcarRetraso(ajustes.retraso);
  marcarMetronomo(ajustes.metronomo);

  function formas(): HTMLButtonElement[] {
    return listaFormas ? [...listaFormas.querySelectorAll<HTMLButtonElement>('[data-patron]')] : [];
  }

  function cargarResto(): void {
    if (!cargarMas || cargarMas.hidden || !listaFormas || !resto) return;
    listaFormas.append(resto.content.cloneNode(true));
    cargarMas.hidden = true;
    aplicarFiltro();
  }

  function aplicarFiltro(): void {
    if (!buscar) return;
    const consulta = buscar.value;
    let visibles = 0;
    for (const boton of formas()) {
      const actual = obtenerPatron(boton.dataset.id ?? '');
      const visible = actual ? coincidePatron(actual, consulta, grupo) : false;
      const item = boton.closest('li');
      if (item) item.hidden = !visible;
      if (visible) visibles += 1;
    }
    const aviso = raiz.querySelector<HTMLElement>('[data-sin-resultados]');
    if (aviso) aviso.hidden = visibles > 0;
  }

  function colapsarLista(id: string): void {
    if (!colapsar || !colapsarNombre || !cuerpoLista) return;
    const elegido = obtenerPatron(id);
    colapsarNombre.textContent = elegido ? `${elegido.nombre} · ${elegido.limiteSegundos}s` : 'Cambiar';
    colapsar.hidden = false;
    cuerpoLista.hidden = true;
    listaFormas?.closest('[data-lista]')?.classList.add('is-colapsada');
  }

  function abrirLista(): void {
    if (!cuerpoLista || !colapsar) return;
    cuerpoLista.hidden = false;
    colapsar.hidden = true;
    listaFormas?.closest('[data-lista]')?.classList.remove('is-colapsada');
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

  function marcarMetronomo(activo: boolean): void {
    ajustes.metronomo = activo;
    for (const boton of metronomos) {
      const seleccionado = (boton.dataset.metronomo === 'si') === activo;
      boton.setAttribute('aria-pressed', String(seleccionado));
      boton.classList.toggle('is-activo', seleccionado);
    }
    guardarAjustes(ajustes);
  }

  function ritmoActual(): number | null {
    if (!patron || !ajustes.metronomo) return null;
    return cadenciaOficial(patron);
  }

  function seleccionar(id: string, desplazar: boolean): void {
    const elegido = obtenerPatron(id);
    if (!elegido) return;
    patron = elegido;
    if (!formas().some((boton) => boton.dataset.id === id)) cargarResto();
    for (const boton of formas()) boton.setAttribute('aria-pressed', String(boton.dataset.id === id));
    nombre.textContent = elegido.nombre;
    grado.textContent = elegido.grado;
    limite.textContent = formatearTiempo(elegido.limiteSegundos * 1000);
    const oficial = cadenciaOficial(elegido);
    if (movimientosTexto) movimientosTexto.textContent = elegido.movimientos == null ? '—' : String(elegido.movimientos);
    if (cadenciaTexto) cadenciaTexto.textContent = oficial == null ? '—' : numeros.format(oficial);
    if (selectForma && selectForma.value !== id) selectForma.value = id;
    if (vacio) vacio.hidden = true;
    panel.hidden = false;
    const url = new URL(window.location.href);
    url.searchParams.set('forma', id);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    colapsarLista(id);
    if (desplazar) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
    const ritmo = ritmoActual();
    const movimientos = patron.movimientos;
    if (ritmo) {
      const pulsoActual = proximoPulso(inicioPractica, inicioPractica + transcurridoMs, intervaloMetronomoMs(ritmo));
      const numero = pulsoActual.indice + 1;
      movimiento.textContent = movimientos ? `Movimiento ${Math.min(numero, movimientos)} de ${movimientos}` : `Pulso ${numero}`;
      const dentro = movimientos == null || numero <= movimientos;
      if (dentro && pulsoActual.indice !== ultimoIndice) {
        const salto = pulsoActual.indice - ultimoIndice;
        if (ajustes.sonido && salto > 0 && salto < 3) play('tap');
        marcarPulso();
        ultimoIndice = pulsoActual.indice;
      }
    } else {
      movimiento.textContent = ajustes.metronomo ? 'Sin ritmo definido' : 'Metrónomo apagado';
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
        if (ultimoRetrasoMostrado !== -1 && ajustes.sonido) play('count');
        ultimoRetrasoMostrado = segundos;
      }
      tiempo.textContent = String(segundos);
      estado.textContent = 'Prepárate';
      movimiento.textContent = 'Espera';
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
      if (ajustes.sonido) play('warning');
      vibrar([200, 100, 200, 100, 300]);
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
    if (ajustes.sonido) play('ready');
    vibrar([120, 60, 120]);
    frame = window.requestAnimationFrame(cuadro);
  }

  async function partir(): Promise<void> {
    if (!patron || fase === 'running' || fase === 'delay') return;
    setEnabled(ajustes.sonido);
    if (ajustes.sonido) {
      void unlock();
    }
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
      movimiento.textContent = 'Espera';
      if (ajustes.sonido) play('count');
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
      if (grupo === 'dan') cargarResto();
      for (const otro of filtros) otro.setAttribute('aria-pressed', String(otro === boton));
      aplicarFiltro();
    });
  }
  listaFormas.addEventListener('click', (evento) => {
    const boton = (evento.target as Element).closest<HTMLButtonElement>('[data-patron]');
    if (boton) seleccionar(boton.dataset.id ?? '', true);
  });
  cargarMas.addEventListener('click', cargarResto);
  colapsar.addEventListener('click', abrirLista);
  for (const boton of retrasos) {
    boton.addEventListener('click', () => {
      const segundos = Number(boton.dataset.retraso);
      if ((RETRASOS_INICIO as readonly number[]).includes(segundos)) marcarRetraso(segundos as RetrasoInicio);
    });
  }
  for (const boton of metronomos) {
    boton.addEventListener('click', () => marcarMetronomo(boton.dataset.metronomo === 'si'));
  }
  sonido.addEventListener('change', () => {
    ajustes.sonido = sonido.checked;
    setEnabled(ajustes.sonido);
    guardarAjustes(ajustes);
  });
  iniciar.addEventListener('click', () => { void partir(); });
  pausar.addEventListener('click', pausarOReanudar);
  detener.addEventListener('click', () => { void parar(); });
  window.addEventListener('keydown', (evento) => {
    if (!overlay.isConnected || overlay.hidden) return;
    if (evento.target instanceof HTMLInputElement || evento.target instanceof HTMLTextAreaElement) return;
    if (evento.code === 'Space') {
      evento.preventDefault();
      pausarOReanudar();
    } else if (evento.code === 'Escape') {
      void parar();
    }
  });

  document.addEventListener('astro:before-swap', () => { void parar(); }, { once: true });
  selectForma?.addEventListener('change', () => {
    if (selectForma.value) seleccionar(selectForma.value, false);
  });
  const inicial = new URLSearchParams(window.location.search).get('forma') || (PATRONES[0] ? PATRONES[0].id : undefined);
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
