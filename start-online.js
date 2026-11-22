import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloudflaredPath = path.join(__dirname, 'bin', 'cloudflared.exe');
const publicUrlFile = path.join(__dirname, 'PUBLIC_URL.txt');

console.log('----------------------------------------------------');
console.log('🚀 Starting Online Battle Game Server + Cloudflare Tunnel...');
console.log('----------------------------------------------------');

// 1. Start Server
const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

// 2. Start Cloudflare Tunnel
const tunnelProcess = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:3001'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

let tunnelUrl = null;

const checkOutput = (data) => {
  const text = data.toString();
  // Match trycloudflare.com URL
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[0];
    fs.writeFileSync(publicUrlFile, tunnelUrl, 'utf-8');
    console.log('\n====================================================');
    console.log('🎉 異なるネットワークから遊べる公開URLが発行されました！');
    console.log(`👉 公開URL: ${tunnelUrl}`);
    console.log('📱 スマホや別のWi-FiのPCからこのURLを開くだけで対戦できます！');
    console.log('（URLは PUBLIC_URL.txt にも保存されています）');
    console.log('====================================================\n');
  }
};

tunnelProcess.stdout.on('data', checkOutput);
tunnelProcess.stderr.on('data', checkOutput);

tunnelProcess.on('error', (err) => {
  console.error('❌ Failed to start cloudflared:', err);
});

// Clean shutdown on Ctrl+C or kill
const cleanup = () => {
  console.log('\n🛑 Shutting down server and tunnel...');
  try {
    tunnelProcess.kill('SIGINT');
  } catch (e) {}
  try {
    serverProcess.kill('SIGINT');
  } catch (e) {}
  if (fs.existsSync(publicUrlFile)) {
    try { fs.unlinkSync(publicUrlFile); } catch (e) {}
  }
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
