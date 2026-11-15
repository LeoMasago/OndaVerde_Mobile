import type { Emergencia, NovaOcorrencia, Ocorrencia } from '@/domain/types';

export type Unsubscribe = () => void;

/**
 * Contrato do banco de dados. Há duas implementações:
 *  - Firestore (Firebase), usada quando o .env está configurado;
 *  - local (AsyncStorage), usada como alternativa para o app funcionar sem configuração.
 */
export interface DataStore {
  kind: 'firestore' | 'local';

  subscribeOcorrencias(
    onData: (items: Ocorrencia[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  addOcorrencia(input: NovaOcorrencia, autorId: string): Promise<void>;
  confirmarOcorrencia(id: string, autorId: string): Promise<void>;
  resolverOcorrencia(id: string): Promise<void>;
  removerOcorrencia(id: string): Promise<void>;

  subscribeEmergencia(
    onData: (items: Emergencia[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  iniciarEmergencia(routeId: string, autorId: string): Promise<void>;
  encerrarEmergencia(id: string): Promise<void>;
}
