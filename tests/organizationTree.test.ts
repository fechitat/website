import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrganizationTree,
  wouldCreateCycle,
  type OrganizationUnitFlat,
} from '../src/lib/organizationTree.ts';

test('buildOrganizationTree estructura jerarquías de unidades directivas y comisiones', () => {
  const units: OrganizationUnitFlat[] = [
    {
      _id: 'unit-board',
      name: 'Directorio Oficial',
      type: 'board',
      order: 1,
      parentUnitRef: null,
    },
    {
      _id: 'unit-disc',
      name: 'Comisión de Disciplina',
      type: 'commission',
      order: 1,
      parentUnitRef: 'unit-board',
    },
    {
      _id: 'unit-sub-disc',
      name: 'Subcomisión de Apelaciones',
      type: 'subcommission',
      order: 1,
      parentUnitRef: 'unit-disc',
    },
    {
      _id: 'unit-dpc',
      name: 'Coordinador de Protección de Datos',
      type: 'other',
      order: 2,
      parentUnitRef: 'unit-board',
    },
  ];

  const tree = buildOrganizationTree(units);

  assert.equal(tree.length, 1);
  assert.equal(tree[0]._id, 'unit-board');
  assert.equal(tree[0].depth, 0);
  assert.equal(tree[0].children.length, 2);

  const disciplina = tree[0].children.find((c) => c._id === 'unit-disc');
  assert.ok(disciplina);
  assert.equal(disciplina.depth, 1);
  assert.equal(disciplina.children.length, 1);
  assert.equal(disciplina.children[0]._id, 'unit-sub-disc');
  assert.equal(disciplina.children[0].depth, 2);
});

test('wouldCreateCycle detecta autoreferencias y ciclos circulares', () => {
  const units = [
    { _id: 'a', parentUnitRef: 'b' },
    { _id: 'b', parentUnitRef: 'c' },
    { _id: 'c', parentUnitRef: null },
  ];

  // Auto-referencia
  assert.equal(wouldCreateCycle('a', 'a', units), true);

  // Ciclo indirecto: si a 'c' le asignamos padre 'a' (a -> b -> c -> a)
  assert.equal(wouldCreateCycle('c', 'a', units), true);

  // Sin ciclo: asignar a 'c' un nuevo nodo 'd'
  assert.equal(wouldCreateCycle('c', 'd', units), false);
});
