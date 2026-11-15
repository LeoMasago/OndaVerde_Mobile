import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Screen, SectionTitle } from '@/components/Screen';
import { InlineNotice } from '@/components/StateViews';
import { OCORRENCIA_TIPOS } from '@/domain/ocorrencias';
import type { OcorrenciaTipo } from '@/domain/types';
import { useDb } from '@/state/DbContext';
import { useNetwork } from '@/state/NetworkContext';
import { useTheme } from '@/state/SettingsContext';
import { describeWriteError } from '@/utils/errors';

const MAX_DESC = 280;

export default function NovaOcorrenciaScreen() {
  const { colors, highContrast, scale } = useTheme();
  const params = useLocalSearchParams<{ intersectionId?: string }>();
  const { intersections, byId } = useNetwork();
  const { addOcorrencia } = useDb();

  const [tipo, setTipo] = useState<OcorrenciaTipo | null>(null);
  const [interId, setInterId] = useState<string | null>(
    params.intersectionId && byId[params.intersectionId] ? params.intersectionId : null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingTipo = tried && !tipo;
  const missingInter = tried && !interId;
  const selected = interId ? byId[interId] : null;
  const border = highContrast ? 2 : 1;

  const submit = async () => {
    setTried(true);
    if (!tipo || !interId) {
      AccessibilityInfo.announceForAccessibility('Faltam informações: escolha o tipo e o cruzamento.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addOcorrencia({
        tipo,
        intersectionId: interId,
        intersectionName: byId[interId].name,
        descricao: descricao.trim(),
      });
      AccessibilityInfo.announceForAccessibility('Ocorrência enviada com sucesso.');
      if (router.canGoBack()) router.back();
      else router.replace('/ocorrencias');
      Alert.alert('Ocorrência enviada', 'Obrigado! Ela já aparece na lista para todos os cidadãos.');
    } catch (e) {
      setError(describeWriteError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppText tone="muted">
          Conte o que você viu. Leva menos de um minuto e ajuda a IA e a equipe de trânsito a
          corrigir o problema.
        </AppText>

        <SectionTitle>1. O que aconteceu?</SectionTitle>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {OCORRENCIA_TIPOS.map((t) => {
            const on = tipo === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTipo(t.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${t.label}. ${t.hint}`}
                accessibilityState={{ selected: on, checked: on }}
                style={({ pressed }) => ({
                  flexGrow: 1,
                  flexBasis: '46%',
                  minHeight: 100,
                  borderRadius: 16,
                  borderWidth: on ? 3 : border,
                  borderColor: on ? colors.primary : missingTipo ? colors.danger : colors.border,
                  backgroundColor: on ? colors.primaryTint : colors.surface,
                  padding: 12,
                  gap: 6,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Icon name={t.icon} size={28} color={on ? colors.primary : colors.text} />
                  {on ? <Icon name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </View>
                <AppText variant="bodyBold">{t.label}</AppText>
                <AppText variant="caption" tone="muted">
                  {t.hint}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {missingTipo ? <InlineNotice tone="error" icon="alert-circle" text="Escolha o que aconteceu." /> : null}

        <SectionTitle>2. Em qual cruzamento?</SectionTitle>
        <Pressable
          onPress={() => setPickerOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={selected ? `Cruzamento: ${selected.name}. Toque para trocar.` : 'Escolher cruzamento'}
          accessibilityState={{ expanded: pickerOpen }}
          style={{
            minHeight: 56,
            borderRadius: 14,
            borderWidth: border,
            borderColor: missingInter ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
          <Icon name="location" size={22} color={colors.primary} />
          <AppText style={{ flex: 1 }} tone={selected ? 'text' : 'muted'}>
            {selected ? selected.name : 'Toque para escolher'}
          </AppText>
          <Icon name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
        </Pressable>
        {pickerOpen ? (
          <View
            accessibilityRole="radiogroup"
            style={{ borderRadius: 14, borderWidth: border, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface }}>
            {intersections.map((i, idx) => {
              const on = i.id === interId;
              return (
                <Pressable
                  key={i.id}
                  onPress={() => {
                    setInterId(i.id);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={i.name}
                  accessibilityState={{ selected: on, checked: on }}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: on ? colors.primaryTint : pressed ? colors.surfaceAlt : colors.surface,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  })}>
                  <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.primary : colors.textMuted} />
                  <AppText style={{ flex: 1 }}>{i.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {missingInter ? <InlineNotice tone="error" icon="alert-circle" text="Escolha o cruzamento." /> : null}

        <SectionTitle>3. Quer contar mais? (opcional)</SectionTitle>
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          multiline
          maxLength={MAX_DESC}
          placeholder="Ex.: o semáforo ficou vermelho por mais de 2 minutos sem carros na outra rua."
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Descrição da ocorrência, opcional"
          textAlignVertical="top"
          style={{
            minHeight: 110,
            borderRadius: 14,
            borderWidth: border,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
            padding: 14,
            fontSize: 16 * scale,
          }}
        />
        <AppText variant="caption" tone="muted" style={{ textAlign: 'right' }}>
          {descricao.length}/{MAX_DESC}
        </AppText>

        {error ? <InlineNotice tone="error" icon="cloud-offline" text={error} /> : null}

        <Button
          label="Enviar ocorrência"
          icon="send"
          loading={submitting}
          onPress={submit}
          accessibilityHint="Salva a ocorrência no banco de dados"
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
