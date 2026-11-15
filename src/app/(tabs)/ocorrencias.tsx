import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Chip';
import { OcorrenciaItem } from '@/components/OcorrenciaItem';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { useNow } from '@/hooks/useNow';
import { useDb } from '@/state/DbContext';
import { describeDbError } from '@/utils/errors';

type Tab = 'todas' | 'minhas';

export default function OcorrenciasScreen() {
  const { ocorrencias, ocorrenciasStatus, ocorrenciasError, retryOcorrencias, deviceId, carregarExemplos } =
    useDb();
  const now = useNow(30_000);
  const [tab, setTab] = useState<Tab>('todas');
  const [seeding, setSeeding] = useState(false);

  if (ocorrenciasStatus === 'loading') return <LoadingView message="Carregando ocorrências…" />;
  if (ocorrenciasStatus === 'error') {
    return (
      <ErrorView
        title="Ocorrências indisponíveis"
        message={describeDbError(ocorrenciasError)}
        onRetry={retryOcorrencias}
      />
    );
  }

  const minhas = ocorrencias.filter((o) => o.autorId === deviceId);
  const list = tab === 'minhas' ? minhas : ocorrencias;

  const seed = async () => {
    setSeeding(true);
    try {
      await carregarExemplos();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Screen>
      <Button
        label="Registrar ocorrência"
        icon="add-circle"
        onPress={() => router.push('/ocorrencia/nova')}
        accessibilityHint="Avise a prefeitura sobre um problema em um semáforo"
      />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'todas', label: `Todas (${ocorrencias.length})` },
          { value: 'minhas', label: `Minhas (${minhas.length})` },
        ]}
      />

      {list.length === 0 ? (
        tab === 'minhas' ? (
          <EmptyView
            icon="document-text-outline"
            title="Você ainda não registrou nada"
            message="Viu um semáforo apagado, uma espera longa ou uma ambulância parada? Registre aqui."
          />
        ) : (
          <EmptyView
            icon="checkmark-done-circle-outline"
            title="Nenhuma ocorrência por enquanto"
            message="Quando alguém registrar um problema, ele aparece aqui em tempo real.">
            <View style={{ marginTop: 8 }}>
              <Button
                label="Carregar exemplos para a demonstração"
                icon="download"
                variant="secondary"
                loading={seeding}
                onPress={seed}
              />
            </View>
          </EmptyView>
        )
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((o) => (
            <OcorrenciaItem key={o.id} ocorrencia={o} now={now} mine={o.autorId === deviceId} />
          ))}
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Lista atualizada em tempo real.
          </AppText>
        </View>
      )}
    </Screen>
  );
}
