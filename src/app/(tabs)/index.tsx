import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlowBadge, LEVEL_PHRASE } from '@/components/FlowBadge';
import { Icon, type IconName } from '@/components/Icon';
import { Screen, SectionTitle, StatTile } from '@/components/Screen';
import { SimulationPanel } from '@/components/SimulationPanel';
import { InlineNotice } from '@/components/StateViews';
import { getScenario } from '@/domain/network';
import { TIPO_BY_ID } from '@/domain/ocorrencias';
import type { Insight } from '@/domain/types';
import { useQuery } from '@/hooks/useQuery';
import { useTraffic } from '@/hooks/useTraffic';
import { getOverview } from '@/services/api/trafficApi';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useSettings, useTheme } from '@/state/SettingsContext';
import { formatClock, timeAgo } from '@/utils/format';

const INSIGHT_ICON: Record<Insight['kind'], IconName> = {
  ia: 'sparkles',
  chuva: 'rainy',
  carga: 'car',
  info: 'information-circle',
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { reload, routeById } = useNetwork();
  const { ocorrencias, deviceId } = useDb();
  const { ctx, now, ambulance, weather } = useTraffic(1000);

  const overview = useQuery(
    `overview:${ctx.mode}:${ctx.hour}:${ctx.rain}`,
    () => getOverview(ctx, Date.now() / 1000),
    { refreshMs: 15_000 },
  );
  const data = overview.data;
  const scenario = getScenario(settings.scenario);

  const refresh = async () => {
    await Promise.all([overview.refetch(), reload()]);
  };

  const recentOthers = ocorrencias
    .filter((o) => o.autorId !== deviceId && o.status === 'aberta')
    .slice(0, 2);
  const running = ambulance && !ambulance.done ? ambulance : null;

  return (
    <Screen onRefresh={refresh} refreshing={overview.refreshing}>
      {/* Situação agora */}
      <Card>
        <AppText variant="label" tone="muted">
          Região da Av. Paulista · simulação
        </AppText>
        <AppText variant="title">{data ? LEVEL_PHRASE[data.level] : 'Carregando trânsito…'}</AppText>
        {data ? (
          <>
            <FlowBadge level={data.level} large />
            <AppText>
              Espera média nos cruzamentos:{' '}
              <AppText variant="bodyBold">{Math.round(data.avgDelayCurrent)} segundos</AppText> por
              veículo.
            </AppText>
          </>
        ) : overview.error ? (
          <InlineNotice
            tone="error"
            icon="cloud-offline"
            text="Não foi possível atualizar os indicadores. Puxe a tela para baixo para tentar de novo."
          />
        ) : null}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <AppText variant="caption" tone="muted">
          {scenario.id === 'agora' ? `Agora, ${formatClock(ctx.hour)}` : scenario.description} ·{' '}
          {settings.mode === 'adaptive' ? 'IA adaptativa' : 'ciclo fixo'}
        </AppText>
        {weather ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={weather.isRaining ? 'rainy' : 'partly-sunny'} size={20} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
              {weather.temperature}°C · {weather.description}
              {weather.source === 'mock' ? ' (exemplo, sem internet)' : ''}
              {weather.isRaining ? ' — a IA considera a chuva nos tempos de verde' : ''}
            </AppText>
          </View>
        ) : null}
      </Card>

      {/* Onda verde ativa */}
      {running ? (
        <Card tone="emergency" accessibilityLabel="Onda verde ativa. Toque para acompanhar a ambulância.">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="medkit" size={26} color={colors.emergency} />
            <AppText variant="heading" tone="emergency" accessibilityLiveRegion="polite">
              Onda verde ativa
            </AppText>
          </View>
          <AppText>
            Ambulância em deslocamento: {routeById[running.routeId]?.origin} →{' '}
            {routeById[running.routeId]?.destination}. Se estiver nessa via, dê passagem.
          </AppText>
          <Button
            label="Acompanhar no mapa"
            icon="navigate"
            variant="emergency"
            onPress={() => router.push('/onda-verde')}
          />
        </Card>
      ) : null}

      {/* Ações principais */}
      <View style={{ gap: 10 }}>
        <Button
          label="Registrar ocorrência"
          icon="megaphone"
          onPress={() => router.push('/ocorrencia/nova')}
          accessibilityHint="Avise a prefeitura sobre um problema em um semáforo"
        />
        <Button
          label="Ver cruzamentos"
          icon="map"
          variant="secondary"
          onPress={() => router.push('/cruzamentos')}
        />
      </View>

      {/* Números da IA */}
      <SectionTitle>A IA em números</SectionTitle>
      {data ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <StatTile
              label="Espera média"
              value={`${Math.round(data.avgDelayAdaptive)} s`}
              caption={`com ciclo fixo seria ${Math.round(data.avgDelayFixed)} s`}
              accent={colors.primary}
            />
            <StatTile
              label="Menos tempo parado"
              value={`${Math.round(data.reductionPct)}%`}
              caption="IA comparada ao ciclo fixo"
              accent={colors.primary}
            />
            <StatTile
              label="Combustível poupado"
              value={`${Math.round(data.fuelSavedLitersPerHour)} L/h`}
              caption="estimativa para a região"
            />
            <StatTile
              label="CO₂ evitado"
              value={`${Math.round(data.co2SavedKgPerHour)} kg/h`}
              caption="estimativa para a região"
            />
          </View>
          <AppText variant="caption" tone="muted">
            Valores calculados pela simulação, com atualização a cada 15 segundos
            {data.generatedAt ? ` (última: ${timeAgo(data.generatedAt, now)})` : ''}.
          </AppText>
        </>
      ) : (
        <Card>
          <AppText tone="muted">Carregando indicadores…</AppText>
        </Card>
      )}

      <SimulationPanel />

      {/* Avisos */}
      <SectionTitle>Avisos para você</SectionTitle>
      <View style={{ gap: 10 }}>
        {data?.insights.map((i) => (
          <Card key={i.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Icon name={INSIGHT_ICON[i.kind]} size={24} color={colors.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyBold">{i.title}</AppText>
              <AppText variant="caption" tone="muted">
                {i.text}
              </AppText>
            </View>
          </Card>
        ))}
        {recentOthers.map((o) => (
          <Card
            key={o.id}
            onPress={() => router.push({ pathname: '/ocorrencia/[id]', params: { id: o.id } })}
            accessibilityLabel={`Ocorrência de outro cidadão: ${TIPO_BY_ID[o.tipo]?.label} em ${o.intersectionName}. Toque para ver.`}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Icon name={TIPO_BY_ID[o.tipo]?.icon ?? 'alert-circle'} size={24} color={colors.danger} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyBold">{TIPO_BY_ID[o.tipo]?.label}</AppText>
              <AppText variant="caption" tone="muted">
                {o.intersectionName} · {timeAgo(o.criadaEm, now)}
              </AppText>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </Card>
        ))}
        {!data && !overview.error ? (
          <AppText tone="muted">Carregando avisos…</AppText>
        ) : null}
      </View>
    </Screen>
  );
}
