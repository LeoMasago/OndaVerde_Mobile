/**
 * "CitizenTech Traffic API" (mock).
 *
 * Simula a central de semáforos: cada função devolve uma Promise com latência de rede simulada,
 * como se fosse um GET HTTP. Para trocar por um backend real basta substituir `request()` por um
 * `fetch(`${BASE_URL}${path}`)` — as telas só conhecem as funções exportadas aqui.
 *
 *   GET /network   → cruzamentos e rotas de emergência
 *   GET /overview  → indicadores da cidade e avisos (calculados pelo motor de simulação)
 */
import { INTERSECTIONS, ROUTES } from '@/domain/network';
import type {
  Insight,
  Intersection,
  EmergencyRoute,
  Overview,
  SimContext,
} from '@/domain/types';
import { FIXED_GREEN, levelFor, metricsAt, signalAt } from '@/services/traffic/engine';

const MIN_LATENCY = 350;
const MAX_LATENCY = 800;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, produce: () => T): Promise<T> {
  await wait(MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY));
  if (__DEV__) console.log(`[TrafficAPI] GET ${path}`);
  return produce();
}

export interface NetworkData {
  intersections: Intersection[];
  routes: EmergencyRoute[];
}

export function getNetwork(): Promise<NetworkData> {
  return request('/network', () => ({ intersections: INTERSECTIONS, routes: ROUTES }));
}

const FUEL_L_PER_VEHICLE_HOUR_IDLE = 0.6;
const CO2_KG_PER_LITER = 2.3;

export function getOverview(ctx: SimContext, tSec: number): Promise<Overview> {
  return request('/overview', () => computeOverview(ctx, tSec));
}

function computeOverview(ctx: SimContext, tSec: number): Overview {
  const fixedCtx: SimContext = { ...ctx, mode: 'fixed' };
  const adaptiveCtx: SimContext = { ...ctx, mode: 'adaptive' };

  let vehicles = 0;
  let sumCurrent = 0;
  let sumFixed = 0;
  let sumAdaptive = 0;
  const perNode = INTERSECTIONS.map((inter) => {
    const cur = metricsAt(inter, ctx, tSec);
    const fx = metricsAt(inter, fixedCtx, tSec);
    const ad = metricsAt(inter, adaptiveCtx, tSec);
    const v = cur.demandNS + cur.demandEW;
    vehicles += v;
    sumCurrent += cur.avgDelay * v;
    sumFixed += fx.avgDelay * v;
    sumAdaptive += ad.avgDelay * v;
    return { inter, cur, v };
  });

  const avgDelayCurrent = sumCurrent / vehicles;
  const avgDelayFixed = sumFixed / vehicles;
  const avgDelayAdaptive = sumAdaptive / vehicles;
  const vehiclesPerHour = vehicles * 60;
  const savedVehicleHours = (vehiclesPerHour * Math.max(0, avgDelayFixed - avgDelayAdaptive)) / 3600;
  const fuel = savedVehicleHours * FUEL_L_PER_VEHICLE_HOUR_IDLE;

  const busiest = [...perNode]
    .sort((a, b) => b.cur.avgDelay - a.cur.avgDelay)
    .slice(0, 3)
    .map(({ inter, cur }) => ({
      id: inter.id,
      name: inter.shortName,
      avgDelay: cur.avgDelay,
      level: cur.level,
    }));

  return {
    generatedAt: Date.now(),
    level: levelFor(avgDelayCurrent),
    avgDelayCurrent,
    avgDelayFixed,
    avgDelayAdaptive,
    reductionPct: avgDelayFixed > 0 ? ((avgDelayFixed - avgDelayAdaptive) / avgDelayFixed) * 100 : 0,
    vehiclesPerHour,
    fuelSavedLitersPerHour: fuel,
    co2SavedKgPerHour: fuel * CO2_KG_PER_LITER,
    busiest,
    insights: buildInsights(ctx, tSec, busiest[0]),
  };
}

function buildInsights(
  ctx: SimContext,
  tSec: number,
  worst?: { name: string; avgDelay: number },
): Insight[] {
  const out: Insight[] = [];

  if (ctx.mode === 'fixed') {
    out.push({
      id: 'fixed',
      kind: 'info',
      title: 'Ciclo fixo ativo',
      text: 'Os semáforos usam o mesmo tempo de verde o dia todo, como acontece hoje. Troque para "IA adaptativa" no painel de simulação para ver a diferença.',
    });
  } else {
    // onde a IA mais se afastou da divisão igual do ciclo fixo (27 s para cada rua)
    const changes = INTERSECTIONS.map((inter) => {
      const s = signalAt(inter, ctx, tSec);
      const useEW = s.greenEW >= s.greenNS;
      return {
        inter,
        street: useEW ? inter.streetEW : inter.streetNS,
        green: useEW ? s.greenEW : s.greenNS,
        other: useEW ? s.greenNS : s.greenEW,
      };
    })
      .filter((c) => c.green - c.other >= 8)
      .sort((a, b) => b.green - b.other - (a.green - a.other))
      .slice(0, 2);

    for (const c of changes) {
      out.push({
        id: `ia-${c.inter.id}`,
        kind: 'ia',
        title: `Mais verde na ${c.street}`,
        text: `No cruzamento ${c.inter.shortName} a IA deu ${c.green} s de verde a ela e ${c.other} s à outra rua, porque há mais carros nela agora. No ciclo fixo seriam ${FIXED_GREEN} s para cada uma.`,
      });
    }
    if (ctx.hour < 5) {
      out.push({
        id: 'madrugada',
        kind: 'ia',
        title: 'Ciclos curtos na madrugada',
        text: 'Com pouco movimento, a IA encurta o ciclo para ninguém esperar parado sem necessidade.',
      });
    }
  }

  if (ctx.rain) {
    out.push({
      id: 'chuva',
      kind: 'chuva',
      title: 'Chuva na região',
      text: 'Com chuva o fluxo de carros aumenta. A IA considera isso ao dividir o tempo de verde.',
    });
  }
  if (worst) {
    out.push({
      id: 'carga',
      kind: 'carga',
      title: 'Cruzamento mais carregado',
      text: `${worst.name}: espera média de ${Math.round(worst.avgDelay)} s por veículo agora.`,
    });
  }
  return out;
}
