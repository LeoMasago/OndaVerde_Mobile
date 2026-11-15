import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ícone decorativo: o significado sempre vem junto em texto, por isso é escondido dos leitores de tela. */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    />
  );
}
