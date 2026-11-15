import type { FlowLevel } from '@/domain/types';

export interface LevelColors {
  /** Cor forte (ícones, pontos, preenchimento de marcadores). */
  solid: string;
  /** Fundo claro de etiquetas. */
  tint: string;
  /** Texto sobre o fundo claro (contraste ≥ 4.5:1). */
  text: string;
}

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primaryTint: string;
  danger: string;
  onDanger: string;
  emergency: string;
  onEmergency: string;
  emergencyTint: string;
  lampGreen: string;
  lampYellow: string;
  lampRed: string;
  lampOff: string;
  housing: string;
  road: string;
  roadLine: string;
  level: Record<FlowLevel, LevelColors>;
}

const light: Palette = {
  bg: '#F3F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EEF4',
  text: '#0F1B2D',
  textMuted: '#465569',
  border: '#CBD5E1',
  primary: '#0A7A3E',
  onPrimary: '#FFFFFF',
  primaryTint: '#DFF5E8',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  emergency: '#1D4ED8',
  onEmergency: '#FFFFFF',
  emergencyTint: '#DBE7FF',
  lampGreen: '#22C55E',
  lampYellow: '#FACC15',
  lampRed: '#EF4444',
  lampOff: '#3B4556',
  housing: '#1B2433',
  road: '#D5DCE6',
  roadLine: '#FFFFFF',
  level: {
    fluido: { solid: '#1F9D55', tint: '#DFF5E8', text: '#0B5A2D' },
    moderado: { solid: '#E0A100', tint: '#FFF1C7', text: '#6B4A00' },
    intenso: { solid: '#D93B3B', tint: '#FDE2E2', text: '#8E1B1B' },
  },
};

const dark: Palette = {
  bg: '#0B1220',
  surface: '#141E30',
  surfaceAlt: '#1D2A42',
  text: '#EAF0F8',
  textMuted: '#A9B6C9',
  border: '#2A3A56',
  primary: '#3DDC84',
  onPrimary: '#04210F',
  primaryTint: '#11301F',
  danger: '#FF8A80',
  onDanger: '#3A0905',
  emergency: '#7AA2FF',
  onEmergency: '#06142F',
  emergencyTint: '#14254D',
  lampGreen: '#34D676',
  lampYellow: '#FACC15',
  lampRed: '#F26262',
  lampOff: '#2B3547',
  housing: '#05080F',
  road: '#25324A',
  roadLine: '#3A4B6A',
  level: {
    fluido: { solid: '#34D676', tint: '#10301E', text: '#8CF0B3' },
    moderado: { solid: '#F5B800', tint: '#3A2D07', text: '#FFD866' },
    intenso: { solid: '#F26262', tint: '#401616', text: '#FFA3A3' },
  },
};

/** Alto contraste: preto/branco puros, bordas fortes e cores de estado mais escuras/claras. */
function highContrast(base: Palette, isDark: boolean): Palette {
  return {
    ...base,
    bg: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#000000' : '#FFFFFF',
    surfaceAlt: isDark ? '#1A1A1A' : '#EDEDED',
    text: isDark ? '#FFFFFF' : '#000000',
    textMuted: isDark ? '#FFFFFF' : '#000000',
    border: isDark ? '#FFFFFF' : '#000000',
    primary: isDark ? '#5CFF9A' : '#005A2B',
    onPrimary: isDark ? '#000000' : '#FFFFFF',
    primaryTint: isDark ? '#0A2A17' : '#CFF0DC',
    emergency: isDark ? '#9DBBFF' : '#0B2FA8',
    emergencyTint: isDark ? '#0E1F52' : '#CFDCFF',
    level: isDark
      ? {
          fluido: { solid: '#5CFF9A', tint: '#062914', text: '#9BFFC2' },
          moderado: { solid: '#FFD400', tint: '#2E2500', text: '#FFE766' },
          intenso: { solid: '#FF6B6B', tint: '#3A0A0A', text: '#FFB3B3' },
        }
      : {
          fluido: { solid: '#00703A', tint: '#CFF0DC', text: '#003D1F' },
          moderado: { solid: '#8A5A00', tint: '#FFE9A8', text: '#4A3000' },
          intenso: { solid: '#B00020', tint: '#FFD6DC', text: '#5C0010' },
        },
  };
}

export function buildPalette(scheme: 'light' | 'dark', contrast: boolean): Palette {
  const base = scheme === 'dark' ? dark : light;
  return contrast ? highContrast(base, scheme === 'dark') : base;
}
