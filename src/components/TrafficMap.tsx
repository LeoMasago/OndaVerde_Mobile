import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';

import { COL_SHORT, COLS, ROW_STREETS, ROWS } from '@/domain/network';
import type { FlowLevel, Lamp } from '@/domain/types';
import { useTheme } from '@/state/SettingsContext';

import { LEVEL_ICON, LEVEL_LABEL } from './FlowBadge';
import { Icon } from './Icon';
import { LAMP_LABEL } from './TrafficLight';

/** Mapa esquemático (não está em escala): coordenadas em unidades do viewBox. */
const W = 360;
const H = 290;
const colX = (col: number) => 60 + col * 80;
const rowY = (row: number) => 78 + row * 80;
const NODE = 48; // área de toque mínima de 48 dp

export interface MapNodeData {
  id: string;
  row: number;
  col: number;
  name: string;
  level: FlowLevel;
  /** Lâmpada no eixo de interesse (no modo "wave", o eixo por onde a ambulância passa). */
  lamp: Lamp;
  preempted: boolean;
}

interface Props {
  nodes: MapNodeData[];
  /** flow = cor pelo nível de trânsito; wave = cor pelo semáforo da rota da ambulância. */
  mode?: 'flow' | 'wave';
  routeIds?: string[];
  routeActive?: boolean;
  ambulance?: { row: number; col: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const darkIcon = '#1A1A1A';
const lightIcon = '#FFFFFF';
/** No celular usa a fonte padrão do sistema; na web, a pilha de fontes sem serifa. */
const SVG_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

export function TrafficMap({
  nodes,
  mode = 'flow',
  routeIds,
  routeActive,
  ambulance,
  selectedId,
  onSelect,
}: Props) {
  const { colors, highContrast, reduceMotion } = useTheme();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const routeSet = new Set(routeIds ?? []);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const routePoints = (routeIds ?? [])
    .map((id) => byId.get(id))
    .filter((n): n is MapNodeData => !!n)
    .map((n) => `${colX(n.col)},${rowY(n.row)}`)
    .join(' ');
  const hasRoute = routePoints.length > 0;

  const lampColor = (l: Lamp) =>
    l === 'green' ? colors.lampGreen : l === 'yellow' ? colors.lampYellow : colors.lampRed;
  const lampIcon = (l: Lamp) =>
    l === 'green' ? 'checkmark' : l === 'yellow' ? 'alert' : 'close';

  return (
    <View
      onLayout={onLayout}
      style={{
        width: '100%',
        aspectRatio: W / H,
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderWidth: highContrast ? 2 : 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}>
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: ROWS }, (_, r) => (
          <Line key={`rh-${r}`} x1={0} y1={rowY(r)} x2={W} y2={rowY(r)} stroke={colors.road} strokeWidth={18} />
        ))}
        {Array.from({ length: COLS }, (_, c) => (
          <Line key={`rv-${c}`} x1={colX(c)} y1={26} x2={colX(c)} y2={H} stroke={colors.road} strokeWidth={18} />
        ))}
        {Array.from({ length: ROWS }, (_, r) => (
          <Line
            key={`dh-${r}`}
            x1={0}
            y1={rowY(r)}
            x2={W}
            y2={rowY(r)}
            stroke={colors.roadLine}
            strokeWidth={1.5}
            strokeDasharray="7 7"
          />
        ))}
        {Array.from({ length: COLS }, (_, c) => (
          <Line
            key={`dv-${c}`}
            x1={colX(c)}
            y1={26}
            x2={colX(c)}
            y2={H}
            stroke={colors.roadLine}
            strokeWidth={1.5}
            strokeDasharray="7 7"
          />
        ))}

        {hasRoute ? (
          <Polyline
            points={routePoints}
            fill="none"
            stroke={colors.emergency}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={routeActive ? undefined : '2 12'}
            opacity={routeActive ? 0.9 : 0.8}
          />
        ) : null}

        {COL_SHORT.map((label, c) => (
          <SvgText
            key={`cl-${c}`}
            x={colX(c)}
            y={16}
            fontSize={11}
            fontWeight="700"
            fontFamily={SVG_FONT}
            fill={colors.textMuted}
            textAnchor="middle">
            {label}
          </SvgText>
        ))}
        {ROW_STREETS.map((label, r) => (
          <SvgText
            key={`rl-${r}`}
            x={8}
            y={rowY(r) - 30}
            fontSize={11}
            fontWeight="700"
            fontFamily={SVG_FONT}
            fill={colors.textMuted}>
            {label}
          </SvgText>
        ))}
      </Svg>
      </View>

      {nodes.map((n) => {
        const onRoute = routeSet.has(n.id);
        const wave = mode === 'wave';
        const dimmed = wave && !onRoute;
        const selected = selectedId === n.id;

        const solid = wave ? lampColor(n.lamp) : colors.level[n.level].solid;
        const iconName = wave ? lampIcon(n.lamp) : LEVEL_ICON[n.level];
        const darkGlyph = wave ? n.lamp === 'yellow' : n.level === 'moderado' && !highContrast;
        const glyph = darkGlyph ? darkIcon : lightIcon;

        const label = wave
          ? onRoute
            ? `${n.name}: semáforo ${LAMP_LABEL[n.lamp].toLowerCase()} para a ambulância${n.preempted ? ', aberto pela onda verde' : ''}`
            : `${n.name}: fora da rota`
          : `${n.name}: trânsito ${LEVEL_LABEL[n.level].toLowerCase()}`;

        const size = dimmed ? 22 : 36;
        const content = (
          <View
            style={{
              width: NODE,
              height: NODE,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {n.preempted && onRoute ? (
              <View
                style={{
                  position: 'absolute',
                  width: NODE,
                  height: NODE,
                  borderRadius: NODE / 2,
                  borderWidth: 3,
                  borderColor: colors.lampGreen,
                  opacity: 0.8,
                }}
              />
            ) : null}
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dimmed ? colors.surfaceAlt : solid,
                borderWidth: selected ? 4 : 3,
                borderColor: selected ? colors.text : colors.surface,
              }}>
              {dimmed ? null : <Icon name={iconName} size={20} color={glyph} />}
            </View>
          </View>
        );

        const pos = {
          position: 'absolute' as const,
          left: `${(colX(n.col) / W) * 100}%` as `${number}%`,
          top: `${(rowY(n.row) / H) * 100}%` as `${number}%`,
          marginLeft: -NODE / 2,
          marginTop: -NODE / 2,
        };

        return onSelect ? (
          <Pressable
            key={n.id}
            onPress={() => onSelect(n.id)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Abre os detalhes deste cruzamento"
            accessibilityState={{ selected }}
            style={pos}>
            {content}
          </Pressable>
        ) : (
          <View key={n.id} accessible accessibilityLabel={label} style={pos}>
            {content}
          </View>
        );
      })}

      {ambulance && box.w > 0 ? (
        <AmbulanceMarker
          x={(colX(ambulance.col) / W) * box.w}
          y={(rowY(ambulance.row) / H) * box.h}
          reduceMotion={reduceMotion}
        />
      ) : null}
    </View>
  );
}

function AmbulanceMarker({ x, y, reduceMotion }: { x: number; y: number; reduceMotion: boolean }) {
  const { colors } = useTheme();
  const [pos] = useState(() => new Animated.ValueXY({ x, y }));

  useEffect(() => {
    if (reduceMotion) {
      pos.setValue({ x, y });
      return;
    }
    const anim = Animated.timing(pos, {
      toValue: { x, y },
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [x, y, reduceMotion, pos]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -20,
        top: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.emergency,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        transform: pos.getTranslateTransform(),
        zIndex: 10,
        elevation: 10,
      }}>
      <Icon name="medical" size={22} color="#FFFFFF" />
    </Animated.View>
  );
}
