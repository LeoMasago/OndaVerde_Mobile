import { View } from 'react-native';

import { SCENARIOS } from '@/domain/network';
import type { SignalMode } from '@/domain/types';
import { useSettings } from '@/state/SettingsContext';

import { AppText } from './AppText';
import { Card } from './Card';
import { Chip, Segmented } from './Chip';

/** Painel para a demonstração: escolher o horário simulado e comparar IA × ciclo fixo. */
export function SimulationPanel() {
  const { settings, update } = useSettings();
  return (
    <Card>
      <AppText variant="heading">Painel da simulação</AppText>
      <AppText variant="caption" tone="muted">
        Tudo no app é simulado. Escolha o horário e compare a IA com o ciclo fixo, como a maioria dos
        semáforos funciona hoje.
      </AppText>

      <AppText variant="label">Como os semáforos funcionam</AppText>
      <Segmented<SignalMode>
        value={settings.mode}
        onChange={(mode) => update({ mode })}
        options={[
          { value: 'adaptive', label: 'IA adaptativa' },
          { value: 'fixed', label: 'Ciclo fixo (hoje)' },
        ]}
      />

      <AppText variant="label" style={{ marginTop: 4 }}>
        Horário simulado
      </AppText>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SCENARIOS.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            selected={settings.scenario === s.id}
            onPress={() => update({ scenario: s.id })}
          />
        ))}
      </View>
    </Card>
  );
}
