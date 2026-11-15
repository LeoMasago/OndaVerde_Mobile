import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NovaOcorrencia } from '@/domain/types';
import { isFirebaseConfigured } from '@/services/firebase/config';

import { createFirestoreStore } from './firestoreStore';
import { createLocalStore } from './localStore';
import type { DataStore } from './types';

export type { DataStore } from './types';

/** Firestore quando o .env está preenchido; caso contrário, banco local no aparelho. */
export function createStore(): DataStore {
  return isFirebaseConfigured ? createFirestoreStore() : createLocalStore();
}

const DEVICE_KEY = 'ondaverde:deviceId';

/** Identificador anônimo deste aparelho (sem login). Usado para "minhas ocorrências". */
export async function getDeviceId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
  } catch {
    // segue e gera um novo
  }
  const id = `cid-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    await AsyncStorage.setItem(DEVICE_KEY, id);
  } catch {
    // sem persistência: vale só nesta sessão
  }
  return id;
}

const MIN = 60_000;

/** Ocorrências de exemplo, para a demonstração (como se fossem de outros cidadãos). */
const SEED: (Omit<NovaOcorrencia, 'criadaEmMs'> & { minutosAtras: number })[] = [
  {
    tipo: 'semaforo_apagado',
    intersectionId: 'c-1-2',
    intersectionName: 'Rua Augusta × Rua Pamplona',
    descricao: 'Semáforo piscando amarelo desde cedo. Carros passam sem respeitar.',
    minutosAtras: 42,
  },
  {
    tipo: 'espera_longa',
    intersectionId: 'c-0-1',
    intersectionName: 'Av. Paulista × Rua Haddock Lobo',
    descricao: 'Vermelho demorou mais de 2 minutos e não havia carros na transversal.',
    minutosAtras: 95,
  },
  {
    tipo: 'travessia_pedestre',
    intersectionId: 'c-2-0',
    intersectionName: 'Rua da Consolação × Av. Rebouças',
    descricao: 'O verde de pedestres fecha antes de idosos conseguirem atravessar.',
    minutosAtras: 180,
  },
  {
    tipo: 'ambulancia_presa',
    intersectionId: 'c-1-3',
    intersectionName: 'Rua Augusta × Av. Brig. Luís Antônio',
    descricao: 'Ambulância com sirene ligada ficou presa na fila por vários minutos.',
    minutosAtras: 300,
  },
];

export async function seedOcorrencias(store: DataStore) {
  const now = Date.now();
  for (const { minutosAtras, ...item } of SEED) {
    await store.addOcorrencia({ ...item, criadaEmMs: now - minutosAtras * MIN }, 'cidadao-exemplo');
  }
}
