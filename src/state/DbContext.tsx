import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Emergencia, NovaOcorrencia, Ocorrencia } from '@/domain/types';
import { createStore, getDeviceId, seedOcorrencias, type DataStore } from '@/services/db';
import { createLocalStore } from '@/services/db/localStore';

type Status = 'loading' | 'ready' | 'error';

interface DbValue {
  storeKind: DataStore['kind'];
  deviceId: string;
  ocorrencias: Ocorrencia[];
  ocorrenciasStatus: Status;
  ocorrenciasError: Error | null;
  retryOcorrencias: () => void;
  /** Emergência (ambulância simulada) mais recente e ainda ativa, se houver. */
  emergencia: Emergencia | null;
  addOcorrencia: (input: NovaOcorrencia) => Promise<void>;
  confirmarOcorrencia: (id: string) => Promise<void>;
  resolverOcorrencia: (id: string) => Promise<void>;
  removerOcorrencia: (id: string) => Promise<void>;
  iniciarEmergencia: (routeId: string) => Promise<void>;
  encerrarEmergencia: (id: string) => Promise<void>;
  carregarExemplos: () => Promise<void>;
}

const DbContext = createContext<DbValue | null>(null);

function initStore(): DataStore {
  try {
    return createStore();
  } catch {
    // Firebase mal configurado: o app continua funcionando com o banco local
    return createLocalStore();
  }
}

export function DbProvider({ children }: { children: ReactNode }) {
  const [store] = useState(initStore);
  const [deviceId, setDeviceId] = useState('anon');
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);

  useEffect(() => {
    let alive = true;
    getDeviceId().then((id) => alive && setDeviceId(id));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return store.subscribeOcorrencias(
      (items) => {
        setOcorrencias(items);
        setStatus('ready');
        setError(null);
      },
      (e) => {
        if (__DEV__) console.warn('[Banco] erro ao ler ocorrências:', e.name, e.message);
        setError(e);
        setStatus('error');
      },
    );
  }, [store, retryKey]);

  useEffect(() => {
    return store.subscribeEmergencia(setEmergencias, () => {});
  }, [store, retryKey]);

  const retryOcorrencias = useCallback(() => {
    setStatus('loading');
    setRetryKey((k) => k + 1);
  }, []);

  const emergencia = useMemo(() => {
    const ativas = emergencias.filter((e) => e.status === 'ativa');
    return ativas.sort((a, b) => b.startedAtMs - a.startedAtMs)[0] ?? null;
  }, [emergencias]);

  const value = useMemo<DbValue>(
    () => ({
      storeKind: store.kind,
      deviceId,
      ocorrencias,
      ocorrenciasStatus: status,
      ocorrenciasError: error,
      retryOcorrencias,
      emergencia,
      addOcorrencia: (input) => store.addOcorrencia(input, deviceId),
      confirmarOcorrencia: (id) => store.confirmarOcorrencia(id, deviceId),
      resolverOcorrencia: (id) => store.resolverOcorrencia(id),
      removerOcorrencia: (id) => store.removerOcorrencia(id),
      iniciarEmergencia: (routeId) => store.iniciarEmergencia(routeId, deviceId),
      encerrarEmergencia: (id) => store.encerrarEmergencia(id),
      carregarExemplos: () => seedOcorrencias(store),
    }),
    [store, deviceId, ocorrencias, status, error, retryOcorrencias, emergencia],
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbValue {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb deve ser usado dentro de <DbProvider>');
  return ctx;
}
