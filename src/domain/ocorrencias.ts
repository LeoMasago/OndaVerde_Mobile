import type { IconName } from '@/components/Icon';

import type { OcorrenciaTipo } from './types';

export interface TipoInfo {
  id: OcorrenciaTipo;
  label: string;
  hint: string;
  icon: IconName;
}

export const OCORRENCIA_TIPOS: TipoInfo[] = [
  {
    id: 'semaforo_apagado',
    label: 'Semáforo apagado',
    hint: 'Sem luz ou piscando amarelo',
    icon: 'flash-off',
  },
  {
    id: 'verde_curto',
    label: 'Verde muito curto',
    hint: 'Passam poucos carros por vez',
    icon: 'timer-outline',
  },
  {
    id: 'espera_longa',
    label: 'Espera longa',
    hint: 'Vermelho demora sem necessidade',
    icon: 'hourglass-outline',
  },
  {
    id: 'ambulancia_presa',
    label: 'Ambulância presa',
    hint: 'Veículo de emergência parado',
    icon: 'medkit',
  },
  {
    id: 'travessia_pedestre',
    label: 'Travessia perigosa',
    hint: 'Pouco tempo para o pedestre',
    icon: 'walk',
  },
  {
    id: 'congestionamento',
    label: 'Congestionamento',
    hint: 'Fila grande no cruzamento',
    icon: 'car',
  },
];

export const TIPO_BY_ID = Object.fromEntries(OCORRENCIA_TIPOS.map((t) => [t.id, t])) as Record<
  OcorrenciaTipo,
  TipoInfo
>;
