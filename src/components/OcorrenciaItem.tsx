import { router } from 'expo-router';
import { View } from 'react-native';

import { TIPO_BY_ID } from '@/domain/ocorrencias';
import type { Ocorrencia } from '@/domain/types';
import { useTheme } from '@/state/SettingsContext';
import { timeAgo } from '@/utils/format';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon } from './Icon';

export function StatusBadge({ status }: { status: Ocorrencia['status'] }) {
  const { colors } = useTheme();
  const c = status === 'resolvida' ? colors.level.fluido : colors.level.moderado;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: c.tint,
        borderColor: c.solid,
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 3,
        paddingHorizontal: 9,
      }}>
      <Icon name={status === 'resolvida' ? 'checkmark-circle' : 'time'} size={15} color={c.solid} />
      <AppText variant="caption" color={c.text} style={{ fontWeight: '700' }}>
        {status === 'resolvida' ? 'Resolvida' : 'Aberta'}
      </AppText>
    </View>
  );
}

export function OcorrenciaItem({
  ocorrencia: o,
  now,
  mine,
}: {
  ocorrencia: Ocorrencia;
  now: number;
  mine: boolean;
}) {
  const { colors } = useTheme();
  const tipo = TIPO_BY_ID[o.tipo];
  const confirmacoes = o.confirmadoPor.length;
  const label =
    `${tipo?.label ?? 'Ocorrência'} em ${o.intersectionName}. ${o.status === 'resolvida' ? 'Resolvida' : 'Aberta'}. ` +
    `${timeAgo(o.criadaEm, now)}. ${confirmacoes} confirmações.${mine ? ' Registrada por você.' : ''}`;

  return (
    <Card
      onPress={() => router.push({ pathname: '/ocorrencia/[id]', params: { id: o.id } })}
      accessibilityLabel={label}
      accessibilityHint="Abre os detalhes da ocorrência"
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name={tipo?.icon ?? 'alert-circle'} size={24} color={colors.text} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="bodyBold">{tipo?.label ?? 'Ocorrência'}</AppText>
        <AppText variant="caption" tone="muted">
          {o.intersectionName}
        </AppText>
        {o.descricao ? (
          <AppText numberOfLines={2} variant="caption">
            {o.descricao}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <StatusBadge status={o.status} />
          <AppText variant="caption" tone="muted">
            {timeAgo(o.criadaEm, now)} · {confirmacoes} {confirmacoes === 1 ? 'confirmação' : 'confirmações'}
            {mine ? ' · sua' : ''}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
