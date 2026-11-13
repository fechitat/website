import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHonorific,
  formatPersonFullName,
  extractHonorificAndName,
} from '../src/lib/honorifics.ts';

test('getHonorific calcula títulos según Dan (Manual de Examen FECHITAT, p. 11)', () => {
  // Dan 1-3 -> "Bs."
  assert.equal(getHonorific({ name: 'Persona', dan: 1 }), 'Bs.');
  assert.equal(getHonorific({ name: 'Persona', dan: 2 }), 'Bs.');
  assert.equal(getHonorific({ name: 'Persona', dan: 3 }), 'Bs.');

  // Dan 4-6 -> "Sb."
  assert.equal(getHonorific({ name: 'Persona', dan: 4 }), 'Sb.');
  assert.equal(getHonorific({ name: 'Persona', dan: 5 }), 'Sb.');
  assert.equal(getHonorific({ name: 'Persona', dan: 6 }), 'Sb.');

  // Dan 7-8 -> "Maestro"
  assert.equal(getHonorific({ name: 'Persona', dan: 7 }), 'Maestro');
  assert.equal(getHonorific({ name: 'Persona', dan: 8 }), 'Maestro');

  // Dan 9 -> "Gran Maestro"
  assert.equal(getHonorific({ name: 'Persona', dan: 9 }), 'Gran Maestro');
});

test('getHonorific usa legacyTitle si no hay dan registrado', () => {
  assert.equal(getHonorific({ name: 'Juan Bravo', dan: null, legacyTitle: 'Sb.' }), 'Sb.');
  assert.equal(getHonorific({ name: 'Alfredo Puyol', dan: null, legacyTitle: 'Bs.' }), 'Bs.');
  assert.equal(getHonorific({ name: 'Persona Común', dan: null, legacyTitle: null }), '');
});

test('getHonorific NUNCA muestra Maestro o Gran Maestro a quien no tenga Dan >= 7', () => {
  // No Dan pero con legacyTitle malicioso o erróneo
  assert.equal(getHonorific({ name: 'Sin Dan', dan: null, legacyTitle: 'Maestro' }), '');
  assert.equal(getHonorific({ name: 'Sin Dan', dan: null, legacyTitle: 'Master' }), '');
  assert.equal(getHonorific({ name: 'Sin Dan', dan: null, legacyTitle: 'Gran Maestro' }), '');

  // Dan menor a 7
  assert.notEqual(getHonorific({ name: 'Dan Bajo', dan: 4 }), 'Maestro');
  assert.notEqual(getHonorific({ name: 'Dan Bajo', dan: 6 }), 'Maestro');
});

test('formatPersonFullName arma el nombre con prefijo respetando espacios', () => {
  assert.equal(formatPersonFullName({ name: 'Juan Bravo', dan: 4 }), 'Sb. Juan Bravo');
  assert.equal(formatPersonFullName({ name: 'Felipe Plaza', dan: 2 }), 'Bs. Felipe Plaza');
  assert.equal(formatPersonFullName({ name: 'Osvaldo Rojas', dan: null, legacyTitle: null }), 'Osvaldo Rojas');
});

test('extractHonorificAndName extrae prefijos marciales y desduplica strings sucios', () => {
  assert.deepEqual(extractHonorificAndName('Sb.Juan Bravo'), {
    name: 'Juan Bravo',
    legacyTitle: 'Sb.',
  });
  assert.deepEqual(extractHonorificAndName('Bs. Alfredo Puyol'), {
    name: 'Alfredo Puyol',
    legacyTitle: 'Bs.',
  });
  assert.deepEqual(extractHonorificAndName('Sj.Osvaldo Rojas'), {
    name: 'Osvaldo Rojas',
    legacyTitle: 'Sj.',
  });
  assert.deepEqual(extractHonorificAndName('Maestro Kim'), {
    name: 'Kim',
    legacyTitle: 'Maestro.',
  });
  assert.deepEqual(extractHonorificAndName('Osvaldo Rojas'), {
    name: 'Osvaldo Rojas',
    legacyTitle: null,
  });
});
