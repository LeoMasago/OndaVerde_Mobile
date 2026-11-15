import { useMemo } from 'react';

import { getScenario } from '@/domain/network';
import type { Intersection, Metrics, SignalState, SimContext } from '@/domain/types';
import {
  buildAmbulancePlan,
  buildPreemptions,
  positionAt,
  type AmbulancePlan,
  type AmbulancePosition,
} from '@/services/traffic/emergency';
import {
  applyPreemption,
  metricsAt,
  signalAt,
  type PreemptionWindow,
} from '@/services/traffic/engine';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useSettings } from '@/state/SettingsContext';

import { useNow } from './useNow';

export interface NodeState {
  inter: Intersection;
  signal: SignalState;
  metrics: Metrics;
}

export interface AmbulanceInfo {
  routeId: string;
  plan: AmbulancePlan;
  position: AmbulancePosition;
  elapsed: number;
  /** A ambulância já chegou ao destino (no modo atual). */
  done: boolean;
  /** Quem iniciou a simulação neste aparelho. */
  mine: boolean;
  docId: string;
}

const NO_WINDOWS: PreemptionWindow[] = [];

/** Simulações antigas esquecidas "ativas" no banco deixam de aparecer depois disso (segundos). */
const STALE_AFTER = 90;

function clockHour(now: number) {
  const d = new Date(now);
  return Math.floor((d.getHours() + d.getMinutes() / 60) * 4) / 4;
}

/**
 * Estado ao vivo da rede de semáforos: contexto da simulação (modo, hora, chuva), lâmpadas e métricas
 * de cada cruzamento a cada tick, e a ambulância (compartilhada pelo banco) com a onda verde aplicada.
 */
export function useTraffic(tickMs = 1000) {
  const { intersections, byId, routeById, weather } = useNetwork();
  const { settings } = useSettings();
  const { emergencia, deviceId } = useDb();
  const now = useNow(tickMs);

  const scenario = getScenario(settings.scenario);
  const hour = scenario.hour ?? clockHour(now);
  const rain = weather?.isRaining ?? false;
  const ctx = useMemo<SimContext>(
    () => ({ mode: settings.mode, hour, rain }),
    [settings.mode, hour, rain],
  );
  const tSec = now / 1000;

  const base = useMemo(() => {
    if (!emergencia) return null;
    const route = routeById[emergencia.routeId];
    if (!route) return null;
    const startSec = emergencia.startedAtMs / 1000;
    const plan = buildAmbulancePlan(route, byId, hour, rain, startSec);
    return { doc: emergencia, plan, startSec, windows: buildPreemptions(plan, startSec) };
  }, [emergencia, routeById, byId, hour, rain]);

  const adaptive = ctx.mode === 'adaptive';

  const ambulance = useMemo<AmbulanceInfo | null>(() => {
    if (!base) return null;
    const elapsed = tSec - base.startSec;
    const total = Math.max(base.plan.waveTotal, base.plan.baseTotal);
    if (elapsed < -2 || elapsed > total + STALE_AFTER) return null;
    const position = positionAt(base.plan, adaptive, Math.max(0, elapsed));
    return {
      routeId: base.plan.route.id,
      plan: base.plan,
      position,
      elapsed,
      done: position.done,
      mine: base.doc.autorId === deviceId,
      docId: base.doc.id,
    };
  }, [base, tSec, adaptive, deviceId]);

  const windows = adaptive && base && ambulance && !ambulance.done ? base.windows : NO_WINDOWS;

  const states = useMemo<NodeState[]>(
    () =>
      intersections.map((inter) => {
        const raw = signalAt(inter, ctx, tSec);
        const signal = windows.length ? applyPreemption(raw, windows, inter.id, tSec) : raw;
        return { inter, signal, metrics: metricsAt(inter, ctx, tSec) };
      }),
    [intersections, ctx, tSec, windows],
  );

  const stateById = useMemo(
    () => Object.fromEntries(states.map((s) => [s.inter.id, s])) as Record<string, NodeState>,
    [states],
  );

  return { ctx, now, tSec, states, stateById, ambulance, weather };
}
