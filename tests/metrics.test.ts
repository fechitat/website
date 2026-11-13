import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMetrics,
  formatSpanishOrdinal,
  type FederationMetricConfig,
  type RecognitionMetricInput,
} from '../src/lib/metrics.ts';

test('formatSpanishOrdinal genera ordinales masculinos abreviados correctos en español', () => {
  assert.equal(formatSpanishOrdinal(1), '1.er');
  assert.equal(formatSpanishOrdinal(2), '2.º');
  assert.equal(formatSpanishOrdinal(3), '3.er');
  assert.equal(formatSpanishOrdinal(4), '4.º');
  assert.equal(formatSpanishOrdinal(10), '10.º');
});

test('computeMetrics mantiene manuales para blackBelts y activeCompetitors', () => {
  const configs: FederationMetricConfig[] = [
    { key: 'blackBelts', label: 'Cinturones negros', mode: 'manual', value: '50+', order: 1, showOn: ['home'] },
    { key: 'activeCompetitors', label: 'Competidores activos', mode: 'manual', value: '200+', order: 2, showOn: ['home'] },
  ];

  const resolved = computeMetrics(configs, []);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].value, '50+');
  assert.equal(resolved[0].isComputed, false);
  assert.equal(resolved[1].value, '200+');
  assert.equal(resolved[1].isComputed, false);
});

test('computeMetrics calcula worldMedals y bestAchievement cuando hay reconocimientos', () => {
  const configs: FederationMetricConfig[] = [
    { key: 'worldMedals', label: 'Medallas mundiales', mode: 'computed', value: '0', order: 1, showOn: ['jovenes'] },
    { key: 'bestAchievement', label: 'Mayor logro', mode: 'computed', value: 'Participación', order: 2, showOn: ['jovenes'] },
  ];

  const recognitions: RecognitionMetricInput[] = [
    { _id: 'rec-1', scope: 'world', placement: 3, year: 2023, title: 'Bronce Mundial' },
    { _id: 'rec-2', scope: 'world', placement: 2, year: 2025, title: 'Plata Mundial' },
    { _id: 'rec-3', scope: 'panamerican', placement: 1, year: 2024, title: 'Oro Panamericano' },
  ];

  const resolved = computeMetrics(configs, recognitions);

  // worldMedals: 2 reconocimientos world con placement <= 3 (puesto 3 y puesto 2)
  const medallas = resolved.find((m) => m.key === 'worldMedals');
  assert.ok(medallas);
  assert.equal(medallas.value, '2');
  assert.equal(medallas.isComputed, true);

  // bestAchievement: mayor jerarquía (world antes que panamerican), menor placement (2° puesto world antes que 3°)
  const mejor = resolved.find((m) => m.key === 'bestAchievement');
  assert.ok(mejor);
  assert.equal(mejor.value, '2.º');
  assert.equal(mejor.label, 'Lugar mundial');
  assert.equal(mejor.isComputed, true);
});

test('computeMetrics cae al valor manual si mode es computed pero no hay datos', () => {
  const configs: FederationMetricConfig[] = [
    { key: 'worldMedals', label: 'Medallas mundiales', mode: 'computed', value: '2', order: 1, showOn: ['jovenes'] },
    { key: 'bestAchievement', label: 'Lugar mundial', mode: 'computed', value: '3.er', order: 2, showOn: ['jovenes'] },
  ];

  const resolved = computeMetrics(configs, []);
  assert.equal(resolved[0].value, '2');
  assert.equal(resolved[0].isComputed, false);
  assert.equal(resolved[1].value, '3.er');
  assert.equal(resolved[1].label, 'Lugar mundial');
  assert.equal(resolved[1].isComputed, false);
});
