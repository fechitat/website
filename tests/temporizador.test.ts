import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PATRONES,
  RETRASOS_INICIO,
  cadenciaOficial,
  coincidePatron,
  duracionProyectadaSegundos,
  formatearTiempo,
  intervaloMetronomoMs,
  obtenerPatron,
  proximoPulso,
  verificarLimitesReglamento,
} from '../src/features/temporizador/patrones.ts';

test('usa los 24 límites del reglamento ITF del 22.03.2026', () => {
  assert.doesNotThrow(verificarLimitesReglamento);
  assert.equal(PATRONES.length, 24);
  assert.equal(obtenerPatron('toi-gye')?.limiteSegundos, 66);
  assert.equal(obtenerPatron('yoo-sin')?.limiteSegundos, 104);
  assert.equal(obtenerPatron('chang-hon')?.limiteSegundos, 94);
  assert.equal(obtenerPatron('chang-hon')?.movimientos, null);
  assert.equal(obtenerPatron('inexistente'), undefined);
});

test('ofrece espera de 3 y 10 segundos y calcula el ritmo oficial', () => {
  assert.ok(RETRASOS_INICIO.includes(3));
  assert.ok(RETRASOS_INICIO.includes(10));
  const chonJi = obtenerPatron('chon-ji');
  assert.ok(chonJi);
  assert.equal(cadenciaOficial(chonJi), 19 / 30);
  assert.equal(cadenciaOficial(obtenerPatron('chang-hon')!), null);
  assert.equal(intervaloMetronomoMs(0.5), 2000);
  assert.throws(() => intervaloMetronomoMs(0), RangeError);
  assert.equal(duracionProyectadaSegundos(19, 19 / 30), 30);
});

test('marca los pulsos sin deriva y formatea el cronómetro', () => {
  assert.deepEqual(proximoPulso(1_000, 1_000, 500), { indice: 0, restanteMs: 0 });
  assert.deepEqual(proximoPulso(1_000, 1_250, 500), { indice: 0, restanteMs: 250 });
  assert.deepEqual(proximoPulso(1_000, 1_500, 500), { indice: 1, restanteMs: 0 });
  assert.throws(() => proximoPulso(0, 0, 0), RangeError);
  assert.equal(formatearTiempo(30_500), '00:30.50');
  assert.equal(formatearTiempo(66_000), '01:06.00');
  assert.equal(formatearTiempo(-20), '00:00.00');
  assert.equal(coincidePatron(PATRONES[0]!, 'chon', 'gup'), true);
  assert.equal(coincidePatron(PATRONES[0]!, 'chon', 'dan'), false);
});
