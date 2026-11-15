import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ErrorView, LoadingView } from '@/components/StateViews';
import type { EmergencyRoute, Intersection, Weather } from '@/domain/types';
import { useQuery } from '@/hooks/useQuery';
import { getNetwork } from '@/services/api/trafficApi';
import { getWeather } from '@/services/api/weatherApi';

interface NetworkValue {
  intersections: Intersection[];
  byId: Record<string, Intersection>;
  routes: EmergencyRoute[];
  routeById: Record<string, EmergencyRoute>;
  weather: Weather | null;
  reload: () => Promise<void>;
}

const NetworkContext = createContext<NetworkValue | null>(null);

/**
 * Carrega os dados da "central de semáforos" (API mock) e o clima (API real) ao abrir o app.
 * Enquanto carrega mostra uma tela de espera; se falhar, oferece tentar de novo.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const network = useQuery('network', getNetwork);
  const weather = useQuery('weather', getWeather, { refreshMs: 10 * 60_000 });

  const data = network.data;
  const weatherData = weather.data;
  const refetchNetwork = network.refetch;
  const refetchWeather = weather.refetch;

  const value = useMemo<NetworkValue | null>(() => {
    if (!data) return null;
    return {
      intersections: data.intersections,
      byId: Object.fromEntries(data.intersections.map((i) => [i.id, i])),
      routes: data.routes,
      routeById: Object.fromEntries(data.routes.map((r) => [r.id, r])),
      weather: weatherData,
      reload: async () => {
        await Promise.all([refetchNetwork(), refetchWeather()]);
      },
    };
  }, [data, weatherData, refetchNetwork, refetchWeather]);

  if (network.loading) return <LoadingView message="Conectando à central de semáforos…" />;
  if (!value) {
    return (
      <ErrorView
        title="Sem conexão com a central"
        message="Não foi possível carregar os cruzamentos. Verifique sua internet e tente de novo."
        onRetry={refetchNetwork}
      />
    );
  }
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork deve ser usado dentro de <NetworkProvider>');
  return ctx;
}
