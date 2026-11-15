import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlowBadge } from '@/components/FlowBadge';
import { Icon } from '@/components/Icon';
import { OcorrenciaItem } from '@/components/OcorrenciaItem';
import { Screen, SectionTitle } from '@/components/Screen';
import { EmptyView } from '@/components/StateViews';
import { LAMP_LABEL, TrafficLight } from '@/components/TrafficLight';
import type { Axis, Intersection, SignalState } from '@/domain/types';
import { useTraffic } from '@/hooks/useTraffic';
import { FIXED_GREEN, metricsAt, signalAt } from '@/services/traffic/engine';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useTheme } from '@/state/SettingsContext';
import { spokenDuration } from '@/utils/format';

export default function CruzamentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { byId } = useNetwork();
  const { stateById, ctx, tSec, now } = useTraffic(1000);
  const { ocorrencias, deviceId } = useDb();

  const inter = byId[id];
  const state = stateById[id];

  if (!inter || !state) {
    return (
      <Screen>
        <EmptyView icon="help-circle-outline" title="Cruzamento não encontrado" message="Esse cruzamento não existe na rede.">
          <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
        </EmptyView>
      </Screen>
    );
  }

  const { signal, metrics } = state;
  const ia = metricsAt(inter, { ...ctx, mode: 'adaptive' }, tSec);
  const fixo = metricsAt(inter, { ...ctx, mode: 'fixed' }, tSec);
  const iaPlan = signalAt(inter, { ...ctx, mode: 'adaptive' }, tSec);
  const adaptive = ctx.mode === 'adaptive';

  // a rua que recebe mais verde com a IA (e a outra, para comparar)
  const ewFirst = iaPlan.greenEW >= iaPlan.greenNS;
  const favored = {
    street: ewFirst ? inter.streetEW : inter.streetNS,
    green: ewFirst ? iaPlan.greenEW : iaPlan.greenNS,
    other: ewFirst ? iaPlan.greenNS : iaPlan.greenEW,
  };

  const locais = ocorrencias.filter((o) => o.intersectionId === inter.id).slice(0, 3);

  return (
    <Screen>
      <Stack.Screen options={{ title: inter.shortName }} />

      <Card>
        <AppText variant="title">{inter.name}</AppText>
        <FlowBadge level={metrics.level} large />
        <AppText variant="caption" tone="muted">
          Espera média agora: {Math.round(metrics.avgDelay)} s por veículo ·{' '}
          {adaptive ? 'IA adaptativa' : 'ciclo fixo'}
        </AppText>
      </Card>

      {signal.preempted ? (
        <Card tone="emergency">
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="medkit" size={24} color={colors.emergency} />
            <AppText variant="bodyBold" tone="emergency" style={{ flex: 1 }} accessibilityLiveRegion="polite">
              Onda verde: aberto para uma ambulância
            </AppText>
          </View>
        </Card>
      ) : null}

      <SectionTitle>Semáforos agora</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <LightCard inter={inter} axis="EW" signal={signal} />
        <LightCard inter={inter} axis="NS" signal={signal} />
      </View>

      <SectionTitle>O que a IA decidiu</SectionTitle>
      <Card>
        {adaptive ? (
          <AppText>
            {favored.green - favored.other > 3 ? (
              <>
                A IA deu mais verde para a {favored.street}:{' '}
                <AppText variant="bodyBold">
                  {favored.green} s contra {favored.other} s
                </AppText>{' '}
                na outra rua, porque há mais carros nela agora.
              </>
            ) : (
              <>
                A IA dividiu o verde quase igual entre as duas ruas ({favored.green} s e {favored.other}{' '}
                s), pois o fluxo está parecido.
              </>
            )}
          </AppText>
        ) : (
          <AppText>
            No ciclo fixo, cada rua recebe sempre <AppText variant="bodyBold">{FIXED_GREEN} s</AppText> de
            verde, não importa quantos carros esperam. Mude para a IA adaptativa na tela Início para comparar.
          </AppText>
        )}
        <GreenBar label={inter.streetEW} ia={iaPlan.greenEW} fixed={FIXED_GREEN} />
        <GreenBar label={inter.streetNS} ia={iaPlan.greenNS} fixed={FIXED_GREEN} />
        <Legend />
      </Card>

      <SectionTitle>Fluxo e espera</SectionTitle>
      <Card>
        <Metric
          label={inter.streetEW}
          value={`${Math.round(metrics.demandEW)} carros por minuto`}
        />
        <Metric
          label={inter.streetNS}
          value={`${Math.round(metrics.demandNS)} carros por minuto`}
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View
          accessible
          accessibilityLabel={`Espera média por carro: com a IA ${spokenDuration(ia.avgDelay)}; com ciclo fixo ${spokenDuration(fixo.avgDelay)}.`}
          style={{ gap: 4 }}>
          <AppText variant="label" tone="muted">
            Espera média por carro
          </AppText>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <View>
              <AppText variant="number" color={colors.primary}>
                {Math.round(ia.avgDelay)} s
              </AppText>
              <AppText variant="caption" tone="muted">
                com a IA
              </AppText>
            </View>
            <View>
              <AppText variant="number">{Math.round(fixo.avgDelay)} s</AppText>
              <AppText variant="caption" tone="muted">
                com ciclo fixo
              </AppText>
            </View>
          </View>
        </View>
      </Card>

      <Button
        label="Registrar ocorrência aqui"
        icon="megaphone"
        onPress={() =>
          router.push({ pathname: '/ocorrencia/nova', params: { intersectionId: inter.id } })
        }
      />

      <SectionTitle>Ocorrências neste cruzamento</SectionTitle>
      {locais.length === 0 ? (
        <Card tone="alt">
          <AppText tone="muted">Nenhuma ocorrência registrada aqui.</AppText>
        </Card>
      ) : (
        locais.map((o) => (
          <OcorrenciaItem key={o.id} ocorrencia={o} now={now} mine={o.autorId === deviceId} />
        ))
      )}
    </Screen>
  );
}

function LightCard({ inter, axis, signal }: { inter: Intersection; axis: Axis; signal: SignalState }) {
  const lamp = axis === 'NS' ? signal.lampNS : signal.lampEW;
  const change = axis === 'NS' ? signal.changeNS : signal.changeEW;
  const street = axis === 'NS' ? inter.streetNS : inter.streetEW;
  const direction = axis === 'NS' ? 'norte-sul' : 'leste-oeste';
  const verb = lamp === 'red' ? 'abre' : 'muda';
  return (
    <Card
      style={{ flex: 1, alignItems: 'center' }}
      accessibilityLabel={`${street}, sentido ${direction}: ${LAMP_LABEL[lamp]}. ${verb} em ${spokenDuration(change)}.`}>
      <AppText variant="label" tone="muted" style={{ textAlign: 'center' }}>
        {street}
      </AppText>
      <AppText variant="caption" tone="muted">
        sentido {direction}
      </AppText>
      <TrafficLight lamp={lamp} />
      <AppText variant="heading">{LAMP_LABEL[lamp]}</AppText>
      <AppText variant="caption" tone="muted">
        {verb} em {change} s
      </AppText>
    </Card>
  );
}

function GreenBar({ label, ia, fixed }: { label: string; ia: number; fixed: number }) {
  const { colors } = useTheme();
  const MAX = 44;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: verde de ${ia} segundos com a IA, ${fixed} segundos no ciclo fixo.`}
      style={{ gap: 4 }}>
      <AppText variant="label">{label}</AppText>
      <Bar value={ia} max={MAX} color={colors.primary} text={`IA: ${ia} s`} />
      <Bar value={fixed} max={MAX} color={colors.textMuted} text={`Ciclo fixo: ${fixed} s`} />
    </View>
  );
}

function Bar({ value, max, color, text }: { value: number; max: number; color: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', backgroundColor: color }} />
      </View>
      <AppText variant="caption" style={{ width: 110 }}>
        {text}
      </AppText>
    </View>
  );
}

function Legend() {
  return (
    <AppText variant="caption" tone="muted">
      Tempo de verde por ciclo, em segundos.
    </AppText>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <AppText style={{ flexShrink: 1 }}>{label}</AppText>
      <AppText variant="bodyBold">{value}</AppText>
    </View>
  );
}
