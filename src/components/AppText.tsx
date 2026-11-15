import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyBold'
  | 'label'
  | 'caption'
  | 'number';

const VARIANTS: Record<TextVariant, { size: number; line: number; weight: TextStyle['fontWeight'] }> = {
  display: { size: 30, line: 36, weight: '800' },
  title: { size: 24, line: 30, weight: '800' },
  heading: { size: 18, line: 24, weight: '700' },
  body: { size: 16, line: 23, weight: '400' },
  bodyBold: { size: 16, line: 23, weight: '700' },
  label: { size: 14, line: 20, weight: '600' },
  caption: { size: 13, line: 18, weight: '400' },
  number: { size: 30, line: 34, weight: '800' },
};

export type TextTone =
  | 'text'
  | 'muted'
  | 'primary'
  | 'onPrimary'
  | 'danger'
  | 'onDanger'
  | 'emergency'
  | 'onEmergency';

interface Props extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Cor explícita; tem prioridade sobre `tone`. */
  color?: string;
}

/** Texto do app: aplica tamanho de fonte ajustável (acessibilidade) e cores do tema. */
export function AppText({ variant = 'body', tone = 'text', color, style, ...rest }: Props) {
  const { colors, scale } = useTheme();
  const v = VARIANTS[variant];
  const tones: Record<TextTone, string> = {
    text: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    danger: colors.danger,
    onDanger: colors.onDanger,
    emergency: colors.emergency,
    onEmergency: colors.onEmergency,
  };
  const isHeading = variant === 'display' || variant === 'title' || variant === 'heading';

  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={1.5}
      {...rest}
      style={[
        {
          fontSize: v.size * scale,
          lineHeight: v.line * scale,
          fontWeight: v.weight,
          color: color ?? tones[tone],
        },
        style,
      ]}
    />
  );
}
