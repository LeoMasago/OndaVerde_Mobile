/**
 * Motor de simulação dos semáforos (a "IA" do projeto, simulada em software).
 *
 * Tudo aqui são funções puras: dados o cruzamento, o contexto (modo, hora, chuva) e o instante,
 * o resultado é sempre o mesmo. Por isso qualquer celular mostra o mesmo semáforo ao mesmo tempo,
 * sem precisar de servidor.
 *
 * Modelo:
 *  - Fluxo de veículos por eixo = pico × curva do dia × tendência direcional × variação lenta × chuva.
 *  - Ciclo fixo: 60 s, verde de 27 s para cada eixo (igual o dia inteiro, como a maioria dos semáforos hoje).
 *  - IA adaptativa: a cada ciclo divide o verde em proporção ao fluxo de cada eixo, encurta o ciclo de
 *    madrugada e sincroniza (defasa) cruzamentos vizinhos nas avenidas leste-oeste.
 *  - Espera média por veículo: fórmula clássica de atraso de semáforo (Webster / HCM).
 */
import type {
  Axis,
  FlowLevel,
  Intersection,
  Lamp,
  Metrics,
  SignalMode,
  SignalState,
  SimContext,
} from '../../domain/types';

export const YELLOW = 3;
export const LOST_PER_CYCLE = YELLOW * 2;
export const FIXED_CYCLE = 60;
export const FIXED_GREEN = (FIXED_CYCLE - LOST_PER_CYCLE) / 2;
export const MIN_GREEN = 12;
/** Veículos por hora que escoam durante o verde (dois faixas por sentido). */
export const SAT_FLOW_H = 3000;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const gauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));

/** Intensidade geral do trânsito ao longo do dia (0.1 na madrugada → 1 nos picos de 8h e 18h). */
export function hourFactor(hour: number): number {
  const peaks = Math.max(gauss(hour, 8, 1.6), gauss(hour, 18, 1.9));
  return Math.min(1, 0.1 + 0.9 * peaks + 0.4 * gauss(hour, 13, 3));
}

/** De manhã o fluxo pesa mais no eixo norte-sul (entrada); à tarde, no leste-oeste (saída). */
function tilt(hour: number, axis: Axis): number {
  const am = gauss(hour, 8, 2);
  const pm = gauss(hour, 18, 2);
  return axis === 'NS' ? 1 + 0.2 * am - 0.1 * pm : 1 - 0.1 * am + 0.2 * pm;
}

/** Variação lenta e determinística (±~15%) para o trânsito não ser perfeitamente estável. */
function jitter(index: number, axis: Axis, tSec: number): number {
  const p = index * 1.7 + (axis === 'NS' ? 0 : 2.3);
  return 1 + 0.12 * Math.sin(tSec / 41 + p) + 0.06 * Math.sin(tSec / 13 + p * 2.1);
}

/** Fluxo de veículos (veículos/minuto) em um eixo, no instante tSec. */
export function demandAt(inter: Intersection, axis: Axis, ctx: SimContext, tSec: number): number {
  const peak = axis === 'NS' ? inter.peakNS : inter.peakEW;
  const rain = ctx.rain ? 1.1 : 1;
  return peak * hourFactor(ctx.hour) * tilt(ctx.hour, axis) * jitter(inter.index, axis, tSec) * rain;
}

export function cycleFor(mode: SignalMode, hour: number): number {
  if (mode === 'fixed') return FIXED_CYCLE;
  return hourFactor(hour) >= 0.3 ? 50 : 40;
}

/**
 * Defasagem do início do ciclo. Na IA, cruzamentos vizinhos nas avenidas leste-oeste abrem em sequência
 * (22 s por quarteirão, ~50 km/h). No ciclo fixo cada cruzamento tem a sua, sem coordenação.
 */
export function offsetFor(inter: Intersection, mode: SignalMode, cycle: number): number {
  return mode === 'adaptive' ? (inter.col * 22) % cycle : (inter.index * 23 + 7) % cycle;
}

interface CyclePlan {
  cycle: number;
  tStart: number;
  greenNS: number;
  greenEW: number;
}

function planAt(inter: Intersection, ctx: SimContext, tSec: number): CyclePlan {
  const cycle = cycleFor(ctx.mode, ctx.hour);
  const off = offsetFor(inter, ctx.mode, cycle);
  const k = Math.floor((tSec - off) / cycle);
  const tStart = off + k * cycle;

  if (ctx.mode === 'fixed') {
    return { cycle, tStart, greenNS: FIXED_GREEN, greenEW: FIXED_GREEN };
  }
  const budget = cycle - LOST_PER_CYCLE;
  const dNS = demandAt(inter, 'NS', ctx, tStart);
  const dEW = demandAt(inter, 'EW', ctx, tStart);
  const greenNS = Math.round(clamp((budget * dNS) / (dNS + dEW), MIN_GREEN, budget - MIN_GREEN));
  return { cycle, tStart, greenNS, greenEW: budget - greenNS };
}

/** Estado das lâmpadas do cruzamento no instante tSec (sem considerar onda verde). */
export function signalAt(inter: Intersection, ctx: SimContext, tSec: number): SignalState {
  const { cycle, tStart, greenNS, greenEW } = planAt(inter, ctx, tSec);
  const pos = tSec - tStart;
  const nsEnd = greenNS;
  const nsYellowEnd = greenNS + YELLOW;
  const ewEnd = nsYellowEnd + greenEW;

  let lampNS: Lamp;
  let lampEW: Lamp;
  let changeNS: number;
  let changeEW: number;
  if (pos < nsEnd) {
    lampNS = 'green';
    changeNS = nsEnd - pos;
    lampEW = 'red';
    changeEW = nsYellowEnd - pos;
  } else if (pos < nsYellowEnd) {
    lampNS = 'yellow';
    changeNS = nsYellowEnd - pos;
    lampEW = 'red';
    changeEW = nsYellowEnd - pos;
  } else if (pos < ewEnd) {
    lampNS = 'red';
    changeNS = cycle - pos;
    lampEW = 'green';
    changeEW = ewEnd - pos;
  } else {
    lampNS = 'red';
    changeNS = cycle - pos;
    lampEW = 'yellow';
    changeEW = cycle - pos;
  }
  return {
    cycle,
    greenNS,
    greenEW,
    lampNS,
    lampEW,
    changeNS: Math.max(1, Math.ceil(changeNS)),
    changeEW: Math.max(1, Math.ceil(changeEW)),
    preempted: null,
  };
}

/** Espera média (s) por veículo em um eixo: atraso uniforme (Webster) + atraso por saturação (HCM). */
export function axisDelay(demandVehMin: number, green: number, cycle: number): number {
  const lambda = green / cycle;
  const capacity = SAT_FLOW_H * lambda;
  if (capacity <= 0) return 180;
  const x = (demandVehMin * 60) / capacity;
  const d1 = (0.5 * cycle * (1 - lambda) ** 2) / (1 - Math.min(1, x) * lambda);
  const T = 0.25;
  const d2 = 900 * T * (x - 1 + Math.sqrt((x - 1) ** 2 + (8 * 0.5 * x) / (capacity * T)));
  return Math.min(180, d1 + d2);
}

export function levelFor(avgDelay: number): FlowLevel {
  if (avgDelay <= 12) return 'fluido';
  if (avgDelay <= 22) return 'moderado';
  return 'intenso';
}

export function metricsAt(inter: Intersection, ctx: SimContext, tSec: number): Metrics {
  const { cycle, greenNS, greenEW } = planAt(inter, ctx, tSec);
  const demandNS = demandAt(inter, 'NS', ctx, tSec);
  const demandEW = demandAt(inter, 'EW', ctx, tSec);
  const delayNS = axisDelay(demandNS, greenNS, cycle);
  const delayEW = axisDelay(demandEW, greenEW, cycle);
  const avgDelay = (demandNS * delayNS + demandEW * delayEW) / (demandNS + demandEW);
  return { demandNS, demandEW, delayNS, delayEW, avgDelay, level: levelFor(avgDelay) };
}

export const laneOf = (axis: Axis, s: SignalState): Lamp => (axis === 'NS' ? s.lampNS : s.lampEW);

/* --------------------------- Onda verde (prioridade) --------------------------- */

export interface PreemptionWindow {
  nodeId: string;
  axis: Axis;
  /** Instantes absolutos, em segundos. */
  from: number;
  to: number;
}

/** Quanto tempo antes de a ambulância chegar o semáforo começa a abrir. */
export const WAVE_LEAD = 12;
export const WAVE_TAIL = 5;
const CLEARANCE = 3;

/** Aplica a prioridade de ambulância sobre o estado normal do semáforo. */
export function applyPreemption(
  base: SignalState,
  windows: PreemptionWindow[],
  nodeId: string,
  tSec: number,
): SignalState {
  const w = windows.find((x) => x.nodeId === nodeId && tSec >= x.from && tSec <= x.to);
  if (!w) return base;

  const travel: 'lampNS' | 'lampEW' = w.axis === 'NS' ? 'lampNS' : 'lampEW';
  const other: 'lampNS' | 'lampEW' = w.axis === 'NS' ? 'lampEW' : 'lampNS';
  const remaining = Math.max(1, Math.ceil(w.to - tSec));
  const next: SignalState = { ...base, preempted: w.axis };

  if (tSec < w.from + CLEARANCE) {
    // fase de limpeza: o eixo cruzado leva amarelo antes de fechar
    next[travel] = base[travel] === 'green' ? 'green' : 'red';
    next[other] = base[other] === 'green' ? 'yellow' : base[other] === 'yellow' ? 'yellow' : 'red';
  } else {
    next[travel] = 'green';
    next[other] = 'red';
  }
  const changeTravel = w.axis === 'NS' ? 'changeNS' : 'changeEW';
  const changeOther = w.axis === 'NS' ? 'changeEW' : 'changeNS';
  next[changeTravel] = remaining;
  next[changeOther] = remaining;
  return next;
}
