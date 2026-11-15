import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDb } from '@/state/DbContext';
import { useTheme } from '@/state/SettingsContext';

function SettingsButton() {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/ajustes')}
      accessibilityRole="button"
      accessibilityLabel="Ajustes e acessibilidade"
      hitSlop={8}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
      <Ionicons name="settings-outline" size={26} color={colors.text} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const { colors, scale } = useTheme();
  const { emergencia } = useDb();
  const insets = useSafeAreaInsets();
  const labelSize = 12 * Math.min(scale, 1.2);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <SettingsButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // ícone de 26 + rótulo + folgas; soma a área segura do aparelho (barra de gestos)
          height: 26 + labelSize * 1.4 + 24 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: labelSize, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          headerTitle: 'OndaVerde',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="cruzamentos"
        options={{
          title: 'Cruzamentos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={26} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="onda-verde"
        options={{
          title: 'Onda Verde',
          tabBarBadge: emergencia ? '!' : undefined,
          tabBarAccessibilityLabel: emergencia ? 'Onda Verde, ambulância em deslocamento' : 'Onda Verde',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={26} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="ocorrencias"
        options={{
          title: 'Ocorrências',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={26} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
