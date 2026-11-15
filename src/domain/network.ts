import type { EmergencyRoute, Intersection, ScenarioId } from './types';

/**
 * Rede fictícia de 12 cruzamentos (3 avenidas leste-oeste × 4 ruas norte-sul),
 * inspirada na região da Av. Paulista, em São Paulo. Tudo aqui é simulado.
 */
export const ROW_STREETS = ['Av. Paulista', 'Rua Augusta', 'Rua da Consolação'] as const;
export const ROW_SHORT = ['Paulista', 'Augusta', 'Consolação'] as const;
export const COL_STREETS = [
  'Av. Rebouças',
  'Rua Haddock Lobo',
  'Rua Pamplona',
  'Av. Brig. Luís Antônio',
] as const;
export const COL_SHORT = ['Rebouças', 'Haddock Lobo', 'Pamplona', 'Luís Antônio'] as const;

/** Fluxo de pico (veículos/min) por rua. A Paulista e as duas avenidas norte-sul são as mais carregadas. */
const PEAK_NS = [19, 11, 9, 18];
const PEAK_EW = [21, 12, 14];

export const COLS = COL_STREETS.length;
export const ROWS = ROW_STREETS.length;

export const nodeId = (row: number, col: number) => `c-${row}-${col}`;

export const INTERSECTIONS: Intersection[] = ROW_STREETS.flatMap((_, row) =>
  COL_STREETS.map((__, col) => {
    const index = row * COLS + col;
    // pequena variação por cruzamento para a rede não parecer uniforme
    const m = 0.9 + ((index * 7) % 11) / 50;
    return {
      id: nodeId(row, col),
      index,
      name: `${ROW_STREETS[row]} × ${COL_STREETS[col]}`,
      shortName: `${ROW_SHORT[row]} × ${COL_SHORT[col]}`,
      streetEW: ROW_STREETS[row],
      streetNS: COL_STREETS[col],
      row,
      col,
      peakNS: Math.round(PEAK_NS[col] * m * 10) / 10,
      peakEW: Math.round(PEAK_EW[row] * m * 10) / 10,
    };
  }),
);

export const ROUTES: EmergencyRoute[] = [
  {
    id: 'paulista',
    name: 'Pela Av. Paulista',
    origin: 'Base SAMU Paraíso',
    destination: 'Pronto-Socorro Oeste',
    nodes: [nodeId(0, 3), nodeId(0, 2), nodeId(0, 1), nodeId(0, 0)],
  },
  {
    id: 'centro',
    name: 'Do Centro ao Hospital Central',
    origin: 'Base SAMU Centro',
    destination: 'Hospital Central',
    nodes: [nodeId(2, 3), nodeId(1, 3), nodeId(1, 2), nodeId(1, 1), nodeId(0, 1)],
  },
  {
    id: 'consolacao',
    name: 'Pela Consolação',
    origin: 'Base SAMU Consolação',
    destination: 'Hospital Municipal',
    nodes: [nodeId(2, 0), nodeId(2, 1), nodeId(1, 1), nodeId(1, 2), nodeId(0, 2)],
  },
];

export interface Scenario {
  id: ScenarioId;
  label: string;
  /** Hora simulada. null = usa o relógio do celular. */
  hour: number | null;
  description: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'pico-noite', label: 'Pico 18h', hour: 18, description: 'Horário de pico da noite (18h)' },
  { id: 'pico-manha', label: 'Pico 8h', hour: 8, description: 'Horário de pico da manhã (8h)' },
  { id: 'tarde', label: 'Tarde 14h', hour: 14, description: 'Meio da tarde (14h)' },
  { id: 'madrugada', label: 'Madrugada 3h', hour: 3, description: 'Madrugada (3h)' },
  { id: 'agora', label: 'Agora', hour: null, description: 'Horário atual do seu celular' },
];

export const getScenario = (id: ScenarioId) =>
  SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
