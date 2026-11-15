import { View } from 'react-native';

import type { FlowLevel } from '@/domain/types';
import { useTheme } from '@/state/SettingsContext';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export const LEVEL_LABEL: Record<FlowLevel, string> = {
  fluido: 'Fluido',
  moderado: 'Moderado',
  intenso: 'Intenso',
};

export const LEVEL_ICON: Record<FlowLevel, IconName> = {
  fluido: 'checkmark-circle',
  moderado: 'alert-circle',
  intenso: 'warning',
};

export const LEVEL_PHRASE: Record<FlowLevel, string> = {
  fluido: 'Trânsito fluindo bem',
  moderado: 'Trânsito com movimento',
  intenso: 'Trânsito pesado',
};

/** Etiqueta do nível de trânsito: cor + ícone + palavra (nunca só cor). */
export function FlowBadge({ level, large }: { level: FlowLevel; large?: boolean }) {
  const { colors } = useTheme();
  const c = colors.level[level];
  return (
    <View
      accessible
      accessibilityLabel={`Trânsito ${LEVEL_LABEL[level].toLowerCase()}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: c.tint,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: c.solid,
        paddingVertical: large ? 8 : 4,
        paddingHorizontal: large ? 14 : 10,
      }}>
      <Icon name={LEVEL_ICON[level]} size={large ? 22 : 16} color={c.solid} />
      <AppText variant={large ? 'bodyBold' : 'label'} color={c.text}>
        {LEVEL_LABEL[level]}
      </AppText>
    </View>
  );
}
