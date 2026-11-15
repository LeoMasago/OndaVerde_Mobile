import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'primary' | 'emergency' | 'alt';
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({ children, style, tone = 'default', onPress, accessibilityLabel, accessibilityHint }: Props) {
  const { colors, highContrast } = useTheme();
  const backgrounds = {
    default: colors.surface,
    primary: colors.primaryTint,
    emergency: colors.emergencyTint,
    alt: colors.surfaceAlt,
  };
  const base: ViewStyle = {
    backgroundColor: backgrounds[tone],
    borderRadius: 18,
    borderWidth: highContrast ? 2 : 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
