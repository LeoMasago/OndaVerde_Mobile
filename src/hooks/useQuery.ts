import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** Recarrega sozinho a cada N ms (sem mostrar "carregando"). */
  refreshMs?: number;
}

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  /** true só na primeira carga (ainda sem dados). */
  loading: boolean;
  /** true durante recarregamentos manuais (puxar para atualizar). */
  refreshing: boolean;
  refetch: () => Promise<void>;
}

/**
 * Busca de dados mínima: carrega ao montar e quando `key` muda, mantém os dados anteriores
 * enquanto recarrega e expõe erro para as telas mostrarem "tentar de novo".
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { refreshMs }: Options = {},
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await fetcherRef.current();
        if (!alive) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const id = refreshMs ? setInterval(run, refreshMs) : undefined;
    return () => {
      alive = false;
      if (id) clearInterval(id);
    };
  }, [key, refreshMs, run]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, error, loading, refreshing, refetch };
}
