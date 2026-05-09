/**
 * Style Configuration System
 * Defines niche-specific caption and video styling
 */

export interface StyleConfig {
  name: string;
  description: string;
  niche: string;

  // Subtitle styling
  caption: {
    fontFamily: string;
    fontSize: number;
    bold: boolean;
    color: string;
    backgroundColor: string;
    opacity: number;
    borderStyle: number;
    borderWidth: number;
    shadowDepth: number;
    alignment: 'left' | 'center' | 'right';
  };

  // Video styling
  video: {
    aspectRatio: '9:16' | '16:9' | '1:1';
    backgroundColor: string;
    maxBrightness: number;
    vibrance: number;
    saturation: number;
  };

  // Animation
  animation: {
    wordHighlightColor: string;
    wordHighlightDuration: number; // milliseconds
    captionFadeInDuration: number;
    captionFadeOutDuration: number;
  };

  // Audio
  audio: {
    duckingAmount: number; // 0-1, how much to reduce background music
    duckingThreshold: number; // dB threshold to trigger ducking
  };
}

const stylePresets: Record<string, StyleConfig> = {
  barber: {
    name: 'Barber Shop',
    description: 'Bold, centered captions for barbershop content',
    niche: 'barbershop',
    caption: {
      fontFamily: 'Arial',
      fontSize: 56,
      bold: true,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      opacity: 0.85,
      borderStyle: 3,
      borderWidth: 2,
      shadowDepth: 3,
      alignment: 'center',
    },
    video: {
      aspectRatio: '9:16',
      backgroundColor: '#1A1A1A',
      maxBrightness: 1.15,
      vibrance: 1.2,
      saturation: 1.1,
    },
    animation: {
      wordHighlightColor: '#FF6B35',
      wordHighlightDuration: 150,
      captionFadeInDuration: 200,
      captionFadeOutDuration: 150,
    },
    audio: {
      duckingAmount: 0.6,
      duckingThreshold: -20,
    },
  },

  gym: {
    name: 'Gym/Fitness',
    description: 'High-contrast, fast-moving captions for fitness content',
    niche: 'gym',
    caption: {
      fontFamily: 'Arial Black',
      fontSize: 64,
      bold: true,
      color: '#FF00FF',
      backgroundColor: '#000000',
      opacity: 0.9,
      borderStyle: 3,
      borderWidth: 3,
      shadowDepth: 4,
      alignment: 'center',
    },
    video: {
      aspectRatio: '9:16',
      backgroundColor: '#0D0D0D',
      maxBrightness: 1.25,
      vibrance: 1.4,
      saturation: 1.3,
    },
    animation: {
      wordHighlightColor: '#00FF00',
      wordHighlightDuration: 100,
      captionFadeInDuration: 100,
      captionFadeOutDuration: 100,
    },
    audio: {
      duckingAmount: 0.7,
      duckingThreshold: -15,
    },
  },

  minimal: {
    name: 'Minimal',
    description: 'Clean, subtle captions for professional content',
    niche: 'professional',
    caption: {
      fontFamily: 'Arial',
      fontSize: 48,
      bold: false,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      opacity: 0.7,
      borderStyle: 1,
      borderWidth: 1,
      shadowDepth: 1,
      alignment: 'center',
    },
    video: {
      aspectRatio: '16:9',
      backgroundColor: '#262626',
      maxBrightness: 1.0,
      vibrance: 0.9,
      saturation: 0.95,
    },
    animation: {
      wordHighlightColor: '#87CEEB',
      wordHighlightDuration: 200,
      captionFadeInDuration: 300,
      captionFadeOutDuration: 200,
    },
    audio: {
      duckingAmount: 0.4,
      duckingThreshold: -25,
    },
  },

  vibrant: {
    name: 'Vibrant',
    description: 'Colorful, energetic captions for entertainment content',
    niche: 'entertainment',
    caption: {
      fontFamily: 'Arial',
      fontSize: 60,
      bold: true,
      color: '#FFD700',
      backgroundColor: '#1A0033',
      opacity: 0.92,
      borderStyle: 3,
      borderWidth: 2,
      shadowDepth: 4,
      alignment: 'center',
    },
    video: {
      aspectRatio: '9:16',
      backgroundColor: '#000000',
      maxBrightness: 1.3,
      vibrance: 1.5,
      saturation: 1.4,
    },
    animation: {
      wordHighlightColor: '#FF1493',
      wordHighlightDuration: 120,
      captionFadeInDuration: 150,
      captionFadeOutDuration: 120,
    },
    audio: {
      duckingAmount: 0.65,
      duckingThreshold: -18,
    },
  },
};

/**
 * Gets a style preset by name
 * @param styleName Name of the style preset
 * @returns Style configuration object
 */
export function getStyleConfig(styleName: string = 'barber'): StyleConfig {
  return stylePresets[styleName.toLowerCase()] || stylePresets.barber;
}

/**
 * Lists all available styles
 * @returns Array of available style names
 */
export function listAvailableStyles(): string[] {
  return Object.keys(stylePresets);
}

/**
 * Generates FFmpeg filter string from style config
 * @param style Style configuration
 * @param subtitleFile Path to subtitle file
 * @returns FFmpeg filter string
 */
export function generateFilterFromStyle(
  style: StyleConfig,
  subtitleFile: string
): string {
  const escaped = subtitleFile.replace(/'/g, "'\\''");

  const colorHex = style.caption.color.replace('#', '').toLowerCase();
  const bgColorHex = style.caption.backgroundColor.replace('#', '').toLowerCase();

  const filterString = `subtitles='${escaped}':force_style='FontName=${style.caption.fontFamily},FontSize=${style.caption.fontSize},PrimaryColour=&H${bgr(colorHex)}&,BackColour=&H${Math.round(style.caption.opacity * 255)
    .toString(16)
    .padStart(2, '0')}${bgr(bgColorHex)}&,BorderStyle=${style.caption.borderStyle},Outline=${style.caption.borderWidth},Shadow=${style.caption.shadowDepth},Alignment=${getAlignmentCode(style.caption.alignment)},Bold=${style.caption.bold ? -1 : 0}'`;

  return filterString;
}

/**
 * Converts RGB hex to BGR for FFmpeg
 */
function bgr(hexColor: string): string {
  if (hexColor.length !== 6) return '000000';
  return hexColor.slice(4, 6) + hexColor.slice(2, 4) + hexColor.slice(0, 2);
}

/**
 * Maps alignment text to FFmpeg numeric code
 */
function getAlignmentCode(alignment: string): number {
  const alignmentMap: Record<string, number> = {
    left: 1,
    center: 2,
    right: 3,
  };
  return alignmentMap[alignment] || 2;
}

/**
 * Exports all presets as JSON
 */
export function exportAllStylesAsJson(): Record<string, StyleConfig> {
  return stylePresets;
}
