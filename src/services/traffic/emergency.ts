/**
 * Simulação da ambulância e da "onda verde".
 *
 * A ambulância é determinística: dado o instante de partida (salvo no banco, igual para todos os celulares),
 * sabemos onde ela está em qualquer momento. Dois cronogramas:
 *  - com onda verde (IA): os semáforos abrem à frente dela, ela não para;
 *  - sem onda verde (ciclo fixo): ela enfrenta fila e para nos vermelhos.
 */
import type { Axis, EmergencyRoute, Intersection, SimContext } from '../../domain/types';
import {
  hourFactor,
  laneOf,
  signalAt,
  WAVE_LEAD,
  WAVE_TAIL,
  type PreemptionWindow,
} from './engine';

const BLOCK_M = 300;
const WAVE_SPEED = 15; // m/s com onda verde (~54 km/h)
const FREE_SPEED = 14; // m/s sem trânsito

export interface Schedule {
  arrive: number[];
  depart: number[];
}

export interface AmbulancePlan {
  route: EmergencyRoute;
  nodes: Intersection[];
  /** Eixo em que a ambulância atravessa cada cruzamento. */
  axes: Axis[];
  wave: Schedule;
  base: Schedule;
  waveTotal: number;
  baseTotal: number;
  savedSec: number;
}

/** Eixo em que a ambulância atravessa cada cruzamento da rota (pelo sentido do próximo trecho). */
export function routeAxes(nodes: Intersection[]): Axis[] {
  return nodes.map((n, i) => {
    const ref = i < nodes.length - 1 ? nodes[i + 1] : nodes[i - 1];
    if (!ref) return 'EW';
    return ref.row === n.row ? 'EW' : 'NS';
  });
}

export function buildAmbulancePlan(
  route: EmergencyRoute,
  byId: Record<string, Intersection>,
  hour: number,
  rain: boolean,
  startSec: number,
): AmbulancePlan {
  const nodes = route.nodes.map((id) => byId[id]).filter(Boolean);
  const axes = routeAxes(nodes);

  // com onda verde: velocidade constante, sem paradas
  const segWave = BLOCK_M / WAVE_SPEED;
  const waveArrive = nodes.map((_, i) => i * segWave);
  const wave: Schedule = { arrive: waveArrive, depart: waveArrive };

  // sem onda verde: trânsito mais lento nos picos e espera pelo verde em cada cruzamento
  const vBase = FREE_SPEED * (1 - 0.45 * hourFactor(hour));
  const segBase = BLOCK_M / vBase;
  const fixedCtx: SimContext = { mode: 'fixed', hour, rain };
  const arrive: number[] = [];
  const depart: number[] = [];
  nodes.forEach((n, i) => {
    const t = i === 0 ? 0 : depart[i - 1] + segBase;
    arrive.push(t);
    let wait = 0;
    while (wait < 120 && laneOf(axes[i], signalAt(n, fixedCtx, startSec + t + wait)) !== 'green') {
      wait += 1;
    }
    depart.push(t + wait);
  });

  const waveTotal = waveArrive[waveArrive.length - 1] ?? 0;
  const baseTotal = depart[depart.length - 1] ?? 0;
  return {
    route,
    nodes,
    axes,
    wave,
    base: { arrive, depart },
    waveTotal,
    baseTotal,
    savedSec: Math.max(0, Math.round(baseTotal - waveTotal)),
  };
}

export function buildPreemptions(plan: AmbulancePlan, startSec: number): PreemptionWindow[] {
  return plan.nodes.map((n, i) => ({
    nodeId: n.id,
    axis: plan.axes[i],
    from: startSec + plan.wave.arrive[i] - WAVE_LEAD,
    to: startSec + plan.wave.arrive[i] + WAVE_TAIL,
  }));
}

export interface AmbulancePosition {
  row: number;
  col: number;
  /** Índice do próximo cruzamento (ou do último, se terminou). */
  nextIndex: number;
  secondsToNext: number;
  waiting: boolean;
  done: boolean;
  /** 0–1 */
  progress: number;
}

export function positionAt(
  plan: AmbulancePlan,
  adaptive: boolean,
  elapsed: number,
): AmbulancePosition {
  const { nodes } = plan;
  const { arrive, depart } = adaptive ? plan.wave : plan.base;
  const last = nodes.length - 1;
  const total = depart[last] ?? 0;
  const at = (i: number) => ({ row: nodes[i].row, col: nodes[i].col });

  if (elapsed >= total) {
    return { ...at(last), nextIndex: last, secondsToNext: 0, waiting: false, done: true, progress: 1 };
  }
  if (elapsed < depart[0]) {
    // ainda no primeiro cruzamento: se já chegou, está esperando o verde (conta até a saída)
    const waiting = elapsed >= arrive[0];
    return {
      ...at(0),
      nextIndex: 0,
      secondsToNext: Math.max(1, Math.ceil((waiting ? depart[0] : arrive[0]) - elapsed)),
      waiting,
      done: false,
      progress: 0,
    };
  }
  for (let i = 0; i < last; i++) {
    if (elapsed >= depart[i] && elapsed < arrive[i + 1]) {
      const f = (elapsed - depart[i]) / (arrive[i + 1] - depart[i]);
      const a = at(i);
      const b = at(i + 1);
      return {
        row: a.row + (b.row - a.row) * f,
        col: a.col + (b.col - a.col) * f,
        nextIndex: i + 1,
        secondsToNext: Math.max(1, Math.ceil(arrive[i + 1] - elapsed)),
        waiting: false,
        done: false,
        progress: (i + f) / last,
      };
    }
    if (elapsed >= arrive[i + 1] && elapsed < depart[i + 1]) {
      return {
        ...at(i + 1),
        nextIndex: i + 1,
        secondsToNext: Math.max(1, Math.ceil(depart[i + 1] - elapsed)),
        waiting: true,
        done: false,
        progress: (i + 1) / last,
      };
    }
  }
  return { ...at(last), nextIndex: last, secondsToNext: 0, waiting: false, done: true, progress: 1 };
}
