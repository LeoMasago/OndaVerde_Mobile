import { View } from 'react-native';

import type { Lamp } from '@/domain/types';
import { useTheme } from '@/state/SettingsContext';

export const LAMP_LABEL: Record<Lamp, string> = {
  green: 'Verde',
  yellow: 'Amarelo',
  red: 'Vermelho',
};

/** Semáforo desenhado (vermelho, amarelo, verde). A lâmpada ativa brilha; a posição também indica o estado. */
export function TrafficLight({ lamp, size = 30 }: { lamp: Lamp; size?: number }) {
  const { colors } = useTheme();
  const lamps: { id: Lamp; color: string }[] = [
    { id: 'red', color: colors.lampRed },
    { id: 'yellow', color: colors.lampYellow },
    { id: 'green', color: colors.lampGreen },
  ];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: colors.housing,
        borderRadius: size * 0.7,
        paddingVertical: size * 0.28,
        paddingHorizontal: size * 0.22,
        gap: size * 0.2,
        borderWidth: 2,
        borderColor: '#000000',
      }}>
      {lamps.map((l) => {
        const on = l.id === lamp;
        return (
          <View
            key={l.id}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: on ? l.color : colors.lampOff,
              opacity: on ? 1 : 0.35,
              shadowColor: l.color,
              shadowOpacity: on ? 0.9 : 0,
              shadowRadius: on ? 10 : 0,
              shadowOffset: { width: 0, height: 0 },
              elevation: on ? 6 : 0,
              borderWidth: on ? 2 : 0,
              borderColor: 'rgba(255,255,255,0.55)',
            }}
          />
        );
      })}
    </View>
  );
}
