/**
 * Lógica de cálculo y resolución de métricas federativas (FECHITAT).
 *
 * Soporta métricas manuales y calculadas a partir de reconocimientos deportivos
 * con fallback seguro al valor manual si no hay datos.
 */

export type MetricKey =
  | 'blackBelts'
  | 'activeCompetitors'
  | 'worldMedals'
  | 'bestAchievement';

export type MetricMode = 'manual' | 'computed';

export type MetricShowOn = 'home' | 'jovenes';

export interface FederationMetricConfig {
  key: MetricKey;
  label: string;
  mode: MetricMode;
  value: string; // Ej: "50+", "200+", "2", "3.er"
  order: number;
  showOn?: MetricShowOn[];
}

export interface RecognitionMetricInput {
  _id: string;
  scope?: 'world' | 'panamerican' | 'national' | 'other' | null;
  placement?: number | null; // Entero >= 1
  year?: number | null;
  title?: string | null;
}

export interface ResolvedMetric {
  key: MetricKey;
  label: string;
  value: string;
  order: number;
  showOn: MetricShowOn[];
  isComputed: boolean;
}

const SCOPE_HIERARCHY: Record<string, number> = {
  world: 3,
  panamerican: 2,
  national: 1,
  other: 0,
};

const SCOPE_LABELS: Record<string, string> = {
  world: 'Lugar mundial',
  panamerican: 'Lugar panamericano',
  national: 'Lugar nacional',
  other: 'Lugar',
};

/**
 * Convierte un número de lugar (1, 2, 3...) a su ordinal masculino apocopado en español.
 * 1 -> "1.er", 2 -> "2.º", 3 -> "3.er", 4 -> "4.º", etc.
 */
export function formatSpanishOrdinal(num: number): string {
  if (num === 1) return '1.er';
  if (num === 2) return '2.º';
  if (num === 3) return '3.er';
  return `${num}.º`;
}

/**
 * Resuelve y calcula el conjunto de métricas federativas a partir de la configuración
 * en Sanity y los reconocimientos vigentes.
 */
export function computeMetrics(
  metricConfigs: FederationMetricConfig[] = [],
  recognitions: RecognitionMetricInput[] = []
): ResolvedMetric[] {
  // Ordenar configuraciones por orden
  const sorted = [...metricConfigs].sort((a, b) => a.order - b.order);

  return sorted.map((config) => {
    const showOn = config.showOn ?? ['home'];

    // blackBelts y activeCompetitors son SIEMPRE manuales
    if (config.key === 'blackBelts' || config.key === 'activeCompetitors') {
      return {
        key: config.key,
        label: config.label,
        value: config.value,
        order: config.order,
        showOn,
        isComputed: false,
      };
    }

    if (config.mode === 'computed') {
      if (config.key === 'worldMedals') {
        const medals = recognitions.filter(
          (r) =>
            r.scope === 'world' &&
            typeof r.placement === 'number' &&
            r.placement >= 1 &&
            r.placement <= 3
        );
        if (medals.length > 0) {
          return {
            key: config.key,
            label: config.label || 'Medallas mundiales',
            value: medals.length.toString(),
            order: config.order,
            showOn,
            isComputed: true,
          };
        }
      }

      if (config.key === 'bestAchievement') {
        const valid = recognitions.filter(
          (r) =>
            r.scope &&
            r.scope in SCOPE_HIERARCHY &&
            typeof r.placement === 'number' &&
            r.placement >= 1
        );

        if (valid.length > 0) {
          // Ordenar por alcance descendente y luego menor puesto (1° mejor que 2°)
          valid.sort((a, b) => {
            const scopeA = SCOPE_HIERARCHY[a.scope || 'other'] ?? 0;
            const scopeB = SCOPE_HIERARCHY[b.scope || 'other'] ?? 0;
            if (scopeA !== scopeB) return scopeB - scopeA;
            return (a.placement ?? 999) - (b.placement ?? 999);
          });

          const best = valid[0];
          const ordinal = formatSpanishOrdinal(best.placement!);
          const label = SCOPE_LABELS[best.scope || 'other'] ?? config.label;

          return {
            key: config.key,
            label,
            value: ordinal,
            order: config.order,
            showOn,
            isComputed: true,
          };
        }
      }
    }

    // Fallback seguro a los valores manuales configurados
    return {
      key: config.key,
      label: config.label,
      value: config.value,
      order: config.order,
      showOn,
      isComputed: false,
    };
  });
}
