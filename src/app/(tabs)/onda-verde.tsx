import { useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen, SectionTitle } from '@/components/Screen';
import { InlineNotice } from '@/components/StateViews';
import { TrafficMap, type MapNodeData } from '@/components/TrafficMap';
import { useTraffic } from '@/hooks/useTraffic';
import { routeAxes } from '@/services/traffic/emergency';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useSettings, useTheme } from '@/state/SettingsContext';
import { formatDuration, spokenDuration } from '@/utils/format';

export default function OndaVerdeScreen() {
  const { colors, highContrast } = useTheme();
  const { update } = useSettings();
  const { routes, routeById, byId } = useNetwork();
  const { iniciarEmergencia, encerrarEmergencia } = useDb();
  const { states, ambulance, ctx } = useTraffic(1000);

  const [selectedRoute, setSelectedRoute] = useState(routes[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adaptive = ctx.mode === 'adaptive';
  const route = routeById[ambulance?.routeId ?? selectedRoute] ?? routes[0];
  const axes = ambulance ? ambulance.plan.axes : routeAxes(route.nodes.map((id) => byId[id]));
  const running = ambulance && !ambulance.done ? ambulance : null;
  const finished = ambulance && ambulance.done ? ambulance : null;

  const nodes: MapNodeData[] = states.map((s) => {
    const idx = route.nodes.indexOf(s.inter.id);
    const axis = idx >= 0 ? axes[idx] : 'EW';
    return {
      id: s.inter.id,
      row: s.inter.row,
      col: s.inter.col,
      name: s.inter.shortName,
      level: s.metrics.level,
      lamp: axis === 'NS' ? s.signal.lampNS : s.signal.lampEW,
      preempted: idx >= 0 && s.signal.preempted !== null,
    };
  });

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await iniciarEmergencia(selectedRoute);
      AccessibilityInfo.announceForAccessibility('Simulação iniciada. Onda verde aberta para a ambulância.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar a simulação.');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!ambulance) return;
    setBusy(true);
    setError(null);
    try {
      await encerrarEmergencia(ambulance.docId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível encerrar a simulação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card tone="primary">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="medkit" size={26} color={colors.primary} />
          <AppText variant="heading" style={{ flex: 1 }}>
            Como funciona a onda verde
          </AppText>
        </View>
        <AppText>
          Quando uma ambulância sai para um atendimento, a IA abre os semáforos à frente dela, um
          depois do outro. Ela não para, e você vê aqui por onde ela passa.
        </AppText>
      </Card>

      {!adaptive ? (
        <Card tone="alt">
          <InlineNotice
            icon="warning"
            text="Você está no modo ciclo fixo (como é hoje): não existe onda verde, a ambulância depende dos semáforos normais."
          />
          <Button
            label="Voltar para a IA adaptativa"
            variant="secondary"
            icon="sparkles"
            onPress={() => update({ mode: 'adaptive' })}
          />
        </Card>
      ) : null}

      {/* Escolha da rota */}
      {!ambulance ? (
        <>
          <SectionTitle>Escolha a rota</SectionTitle>
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {routes.map((r) => {
              const selected = r.id === selectedRoute;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedRoute(r.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${r.name}. De ${r.origin} até ${r.destination}. ${r.nodes.length} cruzamentos.`}
                  style={({ pressed }) => ({
                    minHeight: 64,
                    borderRadius: 16,
                    borderWidth: selected ? 3 : highContrast ? 2 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primaryTint : colors.surface,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <Icon
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyBold">{r.name}</AppText>
                    <AppText variant="caption" tone="muted">
                      {r.origin} → {r.destination} · {r.nodes.length} cruzamentos
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {/* Mapa */}
      <TrafficMap
        nodes={nodes}
        mode="wave"
        routeIds={route.nodes}
        routeActive={!!ambulance}
        ambulance={ambulance ? ambulance.position : null}
      />
      <AppText variant="caption" tone="muted">
        Os círculos da rota mostram o semáforo para a ambulância: verde (segue), amarelo (atenção) ou
        vermelho (espera). Um anel verde indica cruzamento aberto pela onda verde.
      </AppText>

      {/* Estado da simulação */}
      {running ? (
        <Card tone="emergency">
          <AppText variant="heading" tone="emergency">
            Ambulância a caminho
          </AppText>
          <AppText>
            {route.origin} → {route.destination}
          </AppText>
          <AppText
            accessibilityLabel={`Próximo cruzamento: ${running.plan.nodes[running.position.nextIndex]?.shortName}. ${
              running.position.waiting ? 'Parada no vermelho' : 'Chega'
            } em ${spokenDuration(running.position.secondsToNext)}.`}>
            Próximo cruzamento:{' '}
            <AppText variant="bodyBold">
              {running.plan.nodes[running.position.nextIndex]?.shortName}
            </AppText>
            {' — '}
            {running.position.waiting
              ? `parada no vermelho, libera em ${running.position.secondsToNext} s`
              : adaptive
                ? `chega em ${running.position.secondsToNext} s, semáforo já aberto`
                : `chega em ${running.position.secondsToNext} s`}
            .
          </AppText>
          <ProgressBar value={running.position.progress} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="muted">
              Cruzamento {Math.min(running.position.nextIndex + 1, running.plan.nodes.length)} de{' '}
              {running.plan.nodes.length}
            </AppText>
            <AppText variant="caption" tone="muted">
              Chegada em{' '}
              {formatDuration(
                (adaptive ? running.plan.waveTotal : running.plan.baseTotal) - running.elapsed,
              )}
            </AppText>
          </View>
          <Comparison plan={running.plan} adaptive={adaptive} />
        </Card>
      ) : null}

      {finished ? (
        <Card tone="primary">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="checkmark-circle" size={28} color={colors.primary} />
            <AppText variant="heading" style={{ flex: 1 }}>
              Ambulância chegou ao destino
            </AppText>
          </View>
          <Comparison plan={finished.plan} adaptive={adaptive} />
        </Card>
      ) : null}

      {error ? <InlineNotice tone="error" icon="alert-circle" text={error} /> : null}

      {ambulance ? (
        <Button
          label={finished ? 'Nova simulação' : 'Encerrar simulação'}
          variant={finished ? 'primary' : 'secondary'}
          icon={finished ? 'refresh' : 'stop-circle'}
          loading={busy}
          onPress={stop}
        />
      ) : (
        <Button
          label="Simular chamada de ambulância"
          variant="emergency"
          icon="medkit"
          loading={busy}
          onPress={start}
          accessibilityHint="Cria uma ambulância simulada que todos os celulares com o app conseguem acompanhar"
        />
      )}

      <Card tone="alt">
        <AppText variant="bodyBold">Se você estiver dirigindo na rota</AppText>
        <AppText variant="caption" tone="muted">
          Mantenha a calma, encoste à direita e dê passagem. Nunca avance no vermelho: a IA abre o
          semáforo para a ambulância, não para os demais.
        </AppText>
      </Card>
      <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        Simulação: a ambulância é fictícia e fica visível para todos que abrirem o app.
      </AppText>
    </Screen>
  );
}

function Comparison({
  plan,
  adaptive,
}: {
  plan: { waveTotal: number; baseTotal: number; savedSec: number };
  adaptive: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Com onda verde: ${spokenDuration(plan.waveTotal)}. Sem onda verde: ${spokenDuration(plan.baseTotal)}. Economia de ${spokenDuration(plan.savedSec)}.`}
      style={{ gap: 6, marginTop: 4 }}>
      <Row label="Com onda verde (IA)" value={formatDuration(plan.waveTotal)} bold={adaptive} />
      <Row label="Sem onda verde (ciclo fixo)" value={formatDuration(plan.baseTotal)} bold={!adaptive} />
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <Row label="Tempo economizado" value={formatDuration(plan.savedSec)} bold color={colors.primary} />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
      <AppText variant={bold ? 'bodyBold' : 'body'} style={{ flexShrink: 1 }}>
        {label}
      </AppText>
      <AppText variant="bodyBold" color={color}>
        {value}
      </AppText>
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { colors } = useTheme();
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso da rota"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={{ height: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.emergency }} />
    </View>
  );
}
