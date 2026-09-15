export type BirdSkin = 'golden' | 'classic' | 'phoenix' | 'party';

export type TrailType = 'stars' | 'rainbow' | 'bubbles' | 'hearts';

export type InvincibleMode = 'godmode' | 'shatter' | 'parting' | 'trampoline';

export type GameState = 'idle' | 'playing' | 'paused';

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'star' | 'feather';
  rotation?: number;
  vRot?: number;
}

export interface PipePair {
  id: number;
  x: number;
  topHeight: number;
  gap: number;
  width: number;
  passed: boolean;
  shattered: boolean;
  shatterAlpha?: number;
  bounceOffsetTop?: number;
  bounceOffsetBottom?: number;
  partOffset?: number; // How much it parted dynamically
}

export interface GameStats {
  score: number;
  highScore: number;
  pipesSmashed: number;
  trampolineBounces: number;
  pipesCleared: number;
  flaps: number;
  losses: number; // Always 0!
  winRate: number; // Always 100%
  consecutiveWins: number;
}
