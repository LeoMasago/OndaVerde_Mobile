import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip, Segmented } from '@/components/Chip';
import { FlowBadge, LEVEL_LABEL } from '@/components/FlowBadge';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TrafficMap, type MapNodeData } from '@/components/TrafficMap';
import type { FlowLevel } from '@/domain/types';
import { useTraffic, type NodeState } from '@/hooks/useTraffic';
import { useSettings, useTheme } from '@/state/SettingsContext';

type ViewMode = 'mapa' | 'lista';
type Filter = 'todos' | FlowLevel;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'intenso', label: 'Intenso' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'fluido', label: 'Fluido' },
];

export default function CruzamentosScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { states, stateById } = useTraffic(1000);
  const [view, setView] = useState<ViewMode>('mapa');
  const [filter, setFilter] = useState<Filter>('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes: MapNodeData[] = states.map((s) => ({
    id: s.inter.id,
    row: s.inter.row,
    col: s.inter.col,
    name: s.inter.shortName,
    level: s.metrics.level,
    lamp: 'green',
    preempted: s.signal.preempted !== null,
  }));
  const selected = selectedId ? stateById[selectedId] : null;

  const list = [...states]
    .filter((s) => filter === 'todos' || s.metrics.level === filter)
    .sort((a, b) => b.metrics.avgDelay - a.metrics.avgDelay);

  const counts = states.reduce(
    (acc, s) => ({ ...acc, [s.metrics.level]: acc[s.metrics.level] + 1 }),
    { fluido: 0, moderado: 0, intenso: 0 } as Record<FlowLevel, number>,
  );

  return (
    <Screen>
      <Segmented<ViewMode>
        value={view}
        onChange={setView}
        options={[
          { value: 'mapa', label: 'Mapa' },
          { value: 'lista', label: 'Lista' },
        ]}
      />
      <AppText variant="caption" tone="muted">
        {settings.mode === 'adaptive' ? 'IA adaptativa' : 'Ciclo fixo'} ·{' '}
        {plural(counts.intenso, 'intenso')}, {plural(counts.moderado, 'moderado')},{' '}
        {plural(counts.fluido, 'fluido')}
      </AppText>

      {view === 'mapa' ? (
        <>
          <TrafficMap
            nodes={nodes}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <FlowBadge level="fluido" />
            <FlowBadge level="moderado" />
            <FlowBadge level="intenso" />
          </View>
          <AppText variant="caption" tone="muted">
            Mapa esquemático, fora de escala, de uma rede fictícia de 12 cruzamentos.
          </AppText>
          {selected ? (
            <Card tone="alt" accessibilityLabel={describe(selected)}>
              <AppText variant="heading">{selected.inter.name}</AppText>
              <FlowBadge level={selected.metrics.level} />
              <AppText>
                Espera média:{' '}
                <AppText variant="bodyBold">{Math.round(selected.metrics.avgDelay)} s</AppText> por
                veículo.
              </AppText>
              <Button
                label="Ver detalhes do cruzamento"
                icon="chevron-forward"
                onPress={() =>
                  router.push({ pathname: '/cruzamento/[id]', params: { id: selected.inter.id } })
                }
              />
            </Card>
          ) : (
            <Card tone="alt">
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icon name="hand-left" size={22} color={colors.textMuted} />
                <AppText tone="muted" style={{ flex: 1 }}>
                  Toque em um cruzamento do mapa para ver o semáforo e o que a IA decidiu.
                </AppText>
              </View>
            </Card>
          )}
        </>
      ) : (
        <>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                selected={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            ))}
          </View>
          {list.length === 0 ? (
            <Card>
              <AppText tone="muted">Nenhum cruzamento com trânsito {filter} agora.</AppText>
            </Card>
          ) : (
            list.map((s) => (
              <Card
                key={s.inter.id}
                onPress={() =>
                  router.push({ pathname: '/cruzamento/[id]', params: { id: s.inter.id } })
                }
                accessibilityLabel={describe(s)}
                accessibilityHint="Abre os detalhes do cruzamento">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AppText variant="bodyBold" style={{ flex: 1 }}>
                    {s.inter.name}
                  </AppText>
                  <Icon name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
                <FlowBadge level={s.metrics.level} />
                <AppText variant="caption" tone="muted">
                  Espera média {Math.round(s.metrics.avgDelay)} s · verde de{' '}
                  {s.inter.streetEW.replace(/^(Av\.|Rua|Al\.) /, '')} {s.signal.greenEW} s, de{' '}
                  {s.inter.streetNS.replace(/^(Av\.|Rua|Al\.) /, '')} {s.signal.greenNS} s
                </AppText>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

function describe(s: NodeState) {
  return `${s.inter.name}. Trânsito ${LEVEL_LABEL[s.metrics.level].toLowerCase()}. Espera média de ${Math.round(s.metrics.avgDelay)} segundos.`;
}
