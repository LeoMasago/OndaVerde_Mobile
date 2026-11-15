/** Tipos centrais do domínio do OndaVerde (CitizenTech · semáforos adaptativos). */

/** Eixo da via: NS = norte-sul (ruas verticais no mapa), EW = leste-oeste (ruas horizontais). */
export type Axis = 'NS' | 'EW';
export type Lamp = 'green' | 'yellow' | 'red';
export type FlowLevel = 'fluido' | 'moderado' | 'intenso';

/** adaptive = IA decide os tempos; fixed = ciclo fixo, como a maioria dos semáforos funciona hoje. */
export type SignalMode = 'adaptive' | 'fixed';
export type ScenarioId = 'agora' | 'madrugada' | 'pico-manha' | 'tarde' | 'pico-noite';

export interface Intersection {
  id: string;
  index: number;
  name: string;
  shortName: string;
  streetEW: string;
  streetNS: string;
  row: number;
  col: number;
  /** Fluxo no horário de pico, em veículos por minuto, em cada eixo. */
  peakNS: number;
  peakEW: number;
}

export interface EmergencyRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  /** IDs dos cruzamentos, em ordem, por onde a ambulância passa. */
  nodes: string[];
}

/** Contexto da simulação: tudo o que influencia o que os semáforos fazem. */
export interface SimContext {
  mode: SignalMode;
  /** Hora do dia simulada (0–24, fracionada). */
  hour: number;
  rain: boolean;
}

export interface SignalState {
  cycle: number;
  greenNS: number;
  greenEW: number;
  lampNS: Lamp;
  lampEW: Lamp;
  /** Segundos até a lâmpada do eixo mudar de cor. */
  changeNS: number;
  changeEW: number;
  /** Eixo aberto à força por uma onda verde, se houver. */
  preempted: Axis | null;
}

export interface Metrics {
  demandNS: number;
  demandEW: number;
  delayNS: number;
  delayEW: number;
  /** Espera média por veículo, em segundos. */
  avgDelay: number;
  level: FlowLevel;
}

export interface Weather {
  source: 'open-meteo' | 'mock';
  temperature: number;
  description: string;
  isRaining: boolean;
}

export interface Insight {
  id: string;
  kind: 'ia' | 'chuva' | 'carga' | 'info';
  title: string;
  text: string;
}

export interface Overview {
  generatedAt: number;
  level: FlowLevel;
  avgDelayCurrent: number;
  avgDelayFixed: number;
  avgDelayAdaptive: number;
  /** Redução percentual de espera da IA em relação ao ciclo fixo. */
  reductionPct: number;
  vehiclesPerHour: number;
  fuelSavedLitersPerHour: number;
  co2SavedKgPerHour: number;
  busiest: { id: string; name: string; avgDelay: number; level: FlowLevel }[];
  insights: Insight[];
}

/* ------------------------------ Ocorrências ------------------------------ */

export type OcorrenciaTipo =
  | 'semaforo_apagado'
  | 'verde_curto'
  | 'espera_longa'
  | 'ambulancia_presa'
  | 'travessia_pedestre'
  | 'congestionamento';

export type OcorrenciaStatus = 'aberta' | 'resolvida';

export interface Ocorrencia {
  id: string;
  tipo: OcorrenciaTipo;
  intersectionId: string;
  intersectionName: string;
  descricao: string;
  status: OcorrenciaStatus;
  autorId: string;
  criadaEm: number;
  confirmadoPor: string[];
}

export interface NovaOcorrencia {
  tipo: OcorrenciaTipo;
  intersectionId: string;
  intersectionName: string;
  descricao: string;
  /** Apenas para dados de exemplo: força a data de criação. */
  criadaEmMs?: number;
}

export interface Emergencia {
  id: string;
  routeId: string;
  startedAtMs: number;
  status: 'ativa' | 'encerrada';
  autorId: string;
}
