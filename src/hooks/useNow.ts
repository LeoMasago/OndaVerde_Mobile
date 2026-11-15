import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * Relógio que atualiza a cada `intervalMs`. Pausa quando a tela não está em foco,
 * já que as abas ficam montadas em segundo plano.
 */
export function useNow(intervalMs = 1000): number {
  const focused = useIsFocused();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!focused) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [focused, intervalMs]);

  return now;
}
