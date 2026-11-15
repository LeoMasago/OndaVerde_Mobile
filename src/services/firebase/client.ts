import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

let cached: Firestore | null = null;

/** Inicializa o Firebase uma única vez (seguro com Fast Refresh) e devolve o Firestore. */
export function getDb(): Firestore {
  if (cached) return cached;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    // Long polling automático evita travamentos do WebChannel em redes móveis / React Native.
    cached = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    // já inicializado (Fast Refresh)
    cached = getFirestore(app);
  }
  return cached;
}
