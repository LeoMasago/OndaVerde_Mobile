import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

import { AppText } from './AppText';

interface Props {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Tela rolável com margens, espaçamento e (opcionalmente) "puxar para atualizar". */
export function Screen({ children, onRefresh, refreshing = false, contentStyle }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        { padding: 16, paddingBottom: 40, gap: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <AppText variant="heading" style={{ flexShrink: 1 }}>
        {children}
      </AppText>
      {right}
    </View>
  );
}

/** Indicador numérico com rótulo e legenda curta. */
export function StatTile({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption?: string;
  accent?: string;
}) {
  const { colors, highContrast } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `. ${caption}` : ''}`}
      style={{
        flex: 1,
        minWidth: 140,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: highContrast ? 2 : 1,
        borderColor: colors.border,
        padding: 14,
        gap: 2,
      }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="number" color={accent ?? colors.text}>
        {value}
      </AppText>
      {caption ? (
        <AppText variant="caption" tone="muted">
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}
