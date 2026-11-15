import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DbProvider } from '@/state/DbContext';
import { NetworkProvider } from '@/state/NetworkContext';
import { SettingsProvider, useTheme } from '@/state/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <NetworkProvider>
        <DbProvider>
          <ThemedStack />
        </DbProvider>
      </NetworkProvider>
    </SettingsProvider>
  );
}

function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cruzamento/[id]" options={{ title: 'Cruzamento' }} />
        <Stack.Screen
          name="ocorrencia/nova"
          options={{ title: 'Registrar ocorrência', presentation: 'modal' }}
        />
        <Stack.Screen name="ocorrencia/[id]" options={{ title: 'Ocorrência' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes e sobre' }} />
      </Stack>
    </>
  );
}
