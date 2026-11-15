import { Pressable, View } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Papel para leitores de tela: opção única (radio) ou aba. */
  role?: 'radio' | 'tab' | 'button';
}

/** Opção selecionável. O estado "selecionado" aparece por cor, borda e ícone de marcação. */
export function Chip({ label, selected, onPress, icon, role = 'radio' }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: role === 'radio' ? selected : undefined }}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryTint : colors.surface,
        opacity: pressed ? 0.85 : 1,
        justifyContent: 'center',
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {selected ? (
          <Icon name="checkmark-circle" size={18} color={colors.primary} />
        ) : icon ? (
          <Icon name={icon} size={18} color={colors.textMuted} />
        ) : null}
        <AppText variant="label" tone={selected ? 'primary' : 'text'}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Alternador de duas ou três visões (ex.: Mapa | Lista). */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { colors, highContrast } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: 14,
        padding: 4,
        gap: 4,
        borderWidth: highContrast ? 2 : 0,
        borderColor: colors.border,
      }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colors.surface : 'transparent',
              borderWidth: selected ? 2 : 0,
              borderColor: selected ? colors.primary : 'transparent',
            }}>
            <AppText variant="label" tone={selected ? 'primary' : 'muted'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
