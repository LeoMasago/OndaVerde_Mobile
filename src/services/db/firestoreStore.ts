import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';

import type { Emergencia, Ocorrencia, OcorrenciaTipo } from '@/domain/types';
import { getDb } from '@/services/firebase/client';

import type { DataStore } from './types';

const OCORRENCIAS = 'ocorrencias';
const EMERGENCIAS = 'emergencias';
const WRITE_TIMEOUT_MS = 10_000;

/** Escritas no Firestore só resolvem com o servidor; sem internet ficariam pendentes para sempre. */
function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Tempo esgotado. Verifique sua conexão com a internet.')),
      WRITE_TIMEOUT_MS,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

const ESTIMATE: SnapshotOptions = { serverTimestamps: 'estimate' };

function millis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : Date.now();
}

function toOcorrencia(snap: QueryDocumentSnapshot<DocumentData>): Ocorrencia {
  const d = snap.data(ESTIMATE);
  return {
    id: snap.id,
    tipo: d.tipo as OcorrenciaTipo,
    intersectionId: String(d.intersectionId ?? ''),
    intersectionName: String(d.intersectionName ?? ''),
    descricao: String(d.descricao ?? ''),
    status: d.status === 'resolvida' ? 'resolvida' : 'aberta',
    autorId: String(d.autorId ?? ''),
    criadaEm: millis(d.criadaEm),
    confirmadoPor: Array.isArray(d.confirmadoPor) ? (d.confirmadoPor as string[]) : [],
  };
}

function toEmergencia(snap: QueryDocumentSnapshot<DocumentData>): Emergencia {
  const d = snap.data(ESTIMATE);
  return {
    id: snap.id,
    routeId: String(d.routeId ?? ''),
    startedAtMs: typeof d.startedAtMs === 'number' ? d.startedAtMs : Date.now(),
    status: d.status === 'encerrada' ? 'encerrada' : 'ativa',
    autorId: String(d.autorId ?? ''),
  };
}

const asError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

export function createFirestoreStore(): DataStore {
  const db = getDb();

  return {
    kind: 'firestore',

    subscribeOcorrencias(onData, onError) {
      const q = query(collection(db, OCORRENCIAS), orderBy('criadaEm', 'desc'), limit(100));
      return onSnapshot(
        q,
        (snap) => onData(snap.docs.map(toOcorrencia)),
        (e) => onError(asError(e)),
      );
    },

    async addOcorrencia(input, autorId) {
      await withTimeout(
        addDoc(collection(db, OCORRENCIAS), {
          tipo: input.tipo,
          intersectionId: input.intersectionId,
          intersectionName: input.intersectionName,
          descricao: input.descricao,
          status: 'aberta',
          autorId,
          confirmadoPor: [],
          criadaEm: input.criadaEmMs ? Timestamp.fromMillis(input.criadaEmMs) : serverTimestamp(),
        }),
      );
    },

    async confirmarOcorrencia(id, autorId) {
      await withTimeout(
        updateDoc(doc(db, OCORRENCIAS, id), { confirmadoPor: arrayUnion(autorId) }),
      );
    },

    async resolverOcorrencia(id) {
      await withTimeout(updateDoc(doc(db, OCORRENCIAS, id), { status: 'resolvida' }));
    },

    async removerOcorrencia(id) {
      await withTimeout(deleteDoc(doc(db, OCORRENCIAS, id)));
    },

    subscribeEmergencia(onData, onError) {
      // sem orderBy para não exigir índice composto; o app escolhe a mais recente
      const q = query(collection(db, EMERGENCIAS), where('status', '==', 'ativa'), limit(10));
      return onSnapshot(
        q,
        (snap) => onData(snap.docs.map(toEmergencia)),
        (e) => onError(asError(e)),
      );
    },

    async iniciarEmergencia(routeId, autorId) {
      // só uma simulação ativa por vez: encerra as anteriores antes de abrir a nova
      const abertas = await withTimeout(
        getDocs(query(collection(db, EMERGENCIAS), where('status', '==', 'ativa'))),
      );
      if (!abertas.empty) {
        const batch = writeBatch(db);
        abertas.docs.forEach((d) => batch.update(d.ref, { status: 'encerrada' }));
        await withTimeout(batch.commit());
      }
      await withTimeout(
        addDoc(collection(db, EMERGENCIAS), {
          routeId,
          startedAtMs: Date.now(),
          status: 'ativa',
          autorId,
        }),
      );
    },

    async encerrarEmergencia(id) {
      await withTimeout(updateDoc(doc(db, EMERGENCIAS, id), { status: 'encerrada' }));
    },
  };
}
