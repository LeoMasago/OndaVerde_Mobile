import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'emergency';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Botão grande (altura mínima 52) com rótulo sempre visível. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  accessibilityHint,
  style,
}: Props) {
  const { colors, highContrast } = useTheme();
  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    danger: { bg: colors.danger, fg: colors.onDanger, border: colors.danger },
    emergency: { bg: colors.emergency, fg: colors.onEmergency, border: colors.emergency },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: variant === 'secondary' || highContrast ? 2 : 1,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : icon ? (
          <Icon name={icon} color={palette.fg} />
        ) : null}
        <AppText variant="bodyBold" color={palette.fg}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
