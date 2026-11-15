import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/OcorrenciaItem';
import { Screen } from '@/components/Screen';
import { EmptyView, InlineNotice, LoadingView } from '@/components/StateViews';
import { TIPO_BY_ID } from '@/domain/ocorrencias';
import { useNow } from '@/hooks/useNow';
import { useDb } from '@/state/DbContext';
import { useTheme } from '@/state/SettingsContext';
import { describeWriteError } from '@/utils/errors';
import { timeAgo } from '@/utils/format';

export default function OcorrenciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const {
    ocorrencias,
    ocorrenciasStatus,
    deviceId,
    confirmarOcorrencia,
    resolverOcorrencia,
    removerOcorrencia,
  } = useDb();
  const now = useNow(30_000);
  const [busy, setBusy] = useState<'confirmar' | 'resolver' | 'apagar' | null>(null);
  const [askDelete, setAskDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ocorrenciasStatus === 'loading') return <LoadingView message="Carregando ocorrência…" />;

  const o = ocorrencias.find((x) => x.id === id);
  if (!o) {
    return (
      <Screen>
        <EmptyView
          icon="search"
          title="Ocorrência não encontrada"
          message="Ela pode ter sido apagada por quem registrou.">
          <Button label="Ver todas as ocorrências" onPress={() => router.replace('/ocorrencias')} />
        </EmptyView>
      </Screen>
    );
  }

  const tipo = TIPO_BY_ID[o.tipo];
  const mine = o.autorId === deviceId;
  const confirmed = o.confirmadoPor.includes(deviceId);
  const total = o.confirmadoPor.length;

  const run = async (kind: 'confirmar' | 'resolver' | 'apagar', action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
      if (kind === 'apagar') {
        if (router.canGoBack()) router.back();
        else router.replace('/ocorrencias');
      }
    } catch (e) {
      setError(describeWriteError(e));
      setAskDelete(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name={tipo?.icon ?? 'alert-circle'} size={28} color={colors.text} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="title">{tipo?.label ?? 'Ocorrência'}</AppText>
            <StatusBadge status={o.status} />
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />
        <AppText variant="label" tone="muted">
          Cruzamento
        </AppText>
        <Button
          label={o.intersectionName}
          variant="secondary"
          icon="location"
          onPress={() => router.push({ pathname: '/cruzamento/[id]', params: { id: o.intersectionId } })}
          accessibilityHint="Abre os detalhes do cruzamento"
        />

        <AppText variant="label" tone="muted">
          O que foi relatado
        </AppText>
        <AppText>{o.descricao || 'Sem descrição.'}</AppText>

        <AppText variant="caption" tone="muted">
          {mine ? 'Registrada por você' : 'Registrada por outro cidadão'} · {timeAgo(o.criadaEm, now)} ·{' '}
          {total} {total === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'}
        </AppText>
      </Card>

      {error ? <InlineNotice tone="error" icon="alert-circle" text={error} /> : null}

      {!mine ? (
        <Button
          label={confirmed ? 'Você já confirmou' : 'Também vi isso'}
          icon={confirmed ? 'checkmark-circle' : 'thumbs-up'}
          disabled={confirmed}
          loading={busy === 'confirmar'}
          onPress={() => run('confirmar', () => confirmarOcorrencia(o.id))}
          accessibilityHint="Confirma que você também viu esse problema"
        />
      ) : (
        <>
          {o.status === 'aberta' ? (
            <Button
              label="Marcar como resolvida"
              icon="checkmark-done"
              loading={busy === 'resolver'}
              onPress={() => run('resolver', () => resolverOcorrencia(o.id))}
            />
          ) : null}
          {askDelete ? (
            <Card tone="alt">
              <AppText variant="bodyBold">Apagar esta ocorrência?</AppText>
              <AppText variant="caption" tone="muted">
                Ela some da lista para todos e não dá para desfazer.
              </AppText>
              <Button
                label="Sim, apagar"
                variant="danger"
                icon="trash"
                loading={busy === 'apagar'}
                onPress={() => run('apagar', () => removerOcorrencia(o.id))}
              />
              <Button label="Cancelar" variant="secondary" onPress={() => setAskDelete(false)} />
            </Card>
          ) : (
            <Button
              label="Apagar minha ocorrência"
              variant="secondary"
              icon="trash-outline"
              onPress={() => setAskDelete(true)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
