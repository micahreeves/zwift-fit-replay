// src/config/maps.ts

export interface MapConfig {
  name: string;
  bounds: [number, number, number, number];
  image: string;
  maxWidth: number;
  defaultZoom: number;
}

export const MAPS: Record<string, MapConfig> = {
  watopia: {
    name: 'Watopia',
    bounds: [-11.7312459858570843, -11.5302123974889117, 166.8583004484408434, 167.0323693223594717],
    image: '/maps/watopia.png',
    maxWidth: 1024,
    defaultZoom: 1
  },
  // ... other maps
} as const;

export const VIDEO_SETTINGS = {
  maxFrames: 1200,
  frameRate: 60,
  quality: {
    crf: 23,
    preset: 'slow'
  }
} as const;

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['fit', 'gpx'] as const
} as const;
