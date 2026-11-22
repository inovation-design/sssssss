import { writeFileSync } from 'node:fs';

const gameServerUrl = (process.env.VITE_GAME_SERVER_URL || '').trim().replace(/\/$/, '');
if (gameServerUrl && !/^https?:\/\//i.test(gameServerUrl)) {
  throw new Error('VITE_GAME_SERVER_URL must be an http(s) URL.');
}

writeFileSync(
  new URL('../dist/game-config.js', import.meta.url),
  `window.GAME_SERVER_URL = ${JSON.stringify(gameServerUrl)};\n`,
  'utf8'
);
