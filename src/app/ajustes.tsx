import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen, SectionTitle } from '@/components/Screen';
import { InlineNotice } from '@/components/StateViews';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useSettings, useTheme, type TextSize } from '@/state/SettingsContext';

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'grande', label: 'Grande' },
  { value: 'enorme', label: 'Muito grande' },
];

export default function AjustesScreen() {
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const { storeKind, carregarExemplos } = useDb();
  const { weather } = useNetwork();
  const [seeded, setSeeded] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const seed = async () => {
    setSeeded('busy');
    try {
      await carregarExemplos();
      setSeeded('done');
    } catch {
      setSeeded('error');
    }
  };

  return (
    <Screen>
      <SectionTitle>Acessibilidade</SectionTitle>
      <Card>
        <AppText variant="bodyBold">Tamanho do texto</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SIZES.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              selected={settings.textSize === s.value}
              onPress={() => update({ textSize: s.value })}
            />
          ))}
        </View>
        <AppText variant="caption" tone="muted">
          Soma-se ao tamanho de fonte configurado no seu celular.
        </AppText>

        <View style={{ height: 1, backgroundColor: colors.border }} />
        <ToggleRow
          title="Alto contraste"
          description="Cores mais fortes e bordas reforçadas."
          value={settings.highContrast}
          onChange={(v) => update({ highContrast: v })}
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <ToggleRow
          title="Reduzir animações"
          description="A ambulância no mapa salta de um ponto ao outro, sem deslizar."
          value={settings.reduceMotion}
          onChange={(v) => update({ reduceMotion: v })}
        />
      </Card>

      <SectionTitle>De onde vêm os dados</SectionTitle>
      <Card>
        <Source
          label="Semáforos e rotas"
          value="API mock da central (simulada)"
        />
        <Source
          label="Clima"
          value={weather?.source === 'open-meteo' ? 'Open-Meteo (API real)' : 'Valor de exemplo (sem internet)'}
        />
        <Source
          label="Ocorrências e ambulância"
          value={storeKind === 'firestore' ? 'Firebase Firestore (nuvem)' : 'Banco local no aparelho'}
        />
        {storeKind === 'local' ? (
          <InlineNotice
            text="O Firebase não está configurado, então os dados ficam só neste aparelho. Veja o README para ligar o Firestore."
          />
        ) : null}
        <Button
          label="Carregar ocorrências de exemplo"
          variant="secondary"
          icon="download"
          loading={seeded === 'busy'}
          onPress={seed}
        />
        {seeded === 'done' ? (
          <InlineNotice icon="checkmark-circle" text="Quatro ocorrências de exemplo foram adicionadas." />
        ) : null}
        {seeded === 'error' ? (
          <InlineNotice tone="error" icon="alert-circle" text="Não foi possível adicionar os exemplos." />
        ) : null}
      </Card>

      <SectionTitle>Sobre o OndaVerde</SectionTitle>
      <Card>
        <AppText>
          O OndaVerde é a porta de entrada da CitizenTech para o cidadão: aqui você consulta como estão
          os semáforos inteligentes, registra problemas e acompanha a onda verde das ambulâncias.
        </AppText>
        <AppText variant="bodyBold">Projeto demonstrativo, todo simulado em software.</AppText>
        <AppText variant="caption" tone="muted">
          Não há semáforos, câmeras, trânsito nem ambulâncias reais. Os cruzamentos formam uma rede
          fictícia inspirada na região da Av. Paulista. Global Solution FIAP 2026.2 · CitizenTech.
        </AppText>
        <AppText variant="caption" tone="muted">
          Versão {Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </Card>
    </Screen>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </Pressable>
  );
}

function Source({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ gap: 2 }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
