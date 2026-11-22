import { Player, Room, PowerUp, Projectile } from '../types/game';

const GRID_SIZE = 20;

export class BotGameController {
  private room: Room;
  private onUpdate: (room: Room) => void;
  private onGameOver: (winner: Player | null) => void;
  private timerId: any = null;
  private botMoveTimer: any = null;

  constructor(
    playerProfile: { name: string; avatar: string; color: string },
    difficulty: 'easy' | 'normal' | 'hard' = 'normal',
    onUpdate: (room: Room) => void,
    onGameOver: (winner: Player | null) => void
  ) {
    this.onUpdate = onUpdate;
    this.onGameOver = onGameOver;

    const grid: number[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_SIZE; x++) row.push(0);
      grid.push(row);
    }

    grid[1][1] = 1;
    grid[18][18] = 2;

    const humanPlayer: Player = {
      id: 'human',
      name: playerProfile.name || 'あなた',
      avatar: playerProfile.avatar || '⚡',
      color: playerProfile.color || '#00f3ff',
      x: 1,
      y: 1,
      direction: 'RIGHT',
      score: 0,
      territoryCount: 1,
      health: 100,
      maxHealth: 100,
      kills: 0,
      isReady: true
    };

    const botPlayer: Player = {
      id: 'bot',
      name: difficulty === 'hard' ? 'AI MASTER [難]' : difficulty === 'easy' ? 'AI ROOKIE [易]' : 'AI CYBER [普通]',
      avatar: '🤖',
      color: '#ff007f',
      x: 18,
      y: 18,
      direction: 'LEFT',
      score: 0,
      territoryCount: 1,
      health: 100,
      maxHealth: 100,
      kills: 0,
      isReady: true,
      isBot: true
    };

    this.room = {
      id: 'BOT-SOLO',
      name: 'ソロ練習モード',
      hostId: 'human',
      status: 'playing',
      maxPlayers: 2,
      players: {
        human: humanPlayer,
        bot: botPlayer
      },
      grid,
      powerups: [],
      projectiles: [],
      timeRemaining: 60,
      chat: [
        {
          id: 'bot-msg-1',
          senderId: 'bot',
          senderName: botPlayer.name,
          senderColor: '#ff007f',
          text: 'よろしく！全力で領地を奪うよ🔥',
          timestamp: Date.now()
        }
      ]
    };

    this.startLoop(difficulty);
  }

  private startLoop(difficulty: 'easy' | 'normal' | 'hard') {
    let tickCount = 0;
    const botInterval = difficulty === 'hard' ? 220 : difficulty === 'easy' ? 450 : 320;

    // 20Hz Tick Loop
    this.timerId = setInterval(() => {
      if (this.room.status !== 'playing') return;

      tickCount++;
      if (tickCount % 20 === 0) {
        this.room.timeRemaining -= 1;

        // Spawn powerups
        if (this.room.powerups.length < 3 && Math.random() < 0.4) {
          const types: PowerUp['type'][] = ['speed', 'shield', 'bomb', 'blaster'];
          const type = types[Math.floor(Math.random() * types.length)];
          const rx = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
          const ry = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
          this.room.powerups.push({ id: `bot-p-${Date.now()}`, type, x: rx, y: ry });
        }

        if (this.room.timeRemaining <= 0) {
          this.endMatch();
          return;
        }
      }

      // Projectiles update
      const activeProjectiles: Projectile[] = [];
      for (const proj of this.room.projectiles) {
        proj.x += proj.vx * 0.7;
        proj.y += proj.vy * 0.7;
        proj.range -= 0.7;

        let hit = false;
        const cellX = Math.round(proj.x);
        const cellY = Math.round(proj.y);

        if (cellX < 0 || cellX >= GRID_SIZE || cellY < 0 || cellY >= GRID_SIZE || proj.range <= 0) {
          hit = true;
          const validX = Math.max(0, Math.min(GRID_SIZE - 1, cellX));
          const validY = Math.max(0, Math.min(GRID_SIZE - 1, cellY));
          const shooter = this.room.players[proj.ownerId];
          if (shooter) {
            const colorIdx = proj.ownerId === 'human' ? 1 : 2;
            this.room.grid[validY][validX] = colorIdx;
            this.updateTerritories();
          }
        } else {
          for (const player of Object.values(this.room.players)) {
            if (player.id !== proj.ownerId) {
              const dist = Math.hypot(player.x - proj.x, player.y - proj.y);
              if (dist < 0.8) {
                hit = true;
                if (player.hasShield) {
                  player.hasShield = false;
                } else {
                  player.health = Math.max(0, player.health - 35);
                  if (player.health <= 0) {
                    const shooter = this.room.players[proj.ownerId];
                    if (shooter) {
                      shooter.kills += 1;
                      shooter.score += 200;
                    }
                    player.health = 100;
                    if (player.id === 'human') {
                      player.x = 1;
                      player.y = 1;
                    } else {
                      player.x = 18;
                      player.y = 18;
                    }
                  }
                }
                break;
              }
            }
          }
        }

        if (!hit) activeProjectiles.push(proj);
      }
      this.room.projectiles = activeProjectiles;

      this.onUpdate({ ...this.room });
    }, 50);

    // Bot AI Decision Loop
    this.botMoveTimer = setInterval(() => {
      if (this.room.status !== 'playing') return;
      this.executeBotStep(difficulty);
    }, botInterval);
  }

  private executeBotStep(difficulty: string) {
    const bot = this.room.players['bot'];
    const human = this.room.players['human'];
    if (!bot || !human) return;

    // AI Logic:
    // 1. If powerup exists, 40% bias to move towards it
    // 2. Otherwise claim neutral/human territory
    // 3. If human is in line of sight, 30% chance to shoot!

    // Check shoot line
    if (bot.x === human.x || bot.y === human.y) {
      if (Math.random() < (difficulty === 'hard' ? 0.45 : 0.25)) {
        let dir: Player['direction'] = bot.direction;
        if (bot.x === human.x) {
          dir = human.y > bot.y ? 'DOWN' : 'UP';
        } else {
          dir = human.x > bot.x ? 'RIGHT' : 'LEFT';
        }
        bot.direction = dir;
        this.botShoot();
        return;
      }
    }

    // Determine target
    let targetX = human.x;
    let targetY = human.y;

    if (this.room.powerups.length > 0 && Math.random() < 0.5) {
      targetX = this.room.powerups[0].x;
      targetY = this.room.powerups[0].y;
    }

    const possibleMoves = [
      { dx: 1, dy: 0, dir: 'RIGHT' as const },
      { dx: -1, dy: 0, dir: 'LEFT' as const },
      { dx: 0, dy: 1, dir: 'DOWN' as const },
      { dx: 0, dy: -1, dir: 'UP' as const }
    ];

    // Score each move
    let bestMove = possibleMoves[0];
    let bestScore = -9999;

    for (const move of possibleMoves) {
      const nx = bot.x + move.dx;
      const ny = bot.y + move.dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;

      let score = Math.random() * 20;
      // Bonus if moving towards target
      const currentDist = Math.hypot(bot.x - targetX, bot.y - targetY);
      const nextDist = Math.hypot(nx - targetX, ny - targetY);
      if (nextDist < currentDist) score += 40;

      // Bonus if tile is not bot's yet
      if (this.room.grid[ny][nx] !== 2) {
        score += 35;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    bot.x += bestMove.dx;
    bot.y += bestMove.dy;
    bot.direction = bestMove.dir;

    // Claim tile
    const prev = this.room.grid[bot.y][bot.x];
    if (prev !== 2) {
      this.room.grid[bot.y][bot.x] = 2;
      bot.score += prev === 1 ? 25 : 10;
      this.updateTerritories();
    }

    // Check powerup pickup
    const pIdx = this.room.powerups.findIndex(p => p.x === bot.x && p.y === bot.y);
    if (pIdx !== -1) {
      const item = this.room.powerups.splice(pIdx, 1)[0];
      if (item.type === 'shield') bot.hasShield = true;
      else if (item.type === 'bomb') {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const bx = bot.x + dx;
            const by = bot.y + dy;
            if (bx >= 0 && bx < GRID_SIZE && by >= 0 && by < GRID_SIZE) {
              this.room.grid[by][bx] = 2;
            }
          }
        }
        this.updateTerritories();
      }
    }
  }

  private botShoot() {
    const bot = this.room.players['bot'];
    if (!bot) return;

    let vx = 0;
    let vy = 0;
    if (bot.direction === 'UP') vy = -1;
    else if (bot.direction === 'DOWN') vy = 1;
    else if (bot.direction === 'LEFT') vx = -1;
    else if (bot.direction === 'RIGHT') vx = 1;

    this.room.projectiles.push({
      id: `bot-proj-${Date.now()}`,
      ownerId: 'bot',
      color: bot.color,
      x: bot.x + vx * 0.6,
      y: bot.y + vy * 0.6,
      vx,
      vy,
      range: 12
    });
  }

  public humanMove(dx: number, dy: number) {
    if (this.room.status !== 'playing') return;
    const human = this.room.players['human'];
    if (!human) return;

    const nx = Math.max(0, Math.min(GRID_SIZE - 1, human.x + dx));
    const ny = Math.max(0, Math.min(GRID_SIZE - 1, human.y + dy));

    if (dx > 0) human.direction = 'RIGHT';
    else if (dx < 0) human.direction = 'LEFT';
    else if (dy > 0) human.direction = 'DOWN';
    else if (dy < 0) human.direction = 'UP';

    const moved = nx !== human.x || ny !== human.y;
    human.x = nx;
    human.y = ny;

    if (moved) {
      const prev = this.room.grid[ny][nx];
      if (prev !== 1) {
        this.room.grid[ny][nx] = 1;
        human.score += prev === 2 ? 25 : 10;
        this.updateTerritories();
      }

      // Check powerup
      const pIdx = this.room.powerups.findIndex(p => p.x === nx && p.y === ny);
      if (pIdx !== -1) {
        const item = this.room.powerups.splice(pIdx, 1)[0];
        if (item.type === 'shield') human.hasShield = true;
        else if (item.type === 'bomb') {
          for (let bdy = -1; bdy <= 1; bdy++) {
            for (let bdx = -1; bdx <= 1; bdx++) {
              const tx = human.x + bdx;
              const ty = human.y + bdy;
              if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                this.room.grid[ty][tx] = 1;
              }
            }
          }
          human.score += 120;
          this.updateTerritories();
        }
      }
      this.onUpdate({ ...this.room });
    }
  }

  public humanShoot() {
    if (this.room.status !== 'playing') return;
    const human = this.room.players['human'];
    if (!human) return;

    let vx = 0;
    let vy = 0;
    if (human.direction === 'UP') vy = -1;
    else if (human.direction === 'DOWN') vy = 1;
    else if (human.direction === 'LEFT') vx = -1;
    else if (human.direction === 'RIGHT') vx = 1;

    this.room.projectiles.push({
      id: `human-proj-${Date.now()}`,
      ownerId: 'human',
      color: human.color,
      x: human.x + vx * 0.6,
      y: human.y + vy * 0.6,
      vx,
      vy,
      range: 12
    });

    this.onUpdate({ ...this.room });
  }

  public sendChat(text: string, isStamp: boolean = false) {
    const human = this.room.players['human'];
    if (!human) return;
    this.room.chat.push({
      id: `chat-${Date.now()}`,
      senderId: 'human',
      senderName: human.name,
      senderColor: human.color,
      text,
      isStamp,
      timestamp: Date.now()
    });
    this.onUpdate({ ...this.room });
  }

  private updateTerritories() {
    let humanCount = 0;
    let botCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.room.grid[y][x] === 1) humanCount++;
        else if (this.room.grid[y][x] === 2) botCount++;
      }
    }
    if (this.room.players['human']) this.room.players['human'].territoryCount = humanCount;
    if (this.room.players['bot']) this.room.players['bot'].territoryCount = botCount;
  }

  private endMatch() {
    this.destroy();
    this.room.status = 'finished';
    this.updateTerritories();

    const human = this.room.players['human'];
    const bot = this.room.players['bot'];

    const humanScore = human.territoryCount * 10 + human.score;
    const botScore = bot.territoryCount * 10 + bot.score;

    let winner = humanScore >= botScore ? human : bot;
    this.room.winner = winner;
    this.onGameOver(winner);
  }

  public destroy() {
    if (this.timerId) clearInterval(this.timerId);
    if (this.botMoveTimer) clearInterval(this.botMoveTimer);
  }
}
