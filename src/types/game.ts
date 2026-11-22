export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  score: number;
  territoryCount: number;
  health: number;
  maxHealth: number;
  kills: number;
  isReady: boolean;
  hasShield?: boolean;
  speedBoost?: number;
  isBot?: boolean;
}

export interface Projectile {
  id: string;
  ownerId: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  range: number;
}

export interface PowerUp {
  id: string;
  type: 'speed' | 'bomb' | 'shield' | 'blaster';
  x: number;
  y: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  isStamp?: boolean;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  players: Record<string, Player>;
  grid: number[][]; // 20x20 cell: 0 = neutral, 1-4 = player color index
  powerups: PowerUp[];
  projectiles: Projectile[];
  timeRemaining: number;
  winner?: Player | null;
  chat: ChatMessage[];
}

export type GameMode = 'quick' | 'custom' | 'bot';
