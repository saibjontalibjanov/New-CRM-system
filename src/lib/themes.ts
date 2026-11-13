import type { ThemeId } from '../types/crm';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  swatches: {
    canvas: string;
    sidebar: string;
    accent: string;
    detail: string;
    card: string;
    text: string;
  };
}

export const THEME_STORAGE_KEY = 'staravia_crm_theme';

export const THEMES: ThemeMeta[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Warm ivory canvas with forest green sidebar and gold accents',
    isDark: false,
    swatches: {
      canvas: '#F6F8F5',
      sidebar: '#103C31',
      accent: '#16745B',
      detail: '#D4A445',
      card: '#FFFFFF',
      text: '#14221D',
    },
  },
  {
    id: 'ivory-gold',
    name: 'Ivory Gold',
    description: 'Light editorial ivory with crisp white sidebar and dark gold',
    isDark: false,
    swatches: {
      canvas: '#FAF8F3',
      sidebar: '#FFFFFF',
      accent: '#946B22',
      detail: '#B68938',
      card: '#FFFFFF',
      text: '#211B12',
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Charcoal dark workspace with warm gold highlights',
    isDark: true,
    swatches: {
      canvas: '#121619',
      sidebar: '#0C1013',
      accent: '#D4A445',
      detail: '#4CA693',
      card: '#1A2024',
      text: '#F1F4F6',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Pale blue-gray canvas with deep marine teal navigation',
    isDark: false,
    swatches: {
      canvas: '#F3F7FA',
      sidebar: '#113B46',
      accent: '#087F8C',
      detail: '#D4A445',
      card: '#FFFFFF',
      text: '#10252C',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft lavender surface with deep plum sidebar and violet accent',
    isDark: false,
    swatches: {
      canvas: '#F7F5FC',
      sidebar: '#302447',
      accent: '#7453C6',
      detail: '#D4A445',
      card: '#FFFFFF',
      text: '#1F1830',
    },
  },
];

export function isValidThemeId(value: string | null | undefined): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
