/**
 * Utilitario de árbol jerárquico para unidades organizacionales de FECHITAT.
 * Convierte un listado plano de organizationUnit en una estructura de árbol
 * con guarda anti-ciclos y tope de profundidad.
 */

export interface OrganizationMember {
  person: {
    _id: string;
    name: string;
    dan?: number | null;
    legacyTitle?: string | null;
    portrait?: unknown;
    shortBio?: string | null;
  };
  role?: string | null;
  contactEmail?: string | null;
  order?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface OrganizationUnitFlat {
  _id: string;
  name: string;
  slug?: { current: string } | string | null;
  type: 'board' | 'commission' | 'subcommission' | 'other';
  description?: unknown; // Portable Text o string
  parentUnitRef?: string | null; // parentUnit._ref
  members?: OrganizationMember[];
  order?: number | null;
  image?: unknown;
}

export interface OrganizationUnitTreeNode extends OrganizationUnitFlat {
  children: OrganizationUnitTreeNode[];
  depth: number;
}

const MAX_TREE_DEPTH = 10;

/**
 * Verifica si vincular unitId con parentRef crearía una referencia circular.
 * Recorre hacia arriba buscando parentRef hasta MAX_TREE_DEPTH.
 */
export function wouldCreateCycle(
  unitId: string,
  parentRef: string | null | undefined,
  allUnits: Array<{ _id: string; parentUnitRef?: string | null }>
): boolean {
  if (!parentRef) return false;
  if (unitId === parentRef) return true;

  const unitMap = new Map<string, string | null>();
  for (const u of allUnits) {
    unitMap.set(u._id, u.parentUnitRef ?? null);
  }

  let current: string | null | undefined = parentRef;
  let steps = 0;
  const visited = new Set<string>([unitId]);

  while (current && steps < MAX_TREE_DEPTH) {
    if (visited.has(current)) {
      return true;
    }
    visited.add(current);
    current = unitMap.get(current);
    steps++;
  }

  return false;
}

/**
 * Transforma una lista plana de unidades en uno o más árboles jerárquicos.
 * Filtra automáticamente referencias inválidas o ciclos para garantizar robustez.
 */
export function buildOrganizationTree(
  units: OrganizationUnitFlat[]
): OrganizationUnitTreeNode[] {
  const nodeMap = new Map<string, OrganizationUnitTreeNode>();

  // 1. Crear nodos iniciales sin hijos
  for (const unit of units) {
    nodeMap.set(unit._id, {
      ...unit,
      children: [],
      depth: 0,
    });
  }

  const roots: OrganizationUnitTreeNode[] = [];

  // 2. Vincular padres e hijos
  for (const unit of units) {
    const node = nodeMap.get(unit._id)!;
    const parentId = unit.parentUnitRef;

    if (
      parentId &&
      nodeMap.has(parentId) &&
      !wouldCreateCycle(unit._id, parentId, units)
    ) {
      const parentNode = nodeMap.get(parentId)!;
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 3. Calcular profundidades y ordenar recursivamente por orden y nombre
  function finalizeTree(nodes: OrganizationUnitTreeNode[], depth: number): OrganizationUnitTreeNode[] {
    nodes.sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'es-CL');
    });

    for (const node of nodes) {
      node.depth = depth;
      if (depth < MAX_TREE_DEPTH && node.children.length > 0) {
        node.children = finalizeTree(node.children, depth + 1);
      } else {
        node.children = [];
      }
    }

    return nodes;
  }

  return finalizeTree(roots, 0);
}
