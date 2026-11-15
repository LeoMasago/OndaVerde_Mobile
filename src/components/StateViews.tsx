import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/state/SettingsContext';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export function LoadingView({ message = 'Carregando…' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
    </View>
  );
}

export function ErrorView({
  title = 'Algo deu errado',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLiveRegion="assertive"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.bg }}>
      <Icon name="cloud-offline" size={48} color={colors.danger} />
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? <Button label="Tentar de novo" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyView({
  icon,
  title,
  message,
  children,
}: {
  icon: IconName;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 12 }}>
      <Icon name={icon} size={44} color={colors.textMuted} />
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText tone="muted" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {children}
    </View>
  );
}

/** Aviso discreto dentro de uma tela (ex.: erro ao carregar só uma parte). */
export function InlineNotice({
  icon = 'information-circle',
  text,
  tone = 'info',
}: {
  icon?: IconName;
  text: string;
  tone?: 'info' | 'error';
}) {
  const { colors } = useTheme();
  const color = tone === 'error' ? colors.danger : colors.textMuted;
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Icon name={icon} size={20} color={color} />
      <AppText variant="caption" style={{ flex: 1 }} color={color}>
        {text}
      </AppText>
    </View>
  );
}
