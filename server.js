import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { randomUUID } from 'node:crypto';

// プロセスが予期せぬエラーで落ちないようガード
process.on('uncaughtException', (err) => {
  console.error('[Process UncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process UnhandledRejection]', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Open the FPS game at the shared online environment's root URL.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'fps.html')));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// サーバー側デフォルトGemini APIキー
const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// TTS音声キャッシュ（インメモリ）
const ttsCache = new Map();

function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// ----------------------------------------------------
// 1. 高品質ニューラル音声 TTS API
// ----------------------------------------------------
app.post('/api/tts', async (req, res) => {
  const { text, channel } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const cleanText = text.trim();
  const cacheKey = `${channel || 'news'}_${cleanText}`;

  if (ttsCache.has(cacheKey)) {
    const cachedBuffer = ttsCache.get(cacheKey);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cachedBuffer);
  }

  try {
    const tts = new MsEdgeTTS();

    let voiceName = 'ja-JP-NanamiNeural';
    let rate = '+10%';
    let pitch = '+0Hz';

    if (channel === 'documentary') {
      voiceName = 'ja-JP-KeitaNeural';
      rate = '-10%';
      pitch = '-3Hz';
    } else if (channel === 'investigation') {
      voiceName = 'ja-JP-DaichiNeural';
      rate = '+6%';
      pitch = '-1Hz';
    }

    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const safeText = escapeXml(cleanText);
    const { audioStream } = tts.toStream(safeText, {
      rate: rate,
      pitch: pitch
    });

    const chunks = [];
    let isFinished = false;

    audioStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      if (isFinished) return;
      isFinished = true;

      const audioBuffer = Buffer.concat(chunks);
      if (audioBuffer.length > 0) {
        if (ttsCache.size > 200) {
          const firstKey = ttsCache.keys().next().value;
          ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, audioBuffer);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(audioBuffer);
      } else {
        if (!res.headersSent) res.status(500).json({ error: 'Empty audio output' });
      }
    });

    audioStream.on('error', (err) => {
      console.warn('Edge TTS audioStream warning:', err?.message || err);
      if (!isFinished && !res.headersSent) {
        isFinished = true;
        // バッファがある程度あればそれを返し、無ければ500
        if (chunks.length > 0) {
          const partialBuffer = Buffer.concat(chunks);
          res.setHeader('Content-Type', 'audio/mpeg');
          res.send(partialBuffer);
        } else {
          res.status(500).json({ error: 'TTS stream interrupted' });
        }
      }
    });
  } catch (err) {
    console.error('TTS handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal TTS error: ' + err.message });
    }
  }
});

// ----------------------------------------------------
// 2. Gemini マルチモーダル画像解析 API (3.8-flash 優先 ＋ 自動フォールバック)
// ----------------------------------------------------
app.post('/api/analyze', async (req, res) => {
  const { imageBase64, mimeType, apiKey } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const effectiveKey = (apiKey && apiKey.trim().length > 0) ? apiKey.trim() : DEFAULT_GEMINI_API_KEY;

  const cleanBase64 = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;

  const prompt = `
あなたは日本のテレビ局の敏腕チーフプロデューサー兼放送作家です。
提供された画像（日常のスクショ、写真、LINEトーク、部屋、食事など）を徹底的に観察・マルチモーダル解析し、テレビ番組風の「実況動画用台本（3チャンネル分）」をJSON形式で生成してください。

【厳格な禁止ルール】
- AIがやりがちな「紫〜青のグラデーション的思考」「絵文字（🚀✨💡など）の乱用」「翻訳調のテンションが高い応援文言」は一切禁止。
- 実際の日本の地上波テレビ局（NHK、テレビ朝日、TBS、フジテレビ等）の報道番組、ドキュメンタリー、警察密着特番のような、リアルで重厚、緊張感とユーモア（大真面目にくだらないことを論じるシュールさ）を極限まで追求してください。

【3つの番組スタイル要件】
1. news（【NEWS 24】緊急ニュース速報・報道アナウンサー風）
   - 画面の些細な出来事や写り込みを、まるで国家的危機や重大スクープのように極めて真面目で大げさな報道口調で分析。
   - 例: 「先ほど入ってきた速報によりますと…」「専門家は角度の計算に最低7分は要したと指摘…」「容疑者は黙秘を続けています」
   - 見出し(headline)、サブ見出し(subheadline)、画面下のニュースティッカー(tickerText)、4つのナレーションフレーズ(lines)。

2. documentary（【情熱の流儀】密着ドキュメンタリー風）
   - くだらない行動や何気ないスクショに対し、本人の「壮大な信念・葛藤・プロフェッショナルな美学」を勝手に捏造し、低く静かなトーンでしみじみと語る。
   - 例: 「男はフォークを置いた。『一口目を食べる前に、世界に見せなきゃいけないものがある』…」「そこにあったのは、冷めゆく泡との静かな対話だった」

3. investigation（【特別捜査本部】プロファイリング尋問風）
   - 画像の細部（バッテリー残量、通知、反射、散らかり、角度、タイムスタンプ等）から、撮影者の隠された心理や嘘・承認欲求を冷徹に暴き出す。
   - 各ラインに、画像上の注目座標 evidencePoint ({ x: 0-100, y: 0-100, label: string, detail: string }) を含めること。

【出力JSONフォーマット】
以下のキー構造を持つ純粋なJSONのみを返してください（Markdownのバッククォート等も含めずJSONのみ）:
{
  "news": {
    "channelId": "news",
    "channelName": "NEWS 24 緊急報道特番",
    "badge": "BREAKING NEWS",
    "headline": "【速報】〇〇に関する重大事案",
    "subheadline": "〇〇をめぐり現場には緊張が走る",
    "tickerText": "◆速報：〇〇 専門家「〇〇の可能性が高い」と警鐘 現場周辺では現在も調査が継続中",
    "speechParams": { "rate": 1.05, "pitch": 1.05 },
    "lines": [
      { "text": "読み上げ文1", "displaySubtitle": "画面表示用テロップ1", "speaker": "報道アナウンサー" },
      { "text": "読み上げ文2", "displaySubtitle": "画面表示用テロップ2", "speaker": "報道アナウンサー" },
      { "text": "読み上げ文3", "displaySubtitle": "画面表示用テロップ3", "speaker": "報道アナウンサー" },
      { "text": "読み上げ文4", "displaySubtitle": "画面表示用テロップ4", "speaker": "報道アナウンサー" }
    ]
  },
  "documentary": {
    "channelId": "documentary",
    "channelName": "情熱の流儀",
    "badge": "密着365日",
    "headline": "〇〇。男が見据える、名もなき真実。",
    "subheadline": "何気ない日常の裏に秘められた、美学と孤独の肖像",
    "tickerText": "情熱の流儀 ── 誰も見ていないところで、人は己と戦っている。静かなる決断の記録。",
    "speechParams": { "rate": 0.88, "pitch": 0.85 },
    "lines": [
      { "text": "語り文1", "displaySubtitle": "画面表示用テロップ1", "speaker": "語り" },
      { "text": "語り文2", "displaySubtitle": "画面表示用テロップ2", "speaker": "語り" },
      { "text": "語り文3", "displaySubtitle": "画面表示用テロップ3", "speaker": "語り" },
      { "text": "語り文4", "displaySubtitle": "画面表示用テロップ4", "speaker": "語り" }
    ]
  },
  "investigation": {
    "channelId": "investigation",
    "channelName": "警視庁特別捜査班 EVIDENCE LOG",
    "badge": "EVIDENCE #01",
    "headline": "【鑑識完了】〇〇から読み解く計画的偽装工作の全貌",
    "subheadline": "照準特定：〇〇および〇〇の相関関係",
    "tickerText": "ALERT: EVIDENCE DETECTED // TARGET ANALYSIS COMPLETE // PSYCHOLOGICAL PROFILE: DECEPTION SUSPECTED",
    "speechParams": { "rate": 1.1, "pitch": 0.95 },
    "lines": [
      {
        "text": "捜査官の冷徹な分析文1",
        "displaySubtitle": "鑑識テロップ1",
        "speaker": "特別捜査官",
        "evidencePoint": { "x": 45, "y": 60, "label": "注目点ラベル", "detail": "暴かれた心理や証拠内容" }
      },
      {
        "text": "捜査官の冷徹な分析文2",
        "displaySubtitle": "鑑識テロップ2",
        "speaker": "特別捜査官",
        "evidencePoint": { "x": 30, "y": 40, "label": "注目点ラベル", "detail": "詳細" }
      },
      {
        "text": "捜査官の冷徹な分析文3",
        "displaySubtitle": "鑑識テロップ3",
        "speaker": "特別捜査官",
        "evidencePoint": { "x": 70, "y": 20, "label": "注目点ラベル", "detail": "詳細" }
      },
      {
        "text": "捜査官の冷徹な分析文4",
        "displaySubtitle": "鑑識テロップ4",
        "speaker": "特別捜査官",
        "evidencePoint": { "x": 50, "y": 50, "label": "注目点ラベル", "detail": "詳細" }
      }
    ]
  }
}
`;

  try {
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3-flash-preview'
    ];

    let geminiRes = null;
    let successfulModel = '';

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              responseMimeType: 'application/json'
            }
          })
        });

        if (res.ok) {
          geminiRes = res;
          successfulModel = model;
          break;
        } else {
          console.warn(`Model ${model} returned status ${res.status}. Trying next candidate...`);
        }
      } catch (callErr) {
        console.warn(`Call to ${model} failed:`, callErr);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      return res.status(503).json({ error: 'AI解析モデルが一時的に混み合っています。しばらく待ってから再度お試しください。' });
    }

    console.log(`[AI Analysis] Successfully generated scripts using ${successfulModel}`);
    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: 'AIからの応答が空でした。' });
    }

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '画像解析に失敗しました: ' + err.message });
    }
  }
});

// ----------------------------------------------------
// 課題管理表: 写真から課題と提出期限を抽出
// API キーはブラウザーへ渡さず、サーバー環境変数だけで管理する。
// ----------------------------------------------------
app.post('/api/assignments/analyze-image', async (req, res) => {
  const { imageBase64, mimeType } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return res.status(503).json({ error: 'サーバーに GEMINI_API_KEY が設定されていません。' });
  }
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    return res.status(400).json({ error: '画像データがありません。' });
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return res.status(400).json({ error: 'JPEG、PNG、WebP画像を選んでください。' });
  }

  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',').pop() : imageBase64;
  if (cleanBase64.length > 12_000_000) {
    return res.status(413).json({ error: '画像が大きすぎます。12MB未満の画像を選んでください。' });
  }

  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const prompt = `この画像から学校の課題・宿題だけを読み取ってください。今日の日付は ${today}（日本時間）です。
画像に書かれていない課題や期限を推測で作らないでください。期限が不明または読み取れない場合は due_date を空文字にしてください。
JSONのみを返してください。形式: {"assignments":[{"subject":"英語|数学|国語|理科|社会|情報|その他","title":"課題名","due_date":"YYYY-MM-DD または空文字","note":"読み取り上の注意。なければ空文字"}]}
日付が「6/20」のように年なしの場合は、今日以降で最も近い日付にしてください。課題が読み取れなければ assignments は空配列にしてください。`;

  try {
    const model = process.env.GEMINI_ASSIGNMENT_MODEL || 'gemini-3.1-flash-lite';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: cleanBase64 } },
          ] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 4096 },
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      console.error('Gemini assignment analysis failed:', result);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429
          ? 'AIの無料利用上限に達した可能性があります。時間をおいて再試行してください。'
          : 'AI画像解析に失敗しました。APIキーとモデル設定を確認してください。',
      });
    }

    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) return res.status(502).json({ error: 'AIから解析結果が返りませんでした。' });
    const parsed = JSON.parse(text);
    const assignments = Array.isArray(parsed.assignments) ? parsed.assignments : [];
    const validAssignments = assignments
      .filter((item) => item && typeof item.title === 'string' && item.title.trim())
      .slice(0, 30)
      .map((item) => ({
        subject: ['英語', '数学', '国語', '理科', '社会', '情報', 'その他'].includes(item.subject)
          ? item.subject : 'その他',
        title: item.title.trim().slice(0, 300),
        due_date: /^\d{4}-\d{2}-\d{2}$/.test(item.due_date || '') ? item.due_date : '',
        note: typeof item.note === 'string' ? item.note.slice(0, 300) : '',
      }));

    res.json({ assignments: validAssignments });
  } catch (error) {
    console.error('Assignment image analysis error:', error);
    res.status(502).json({ error: '解析結果を処理できませんでした。画像を確認して再試行してください。' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    tts: 'available',
    socketIo: 'available',
    hasApiKey: Boolean(DEFAULT_GEMINI_API_KEY)
  });
});

// SPA ルーティング
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
      if (err) next();
    });
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

const gameRooms = new Map();
// 3D FPS rooms share this server's Socket.IO connection.
const fpsRooms = new Map();
const fpsShotTimes = new Map();
const fpsCover = [
  [0,-31,64,2,2], [0,31,64,2,2], [-31,0,2,2,64], [31,0,2,2,64],
  [0,0,3,3,3],[-12,-10,8,2,2],[-5,-13,2,2,8],[10,-12,7,2,2],[15,-6,2,3,8],[4,-5,5,1.2,2],[-17,3,2,3,9],[-10,8,7,2,2],[-3,13,2,3,8],[10,8,8,2,2],[17,15,2,2,7],[5,18,8,1.1,2],[0,-22,2,3,8],[22,0,7,2,2],[-22,18,6,2,2],[20,-20,6,2,2],[0,4,7,1.2,2]
];
const fpsPoles = [];
for (let x=-24; x<=24; x+=8) for (let z=-24; z<=24; z+=8) fpsPoles.push([x,z,.18,2.2]);
const fpsSpawns = [[-27,-27],[27,27],[27,-27],[-27,27],[-27,0],[27,0],[0,-27],[0,27]];
const fpsBlocked = (x,z,r=.42) => fpsCover.some(([cx,cz,w,,d]) => Math.abs(x-cx)<w/2+r && Math.abs(z-cz)<d/2+r) || fpsPoles.some(([cx,cz,d]) => Math.hypot(x-cx,z-cz)<d/2+r);
const fpsRayBlocked = (x,y,z) => fpsCover.some(([cx,cz,w,h,d]) => Math.abs(x-cx)<w/2 && Math.abs(z-cz)<d/2 && y>=0 && y<=h) || fpsPoles.some(([cx,cz,r,h]) => Math.hypot(x-cx,z-cz)<r && y>=0 && y<=h);
const roomModes = new Map();
const roomSlots = new Map();
const roomTimers = new Map();
const moveTimes = new Map();
const shotTimes = new Map();
const gridSize = 20;
const playerColors = ['#00f3ff', '#ff007f', '#39ff14', '#ffaa00'];
const spawnPoints = [{ x: 1, y: 1 }, { x: 18, y: 18 }, { x: 18, y: 1 }, { x: 1, y: 18 }];

function getRoomSummary(room) {
  return {
    id: room.id,
    name: room.name,
    playerCount: Object.keys(room.players).length,
    maxPlayers: room.maxPlayers,
    status: room.status
  };
}

function getPublicRooms() {
  return [...gameRooms.values()]
    .filter((room) => room.status === 'waiting')
    .map(getRoomSummary);
}

function publishRoom(room) {
  io.to(room.id).emit('room:update', room);
  io.emit('rooms:update', getPublicRooms());
}

function emitGameError(socket, message) {
  socket.emit('game:error', message);
}

function normalizeProfile(profile = {}) {
  const name = typeof profile.name === 'string' ? profile.name.trim().slice(0, 16) : '';
  const avatar = typeof profile.avatar === 'string' ? profile.avatar.slice(0, 8) : '';
  return {
    name: name || 'プレイヤー',
    avatar: avatar || '⚡',
    color: playerColors.includes(profile.color) ? profile.color : playerColors[0]
  };
}

function createPlayer(id, profile, slot) {
  const spawn = spawnPoints[slot - 1];
  return {
    id,
    name: profile.name,
    avatar: profile.avatar,
    color: profile.color,
    x: spawn.x,
    y: spawn.y,
    direction: slot === 1 ? 'RIGHT' : slot === 2 ? 'LEFT' : slot === 3 ? 'DOWN' : 'UP',
    score: 0,
    territoryCount: 1,
    health: 100,
    maxHealth: 100,
    kills: 0,
    isReady: false
  };
}

function createGameRoom(socket, name, profile, mode) {
  let id;
  do {
    id = randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase();
  } while (gameRooms.has(id));

  const maxPlayers = mode === 'quick' ? 2 : 4;
  const room = {
    id,
    name: String(name || '対戦ルーム').trim().slice(0, 24) || '対戦ルーム',
    hostId: socket.id,
    status: 'waiting',
    maxPlayers,
    players: { [socket.id]: createPlayer(socket.id, normalizeProfile(profile), 1) },
    grid: Array.from({ length: gridSize }, () => Array(gridSize).fill(0)),
    powerups: [],
    projectiles: [],
    timeRemaining: 60,
    winner: null,
    chat: []
  };
  room.grid[1][1] = 1;
  gameRooms.set(id, room);
  roomModes.set(id, mode);
  roomSlots.set(id, new Map([[socket.id, 1]]));
  socket.data.roomId = id;
  socket.join(id);
  return room;
}

function addPlayerToRoom(socket, room, profile) {
  const slots = roomSlots.get(room.id);
  const usedSlots = new Set(slots.values());
  let slot = 1;
  while (usedSlots.has(slot) && slot <= room.maxPlayers) slot++;
  if (slot > room.maxPlayers) return false;

  room.players[socket.id] = createPlayer(socket.id, normalizeProfile(profile), slot);
  slots.set(socket.id, slot);
  const spawn = spawnPoints[slot - 1];
  room.grid[spawn.y][spawn.x] = slot;
  socket.data.roomId = room.id;
  socket.join(room.id);
  return true;
}

function updateTerritories(room) {
  const counts = Array(room.maxPlayers + 1).fill(0);
  for (const row of room.grid) {
    for (const owner of row) {
      if (owner > 0 && owner < counts.length) counts[owner]++;
    }
  }
  for (const [playerId, player] of Object.entries(room.players)) {
    player.territoryCount = counts[roomSlots.get(room.id)?.get(playerId)] || 0;
  }
}

function clearRoomTimer(roomId) {
  const timer = roomTimers.get(roomId);
  if (timer) clearInterval(timer);
  roomTimers.delete(roomId);
}

function finishGame(room) {
  clearRoomTimer(room.id);
  updateTerritories(room);
  const players = Object.values(room.players);
  const ranked = [...players].sort((a, b) => (b.score + b.territoryCount * 10) - (a.score + a.territoryCount * 10));
  room.winner = ranked.length > 1 && ranked[0].score + ranked[0].territoryCount * 10 === ranked[1].score + ranked[1].territoryCount * 10
    ? null
    : ranked[0] || null;
  room.status = 'finished';
  publishRoom(room);
}

function claimCell(room, playerId, x, y) {
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
  const player = room.players[playerId];
  const slot = roomSlots.get(room.id)?.get(playerId);
  if (!player || !slot || room.grid[y][x] === slot) return;
  player.score += room.grid[y][x] === 0 ? 10 : 25;
  room.grid[y][x] = slot;
  updateTerritories(room);
}

function startRoomTimer(room) {
  clearRoomTimer(room.id);
  let elapsed = 0;
  const timer = setInterval(() => {
    if (room.status !== 'playing') {
      clearRoomTimer(room.id);
      return;
    }
    elapsed++;
    if (elapsed % 10 === 0) room.timeRemaining = Math.max(0, room.timeRemaining - 1);

    const remaining = [];
    for (const projectile of room.projectiles) {
      projectile.x += projectile.vx * 0.35;
      projectile.y += projectile.vy * 0.35;
      projectile.range -= 0.35;
      const cellX = Math.round(projectile.x);
      const cellY = Math.round(projectile.y);
      let hit = cellX < 0 || cellX >= gridSize || cellY < 0 || cellY >= gridSize || projectile.range <= 0;

      if (!hit) {
        const target = Object.values(room.players).find((player) =>
          player.id !== projectile.ownerId && Math.hypot(player.x - projectile.x, player.y - projectile.y) < 0.65
        );
        if (target) {
          hit = true;
          if (target.hasShield) target.hasShield = false;
          else {
            target.health = Math.max(0, target.health - 35);
            if (target.health === 0) {
              const shooter = room.players[projectile.ownerId];
              if (shooter) {
                shooter.kills++;
                shooter.score += 200;
              }
              target.health = target.maxHealth;
              const spawn = spawnPoints[(roomSlots.get(room.id)?.get(target.id) || 1) - 1];
              target.x = spawn.x;
              target.y = spawn.y;
            }
          }
        }
      }

      if (hit) claimCell(room, projectile.ownerId, cellX, cellY);
      else remaining.push(projectile);
    }
    room.projectiles = remaining;

    if (room.timeRemaining <= 0) {
      finishGame(room);
      return;
    }
    publishRoom(room);
  }, 100);
  roomTimers.set(room.id, timer);
}

function removePlayerFromRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  socket.data.roomId = null;
  socket.leave(roomId);
  const room = gameRooms.get(roomId);
  if (!room) return;

  delete room.players[socket.id];
  roomSlots.get(roomId)?.delete(socket.id);
  moveTimes.delete(socket.id);
  shotTimes.delete(socket.id);

  if (Object.keys(room.players).length === 0) {
    clearRoomTimer(roomId);
    gameRooms.delete(roomId);
    roomModes.delete(roomId);
    roomSlots.delete(roomId);
    io.emit('rooms:update', getPublicRooms());
    return;
  }
  if (room.hostId === socket.id) room.hostId = Object.keys(room.players)[0];
  if (room.status === 'playing') finishGame(room);
  else publishRoom(room);
}

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  const fpsSnapshot = (id) => ({ players: Object.fromEntries([...(fpsRooms.get(id)?.players || new Map())]) });
  const joinFps = (id, profile) => {
    let room = fpsRooms.get(id);
    if (!room || room.players.size >= 8) return false;
    const guns = { AR: 30, SG: 6, SR: 5 };
    const [spawnX, spawnZ] = fpsSpawns[room.players.size % fpsSpawns.length];
    room.players.set(socket.id, { id: socket.id, name: String(profile.name || 'PLAYER').slice(0, 12), weapon: guns[profile.weapon] ? profile.weapon : 'AR', x: spawnX, z: spawnZ, yaw: 0, crouch: false, hp: 100 });
    socket.data.fpsRoom = id;
    socket.join(`fps:${id}`);
    socket.emit('fps:joined', { room: id });
    io.to(`fps:${id}`).emit('fps:state', fpsSnapshot(id));
    return true;
  };
  socket.on('fps:create', (profile = {}, callback) => {
    let id;
    do { id = String(Math.floor(1000 + Math.random() * 9000)); } while (fpsRooms.has(id));
    fpsRooms.set(id, { players: new Map() });
    const ok = joinFps(id, profile);
    if (typeof callback === 'function') callback({ ok, room: id });
  });
  socket.on('fps:join', (payload = {}, callback) => {
    const id = String(payload.room || '').replace(/\D/g, '').slice(0, 4);
    const ok = joinFps(id, payload);
    if (typeof callback === 'function') callback({ ok, error: ok ? undefined : 'ルームがないか満員です' });
  });
  socket.on('fps:state:get', ({ room } = {}) => {
    if (socket.data.fpsRoom === room) socket.emit('fps:state', fpsSnapshot(room));
  });
  socket.on('fps:move', (move = {}) => {
    const roomId = socket.data.fpsRoom, p = fpsRooms.get(roomId)?.players.get(socket.id);
    if (!p) return;
    if (Number.isFinite(move.x)) { const x = Math.max(-29, Math.min(29, move.x)); if (!fpsBlocked(x, p.z)) p.x = x; }
    if (Number.isFinite(move.z)) { const z = Math.max(-29, Math.min(29, move.z)); if (!fpsBlocked(p.x, z)) p.z = z; }
    if (Number.isFinite(move.yaw)) p.yaw = move.yaw;
    if (typeof move.crouch === 'boolean') p.crouch = move.crouch;
    io.to(`fps:${roomId}`).emit('fps:state', fpsSnapshot(roomId));
  });
  socket.on('fps:shoot', (shot = {}) => {
    const roomId = socket.data.fpsRoom, room = fpsRooms.get(roomId), shooter = room?.players.get(socket.id);
    if (!shooter || shooter.hp <= 0) return;
    const gun = ['AR', 'SG', 'SR'].includes(shot.weapon) ? shot.weapon : shooter.weapon;
    const delay = { AR: 125, SG: 750, SR: 900 }[gun], now = Date.now();
    if (now - (fpsShotTimes.get(socket.id) || 0) < delay) return;
    fpsShotTimes.set(socket.id, now);
    const origin = [shot.x, shot.y, shot.z], dir = [shot.dx, shot.dy, shot.dz];
    if (!origin.every(Number.isFinite) || !dir.every(Number.isFinite)) return;
    const reach = { AR: 45, SG: 13, SR: 80 }[gun], base = { AR: 15, SG: 22, SR: 100 }[gun];
    let wallDist = reach;
    for (let distance = .12; distance <= reach; distance += .12) {
      if (fpsRayBlocked(origin[0] + dir[0]*distance, origin[1] + dir[1]*distance, origin[2] + dir[2]*distance)) { wallDist = distance; break; }
    }
    let hitTarget = null, hitAlong = wallDist, hitDamage = 0;
    for (const target of room.players.values()) {
      if (target.id === socket.id || target.hp <= 0) continue;
      const v = [target.x - origin[0], (target.crouch ? .85 : 1.3) - origin[1], target.z - origin[2]];
      const along = v[0]*dir[0] + v[1]*dir[1] + v[2]*dir[2];
      if (along < 0 || along > hitAlong) continue;
      const dist = Math.hypot(v[0]-along*dir[0], v[1]-along*dir[1], v[2]-along*dir[2]);
      const pellets = gun === 'SG' ? Math.max(0, Math.round(8 * Math.max(0, 1-along/14))) : 1;
      if (dist < (gun === 'SG' ? .95 : .52) && pellets) {
        hitTarget = target; hitAlong = along; hitDamage = base * pellets;
      }
    }
    if (hitTarget) hitTarget.hp = Math.max(0, hitTarget.hp - hitDamage);
    const end = { x: origin[0]+dir[0]*hitAlong, y: origin[1]+dir[1]*hitAlong, z: origin[2]+dir[2]*hitAlong };
    io.to(`fps:${roomId}`).emit('fps:bullet', { from:{x:origin[0],y:origin[1],z:origin[2]}, to:end, weapon:gun });
    if (hitTarget) {
      io.to(`fps:${roomId}`).emit('fps:hit', { id: hitTarget.id, hp: hitTarget.hp, by: socket.id, damage: Math.min(hitDamage, 100), x:hitTarget.x, y:hitTarget.crouch?.85:1.3, z:hitTarget.z });
      io.to(`fps:${roomId}`).emit('fps:state', fpsSnapshot(roomId));
      if (hitTarget.hp === 0) setTimeout(() => { if (room.players.has(hitTarget.id)) { const [x,z]=fpsSpawns[Math.floor(Math.random()*fpsSpawns.length)]; hitTarget.hp=100;hitTarget.x=x;hitTarget.z=z;io.to(`fps:${roomId}`).emit('fps:state',fpsSnapshot(roomId)); } }, 5000);
    }
  });

  socket.on('rooms:list', (callback) => {
    if (typeof callback === 'function') callback(getPublicRooms());
  });

  socket.on('room:create', (payload = {}, callback) => {
    removePlayerFromRoom(socket);
    const room = createGameRoom(socket, payload.name, payload.profile, 'custom');
    if (typeof callback === 'function') callback({ ok: true, room });
    publishRoom(room);
  });

  socket.on('room:join', (payload = {}, callback) => {
    removePlayerFromRoom(socket);
    const room = gameRooms.get(String(payload.roomId || '').trim().toUpperCase());
    if (!room || room.status !== 'waiting') {
      if (typeof callback === 'function') callback({ ok: false, error: '参加できる部屋が見つかりません。' });
      return;
    }
    if (Object.keys(room.players).length >= room.maxPlayers) {
      if (typeof callback === 'function') callback({ ok: false, error: 'この部屋は満員です。' });
      return;
    }
    addPlayerToRoom(socket, room, payload.profile);
    if (typeof callback === 'function') callback({ ok: true, room });
    publishRoom(room);
  });

  socket.on('match:quick', (profile, callback) => {
    removePlayerFromRoom(socket);
    let room = [...gameRooms.values()].find((candidate) =>
      roomModes.get(candidate.id) === 'quick' &&
      candidate.status === 'waiting' &&
      Object.keys(candidate.players).length < candidate.maxPlayers
    );
    if (room) addPlayerToRoom(socket, room, profile);
    else {
      room = createGameRoom(socket, 'クイックマッチ', profile, 'quick');
      socket.emit('match:waiting');
    }
    if (typeof callback === 'function') callback({ ok: true, room });
    publishRoom(room);
  });

  socket.on('room:leave', () => removePlayerFromRoom(socket));

  socket.on('player:ready', () => {
    const room = gameRooms.get(socket.data.roomId);
    const player = room?.players[socket.id];
    if (!room || room.status !== 'waiting' || !player) return;
    player.isReady = !player.isReady;
    publishRoom(room);
  });

  socket.on('game:start', () => {
    const room = gameRooms.get(socket.data.roomId);
    if (!room || room.hostId !== socket.id || room.status !== 'waiting') return;
    const players = Object.values(room.players);
    if (players.length < 2 || !players.every((player) => player.isReady)) {
      emitGameError(socket, '全員が準備完了になってから開始できます。');
      return;
    }
    room.status = 'playing';
    room.timeRemaining = 60;
    room.projectiles = [];
    startRoomTimer(room);
    publishRoom(room);
  });

  socket.on('game:rematch', () => {
    const room = gameRooms.get(socket.data.roomId);
    if (!room || room.hostId !== socket.id || room.status !== 'finished') return;
    clearRoomTimer(room.id);
    room.grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    room.projectiles = [];
    room.powerups = [];
    room.timeRemaining = 60;
    room.winner = null;
    room.status = 'waiting';
    for (const [playerId, player] of Object.entries(room.players)) {
      const slot = roomSlots.get(room.id).get(playerId);
      const spawn = spawnPoints[slot - 1];
      Object.assign(player, {
        x: spawn.x, y: spawn.y, score: 0, territoryCount: 1,
        health: player.maxHealth, kills: 0, isReady: false, hasShield: false
      });
      room.grid[spawn.y][spawn.x] = slot;
    }
    publishRoom(room);
  });

  socket.on('player:move', (move = {}) => {
    const room = gameRooms.get(socket.data.roomId);
    const player = room?.players[socket.id];
    if (!room || room.status !== 'playing' || !player) return;
    const { dx, dy } = move;
    if (!Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) + Math.abs(dy) !== 1) return;
    const now = Date.now();
    if (now - (moveTimes.get(socket.id) || 0) < 90) return;
    moveTimes.set(socket.id, now);
    player.direction = dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : dy > 0 ? 'DOWN' : 'UP';
    player.x = Math.max(0, Math.min(gridSize - 1, player.x + dx));
    player.y = Math.max(0, Math.min(gridSize - 1, player.y + dy));
    claimCell(room, socket.id, player.x, player.y);
    publishRoom(room);
  });

  socket.on('player:shoot', () => {
    const room = gameRooms.get(socket.data.roomId);
    const player = room?.players[socket.id];
    if (!room || room.status !== 'playing' || !player) return;
    const now = Date.now();
    if (now - (shotTimes.get(socket.id) || 0) < 350) return;
    shotTimes.set(socket.id, now);
    const direction = {
      UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0]
    }[player.direction];
    room.projectiles.push({
      id: randomUUID(),
      ownerId: socket.id,
      color: player.color,
      x: player.x + direction[0] * 0.6,
      y: player.y + direction[1] * 0.6,
      vx: direction[0],
      vy: direction[1],
      range: 12
    });
    publishRoom(room);
  });

  socket.on('room:chat', (message = {}) => {
    const room = gameRooms.get(socket.data.roomId);
    const player = room?.players[socket.id];
    const text = typeof message.text === 'string' ? message.text.trim().slice(0, 80) : '';
    if (!room || !player || !text) return;
    room.chat.push({
      id: randomUUID(),
      senderId: socket.id,
      senderName: player.name,
      senderColor: player.color,
      text,
      isStamp: Boolean(message.isStamp),
      timestamp: Date.now()
    });
    room.chat = room.chat.slice(-50);
    publishRoom(room);
  });

  socket.on('disconnect', (reason) => {
    removePlayerFromRoom(socket);
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] API and Socket.IO listening on port ${PORT}`);
});
