import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Emergencia, Ocorrencia } from '@/domain/types';

import type { DataStore } from './types';

const KEY_OCORRENCIAS = 'ondaverde:ocorrencias';
const KEY_EMERGENCIAS = 'ondaverde:emergencias';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Banco local (AsyncStorage), usado quando o Firebase ainda não foi configurado.
 * Mantém a mesma interface do Firestore, inclusive com assinaturas em "tempo real".
 */
export function createLocalStore(): DataStore {
  let ocorrencias: Ocorrencia[] | null = null;
  let emergencias: Emergencia[] | null = null;
  const ocListeners = new Set<(items: Ocorrencia[]) => void>();
  const emListeners = new Set<(items: Emergencia[]) => void>();

  const ensureOc = async () => (ocorrencias ??= await load<Ocorrencia>(KEY_OCORRENCIAS));
  const ensureEm = async () => (emergencias ??= await load<Emergencia>(KEY_EMERGENCIAS));

  const sortedOc = (list: Ocorrencia[]) => [...list].sort((a, b) => b.criadaEm - a.criadaEm);

  const saveOc = async (list: Ocorrencia[]) => {
    ocorrencias = list;
    await AsyncStorage.setItem(KEY_OCORRENCIAS, JSON.stringify(list));
    ocListeners.forEach((cb) => cb(sortedOc(list)));
  };
  const saveEm = async (list: Emergencia[]) => {
    emergencias = list;
    await AsyncStorage.setItem(KEY_EMERGENCIAS, JSON.stringify(list));
    emListeners.forEach((cb) => cb(list.filter((e) => e.status === 'ativa')));
  };

  return {
    kind: 'local',

    subscribeOcorrencias(onData, onError) {
      ocListeners.add(onData);
      ensureOc().then((list) => onData(sortedOc(list)), onError);
      return () => ocListeners.delete(onData);
    },

    async addOcorrencia(input, autorId) {
      const list = await ensureOc();
      await saveOc([
        ...list,
        {
          id: newId(),
          tipo: input.tipo,
          intersectionId: input.intersectionId,
          intersectionName: input.intersectionName,
          descricao: input.descricao,
          status: 'aberta',
          autorId,
          confirmadoPor: [],
          criadaEm: input.criadaEmMs ?? Date.now(),
        },
      ]);
    },

    async confirmarOcorrencia(id, autorId) {
      const list = await ensureOc();
      await saveOc(
        list.map((o) =>
          o.id === id && !o.confirmadoPor.includes(autorId)
            ? { ...o, confirmadoPor: [...o.confirmadoPor, autorId] }
            : o,
        ),
      );
    },

    async resolverOcorrencia(id) {
      const list = await ensureOc();
      await saveOc(list.map((o) => (o.id === id ? { ...o, status: 'resolvida' as const } : o)));
    },

    async removerOcorrencia(id) {
      const list = await ensureOc();
      await saveOc(list.filter((o) => o.id !== id));
    },

    subscribeEmergencia(onData, onError) {
      emListeners.add(onData);
      ensureEm().then((list) => onData(list.filter((e) => e.status === 'ativa')), onError);
      return () => emListeners.delete(onData);
    },

    async iniciarEmergencia(routeId, autorId) {
      const list = await ensureEm();
      const closed = list.map((e) => ({ ...e, status: 'encerrada' as const }));
      await saveEm([...closed, { id: newId(), routeId, startedAtMs: Date.now(), status: 'ativa', autorId }]);
    },

    async encerrarEmergencia(id) {
      const list = await ensureEm();
      await saveEm(list.map((e) => (e.id === id ? { ...e, status: 'encerrada' as const } : e)));
    },
  };
}
