import { PresetItem } from '../types/broadcasting';

// 高精細SVG画像生成関数
const createCafeSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <radialGradient id="tableBg" cx="40%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#3d2c1f"/>
        <stop offset="100%" stop-color="#1b120c"/>
      </radialGradient>
      <linearGradient id="woodTexture" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.04"/>
        <stop offset="50%" stop-color="#000000" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="15" dy="25" stdDeviation="18" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
      <radialGradient id="coffeeFoam" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#fdf8f2"/>
        <stop offset="60%" stop-color="#ecd6be"/>
        <stop offset="100%" stop-color="#8c5836"/>
      </radialGradient>
    </defs>
    
    <!-- カフェの木目調テーブル -->
    <rect width="800" height="800" fill="url(#tableBg)"/>
    <rect width="800" height="800" fill="url(#woodTexture)"/>
    
    <!-- ランチョンマット/コースター -->
    <rect x="180" y="240" width="340" height="340" rx="16" fill="#e8e2d8" opacity="0.15" transform="rotate(-5 350 410)"/>

    <!-- カプチーノカップ -->
    <g transform="translate(320, 380)" filter="url(#softShadow)">
      <!-- ソーサー -->
      <circle cx="0" cy="0" r="140" fill="#f4f4f4" stroke="#d5d5d5" stroke-width="3"/>
      <!-- カップ本体 -->
      <circle cx="0" cy="0" r="95" fill="#fafafa"/>
      <!-- 持ち手 -->
      <path d="M 85,-20 C 130,-20 130,20 85,20" fill="none" stroke="#f0f0f0" stroke-width="18" stroke-linecap="round"/>
      <!-- コーヒー＆ラテアート -->
      <circle cx="0" cy="0" r="82" fill="url(#coffeeFoam)"/>
      <!-- ハートのラテアート -->
      <path d="M 0,-15 C -25,-40 -50,-10 -25,18 Q 0,42 0,50 Q 0,42 25,18 C 50,-10 25,-40 0,-15 Z" fill="#7a4628" opacity="0.85"/>
      <path d="M 0,-8 C -15,-25 -32,-6 -16,12 Q 0,28 0,34 Q 0,28 16,12 C 32,-6 15,-25 0,-8 Z" fill="#f5ede3" opacity="0.9"/>
    </g>

    <!-- ケーキ皿とクロワッサン/モンブラン -->
    <g transform="translate(560, 220)" filter="url(#softShadow)">
      <circle cx="0" cy="0" r="110" fill="#2d3748" stroke="#1a202c" stroke-width="4"/>
      <!-- ケーキ -->
      <polygon points="-40,30 40,30 0,-50" fill="#d97706"/>
      <circle cx="0" cy="-50" r="14" fill="#dc2626"/>
      <path d="M -30,20 Q 0,-30 30,20" stroke="#fef3c7" stroke-width="6" fill="none"/>
      <!-- フォーク（一口も手をつけていない） -->
      <path d="M -80,-30 L -40,60" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- 領収書/スマホの端（生活感） -->
    <g transform="translate(140, 600) rotate(18)">
      <rect x="0" y="0" width="130" height="190" rx="4" fill="#f8fafc" opacity="0.9" filter="url(#softShadow)"/>
      <rect x="15" y="20" width="100" height="6" fill="#94a3b8"/>
      <rect x="15" y="34" width="70" height="5" fill="#cbd5e1"/>
      <rect x="15" y="46" width="85" height="5" fill="#cbd5e1"/>
      <text x="15" y="80" font-family="monospace" font-size="9" fill="#64748b">合計 ¥1,980</text>
      <text x="15" y="96" font-family="monospace" font-size="8" fill="#e11d48">※個別会計不可</text>
      <line x1="15" y1="110" x2="115" y2="110" stroke="#cbd5e1" stroke-dasharray="3,3"/>
    </g>

    <!-- 自然光の陰影 -->
    <polygon points="0,0 800,0 600,800 0,600" fill="#ffffff" opacity="0.04"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createLineChatSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1334" width="750" height="1334">
    <!-- スマホ外枠・画面背景 -->
    <rect width="750" height="1334" fill="#849ebf"/>

    <!-- LINE上部ヘッダー -->
    <rect width="750" height="120" fill="#2c3e50" opacity="0.95"/>
    <text x="30" y="75" font-family="sans-serif" font-weight="bold" font-size="34" fill="#ffffff">＜</text>
    <text x="90" y="75" font-family="sans-serif" font-weight="bold" font-size="32" fill="#ffffff">佐藤 (ゼミ)</text>
    <text x="680" y="75" font-family="sans-serif" font-weight="bold" font-size="28" fill="#ffffff">≡</text>

    <!-- ステータスバー（バッテリー3%・深夜2:48） -->
    <text x="30" y="32" font-family="sans-serif" font-weight="600" font-size="20" fill="#ffffff">02:48</text>
    <text x="610" y="32" font-family="sans-serif" font-size="18" fill="#ff4d4f">⚡ 3%</text>
    <rect x="670" y="18" width="36" height="18" rx="4" fill="none" stroke="#ff4d4f" stroke-width="2"/>
    <rect x="672" y="20" width="6" height="14" fill="#ff4d4f"/>

    <!-- 日付バッジ -->
    <rect x="290" y="160" width="170" height="42" rx="21" fill="#000000" opacity="0.25"/>
    <text x="375" y="187" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ffffff">11月22日(日)</text>

    <!-- 相手のメッセージ -->
    <g transform="translate(30, 250)">
      <circle cx="35" cy="35" r="35" fill="#f59e0b"/>
      <text x="35" y="43" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff">佐</text>
      
      <rect x="90" y="10" width="360" height="85" rx="18" fill="#ffffff"/>
      <text x="115" y="58" font-family="sans-serif" font-size="26" fill="#111827">明日の提出、間に合いそう？</text>
      <text x="460" y="85" font-family="sans-serif" font-size="18" fill="#ffffff" opacity="0.8">01:10</text>
    </g>

    <!-- 自分の返信（1時間以上放置した後の「りょ」） -->
    <g transform="translate(240, 420)">
      <text x="305" y="50" font-family="sans-serif" font-size="17" fill="#ffffff" opacity="0.8">既読</text>
      <text x="305" y="75" font-family="sans-serif" font-size="17" fill="#ffffff" opacity="0.8">02:47</text>
      
      <rect x="355" y="15" width="115" height="75" rx="18" fill="#85e249"/>
      <text x="390" y="62" font-family="sans-serif" font-weight="500" font-size="30" fill="#111827">りょ</text>
    </g>

    <!-- 相手の即レス（困惑の「え」） -->
    <g transform="translate(30, 560)">
      <circle cx="35" cy="35" r="35" fill="#f59e0b"/>
      <text x="35" y="43" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff">佐</text>
      
      <rect x="90" y="10" width="130" height="75" rx="18" fill="#ffffff"/>
      <text x="135" y="58" font-family="sans-serif" font-size="28" fill="#111827">え？</text>
      <text x="230" y="75" font-family="sans-serif" font-size="18" fill="#ffffff" opacity="0.8">02:48</text>
    </g>

    <!-- 下部入力バー -->
    <rect y="1234" width="750" height="100" fill="#ffffff"/>
    <circle cx="50" cy="1284" r="22" fill="#94a3b8"/>
    <rect x="95" y="1254" width="540" height="60" rx="30" fill="#f1f5f9"/>
    <text x="125" y="1292" font-family="sans-serif" font-size="24" fill="#94a3b8">メッセージを入力</text>
    <text x="680" y="1292" font-family="sans-serif" font-size="28" fill="#94a3b8">🎙️</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createDogSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="livingRoom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="65%" stop-color="#334155"/>
        <stop offset="66%" stop-color="#78350f"/>
        <stop offset="100%" stop-color="#451a03"/>
      </linearGradient>
    </defs>
    
    <!-- リビング部屋の背景とフローリング -->
    <rect width="800" height="800" fill="url(#livingRoom)"/>

    <!-- 現場に残された犯行の痕跡（破かれたクッション/ティッシュの散乱） -->
    <g transform="translate(180, 500)">
      <ellipse cx="60" cy="80" rx="90" ry="25" fill="#f8fafc" opacity="0.85"/>
      <polygon points="120,40 180,60 140,90" fill="#ffffff"/>
      <polygon points="20,70 -30,50 10,95" fill="#ffffff"/>
      <polygon points="220,75 260,95 240,110" fill="#ffffff"/>
      <circle cx="160" cy="70" r="15" fill="#fef08a"/>
      <text x="80" y="130" font-family="sans-serif" font-size="14" fill="#e2e8f0" opacity="0.6">散乱した綿（推定容積 1.2L）</text>
    </g>

    <!-- 容疑犬（柴犬風・目を細めて反省ゼロの虚無顔） -->
    <g transform="translate(420, 260)">
      <!-- 胴体 -->
      <ellipse cx="60" cy="240" rx="140" ry="120" fill="#c27838"/>
      <!-- 白い胸毛 -->
      <ellipse cx="30" cy="230" rx="75" ry="90" fill="#fef3c7"/>

      <!-- 耳（ピンと立っている） -->
      <polygon points="-70,20 -100,-70 -30,-20" fill="#a15822"/>
      <polygon points="-65,15 -85,-50 -40,-15" fill="#fbcfe8"/>
      <polygon points="70,20 100,-70 30,-20" fill="#a15822"/>
      <polygon points="65,15 85,-50 40,-15" fill="#fbcfe8"/>

      <!-- 頭部 -->
      <circle cx="0" cy="50" r="115" fill="#c27838"/>
      <!-- マズルと頬の白毛 -->
      <ellipse cx="0" cy="85" rx="80" ry="65" fill="#fef3c7"/>

      <!-- 鼻 -->
      <ellipse cx="0" cy="65" rx="18" ry="14" fill="#1e293b"/>

      <!-- 口（真一文字） -->
      <path d="M -15,82 Q 0,88 15,82" stroke="#1e293b" stroke-width="4" fill="none"/>

      <!-- 疑惑の目（そっぽを向いている・虚無） -->
      <!-- 左目 -->
      <ellipse cx="-45" cy="35" rx="14" ry="7" fill="#1e293b" transform="rotate(-10 -45 35)"/>
      <circle cx="-42" cy="34" r="3" fill="#ffffff"/>
      <!-- 右目（飼い主の手元のおやつをチラ見） -->
      <ellipse cx="45" cy="35" rx="14" ry="7" fill="#1e293b" transform="rotate(10 45 35)"/>
      <circle cx="49" cy="34" r="3" fill="#ffffff"/>

      <!-- 眉毛（困り顔フェイク） -->
      <ellipse cx="-40" cy="18" rx="8" ry="5" fill="#fef3c7"/>
      <ellipse cx="40" cy="18" rx="8" ry="5" fill="#fef3c7"/>

      <!-- 前足（きちんと揃えて無罪を主張） -->
      <rect x="-40" y="310" width="32" height="75" rx="16" fill="#fef3c7"/>
      <rect x="25" y="310" width="32" height="75" rx="16" fill="#fef3c7"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRESET_ITEMS: PresetItem[] = [
  {
    id: 'cafe',
    title: 'オシャレなカフェの写真',
    description: '冷めゆくカプチーノと手付かずのケーキ。撮影に費やされた時間と隠された心理。',
    thumbnail: '☕',
    imageSrc: createCafeSvg(),
    scripts: {
      news: {
        channelId: 'news',
        channelName: 'NEWS 24 緊急報道特番',
        badge: 'BREAKING NEWS',
        headline: '【速報】カフェラテ撮影に23分を費やす事案が発生',
        subheadline: '同席者は冷めきったカップを前に沈黙を継続中',
        tickerText: '◆速報：都内カフェで「食べる前の一枚」に23分消費 専門家「泡の表面張力はすでに限界値を突破」 現場には個別会計不可の伝票が残される',
        speechParams: { rate: 1.05, pitch: 1.05 },
        lines: [
          {
            text: '先ほど入ってきた速報です。都内のカフェにおいて、運ばれてきたカフェラテを一口も口にせず、撮影のみに23分間を費やす事案が発生しました。',
            displaySubtitle: '【速報】都内カフェで撮影に23分を費やす事案が発生',
            speaker: '報道アナウンサー'
          },
          {
            text: '現場に居合わせた関係者によりますと、投稿者は「たまたま自然光が綺麗だっただけ」と容疑を否認していますが、ラテアートの泡はすでに室温と同化している模様です。',
            displaySubtitle: '投稿者「たまたま撮れた」と供述も 泡は既に室温と同化',
            speaker: '報道アナウンサー'
          },
          {
            text: 'さらに専門家の分析により、皿の端に置かれたケーキは一口も削られておらず、完全な展示物状態であることが判明しました。',
            displaySubtitle: '専門家「ケーキは一口も削られておらず完全な展示物」',
            speaker: '報道アナウンサー'
          },
          {
            text: '警察は、インスタグラムのストーリー投稿に向けた組織的な計画性の有無について、慎重に捜査を進めています。',
            displaySubtitle: 'SNS投稿に向けた組織的計画性の有無を捜査中',
            speaker: '報道アナウンサー'
          }
        ]
      },
      documentary: {
        channelId: 'documentary',
        channelName: '情熱の流儀',
        badge: '密着340日',
        headline: '男はフォークを置いた。一口目を食べる前に、世界に見せたいものがある。',
        subheadline: '何気ない日常に潜む、冷めゆく泡との静かな対話',
        tickerText: '情熱の流儀 ── 誰も見ていないところで、人は己の美学と戦っている。冷めゆく一杯に捧げた、名もなき執念の記録。',
        speechParams: { rate: 0.88, pitch: 0.85 },
        lines: [
          {
            text: '運ばれてきた一杯を、すぐには飲まない。それが、彼の流儀だ。',
            displaySubtitle: '運ばれてきた一杯を、すぐには飲まない。',
            speaker: '語り'
          },
          {
            text: '『冷めるじゃないですか？』そう尋ねるスタッフに、彼は静かに微笑み、フォークを置いた。',
            displaySubtitle: '「一口目を食べる前に、世界に見せなきゃいけない」',
            speaker: '語り'
          },
          {
            text: '妥協のない自然光の計算。影の落ち方をミリ単位で調整する瞳の奥に、かつての挫折が重なる。',
            displaySubtitle: '影の落ち方をミリ単位で調整する瞳の奥に、かつての挫折が重なる。',
            speaker: '語り'
          },
          {
            text: '冷めきったラテを飲み干すその横顔には、誰にも理解されなくていい、男の矜持が宿っていた。',
            displaySubtitle: '誰にも理解されなくていい、男の矜持が宿っていた。',
            speaker: '語り'
          }
        ]
      },
      investigation: {
        channelId: 'investigation',
        channelName: '警視庁特別捜査班 EVIDENCE LOG',
        badge: 'EVIDENCE #01',
        headline: '【プロファイリング完了】偶発的な撮影を偽装した周到な自己顕示工作',
        subheadline: '照準解析：領収書の配置・ケーキの角度・フォークの無傷状態',
        tickerText: 'ALERT: EVIDENCE IDENTIFIED [TARGET: CAFE_COUNTER] // FRAUDULENT ACCIDENTAL PHOTO // PROBABILITY OF NARCISSISM: 98.4%',
        speechParams: { rate: 1.1, pitch: 0.95 },
        lines: [
          {
            text: '解析班、画像左下を拡大せよ。伝票が見えるな。個別会計不可の文字。これは単独犯の犯行ではない。同席者が存在する。',
            displaySubtitle: '画像左下：伝票に「個別会計不可」の文字 複数名の同行者を確認',
            evidencePoint: { x: 25, y: 75, label: '伝票（個別会計不可）', detail: '同席者の存在と気まずい沈黙を立証' },
            speaker: '特別捜査官'
          },
          {
            text: 'さらにカップの角度を見ろ。ロゴがカメラ正面から正確に15度傾けられている。偶然ではあり得ない、周到な構図設計だ。',
            displaySubtitle: 'ロゴ角度：計算された15度の傾斜 偶発的スナップの偽装を看破',
            evidencePoint: { x: 48, y: 52, label: 'カップ中心軸', detail: '作為的な角度配置を検出' },
            speaker: '特別捜査官'
          },
          {
            text: 'フォークの先端に注目。指紋すら付着していない。つまりケーキの味などどうでもいいのだ。目的はただ一つ、他者からの承認。',
            displaySubtitle: 'フォーク無傷：味覚の享受ではなく「承認欲求の補給」が主目的',
            evidencePoint: { x: 72, y: 32, label: '無傷のフォーク', detail: '手付かずのまま放置された証拠' },
            speaker: '特別捜査官'
          },
          {
            text: '結論を言おう。容疑者は現在、同席者の冷ややかな視線に耐えながら、フィルター選びに全神経を集中させている。確保に向かえ。',
            displaySubtitle: '【プロファイル確定】同席者の視線を無視しフィルター選定に没頭中',
            speaker: '特別捜査官'
          }
        ]
      }
    }
  },
  {
    id: 'line',
    title: '深夜のLINEトーク画面',
    description: '午前2時47分。既読から1時間半後の「りょ」。バッテリー残量3%が語る真実。',
    thumbnail: '💬',
    imageSrc: createLineChatSvg(),
    scripts: {
      news: {
        channelId: 'news',
        channelName: 'NEWS 24 緊急報道特番',
        badge: 'BREAKING NEWS',
        headline: '【速報】深夜2時47分「りょ」の一言に全米が震撼',
        subheadline: '1時間38分の熟考の末に出力された文字数はわずか1文字',
        tickerText: '◆特報：深夜のLINEグループにおいて提出期日確認に対し「りょ」のみ返信 専門機関「会話のデッドロック状態」と警鐘 バッテリーは残り3%を記録',
        speechParams: { rate: 1.05, pitch: 1.05 },
        lines: [
          {
            text: '深夜の緊急ニュースをお伝えします。本日未明、重要課題の進捗確認に対し、1時間37分の沈黙を経て「りょ」の1文字のみが送信される事案がありました。',
            displaySubtitle: '【速報】進捗確認に対し1時間37分後に「りょ」のみ送信',
            speaker: '報道アナウンサー'
          },
          {
            text: '受信側からは直ちに「え？」という困惑の供述が記録されており、現場には深刻な緊張感が走っています。',
            displaySubtitle: '相手方から「え？」と返信 会話は完全硬直状態に突入',
            speaker: '報道アナウンサー'
          },
          {
            text: '専門家は、「了解」の「解」を削ぎ落とした背景には、返信したくないという強烈な防衛本能が働いたと分析しています。',
            displaySubtitle: '専門家「了解の『解』を削った背景に強烈な心理的防衛本能」',
            speaker: '報道アナウンサー'
          },
          {
            text: 'なお、送信側のスマートフォンはバッテリー残量3パーセントとなっており、このまま自然消滅を図る構えとみられます。',
            displaySubtitle: '残量3％：端末放電による自然消滅を図る構えか',
            speaker: '報道アナウンサー'
          }
        ]
      },
      documentary: {
        channelId: 'documentary',
        channelName: '情熱の流儀',
        badge: '密着410日',
        headline: '返信しない。それが、俺の誠意だ。言葉を捨てた男の最後の夜。',
        subheadline: '既読をつけてから1時間。画面を見つめ続けた指先が選んだ、たった一文字。',
        tickerText: '情熱の流儀 ── 語らないことでしか守れないプライドがある。闇夜に光る液晶画面と、少年の静かなる決断。',
        speechParams: { rate: 0.88, pitch: 0.85 },
        lines: [
          {
            text: '午前2時。部屋の明かりは消えたままだ。青白い光だけが、彼の憔悴した表情を照らし出していた。',
            displaySubtitle: '午前2時。部屋の明かりは消えたままだ。',
            speaker: '語り'
          },
          {
            text: '『間に合いそう？』その問いかけに、言い訳ならいくらでも思いついた。だが、彼は嘘をつくことを拒んだ。',
            displaySubtitle: '言い訳ならいくらでも思いついた。だが、彼は嘘を拒んだ。',
            speaker: '語り'
          },
          {
            text: '推敲に推敲を重ね、削ぎ落とし、最後に残った結晶。それが『りょ』だった。',
            displaySubtitle: '削ぎ落とし、最後に残った結晶。それが「りょ」だった。',
            speaker: '語り'
          },
          {
            text: '画面を伏せた瞬間、充電が切れた。これでいい。男は静かに眠りについた。',
            displaySubtitle: '画面を伏せた瞬間、充電が切れた。これでいい。',
            speaker: '語り'
          }
        ]
      },
      investigation: {
        channelId: 'investigation',
        channelName: '警視庁特別捜査班 EVIDENCE LOG',
        badge: 'EVIDENCE #02',
        headline: '【心理尋問調書】充電3%を利用した意図的な職務放棄及び逃亡の企て',
        subheadline: 'ステータスバー・タイムスタンプから読み解く完全犯罪の破綻',
        tickerText: 'ALERT: PSYCHOLOGICAL PROFILE [SUSPECT: SATO_TARGET] // BATTERY LEVEL: 3% CRITICAL // INTENTIONAL COMMUNICATION SEVERANCE DETECTED',
        speechParams: { rate: 1.1, pitch: 0.95 },
        lines: [
          {
            text: '証拠物B、ステータスバーを見ろ。午前2時48分、バッテリー残量はわずか3パーセント。ここに容疑者の狡猾な計算がある。',
            displaySubtitle: '時刻02:48 残量3%：「充電切れで寝落ちした」と言い訳を準備',
            evidencePoint: { x: 88, y: 4, label: 'バッテリー残量3%', detail: '計画的連絡断絶の物的証拠' },
            speaker: '特別捜査官'
          },
          {
            text: '相手の送信時刻は01時10分。つまり約1時間40分の間、意図的に通知を放置していた。寝ていたのではない、起きていたのだ。',
            displaySubtitle: '放置時間100分：通知を見ながら返信を先送りにした事実を立証',
            evidencePoint: { x: 25, y: 22, label: '受信時刻 01:10', detail: '長時間の既読スルーを検知' },
            speaker: '特別捜査官'
          },
          {
            text: 'そしてトドメの『りょ』。長文を書けば言い訳を問われるため、あえて極小のテキストで会話を終了させようとした。',
            displaySubtitle: '返信「りょ」：追及を遮断するための最小単位テキスト',
            evidencePoint: { x: 55, y: 35, label: '発信ログ「りょ」', detail: '思考放棄の痕跡' },
            speaker: '特別捜査官'
          },
          {
            text: '相手から即座に『え？』と返信されたことで完全犯罪は破綻した。容疑者は今、画面を伏せて心臓をバクバクさせているに違いない。',
            displaySubtitle: '【結論】完全犯罪は破綻。容疑者は布団を被り震えていると断定',
            evidencePoint: { x: 25, y: 45, label: '追撃「え？」', detail: '相手の激怒を検出' },
            speaker: '特別捜査官'
          }
        ]
      }
    }
  },
  {
    id: 'dog',
    title: '犬の写真',
    description: '現場に散らばる綿。揃えられた前足と反省ゼロの瞳。計画的犯行の全容。',
    thumbnail: '🐕',
    imageSrc: createDogSvg(),
    scripts: {
      news: {
        channelId: 'news',
        channelName: 'NEWS 24 緊急報道特番',
        badge: 'BREAKING NEWS',
        headline: '【特報】クッション損壊事件で「反省のフリ」をする容疑犬を任意同行',
        subheadline: '現場に残された綿に対し、容疑犬は「風の仕業」と否認',
        tickerText: '◆速報：リビングにおいて高級クッションが爆発四散する事案 現場至近で発見された容疑犬は「自分も被害者」と主張 視線はおやつ保管庫へ',
        speechParams: { rate: 1.05, pitch: 1.05 },
        lines: [
          {
            text: '続いてのニュースです。本日昼前、リビングに置かれていた特注クッションが徹底的に破壊され、室内一面に綿が散乱する重大事件が発生しました。',
            displaySubtitle: '【速報】リビング特注クッションが徹底的に破壊される重大事案',
            speaker: '報道アナウンサー'
          },
          {
            text: '現場で確保された茶色い容疑犬は、前足を揃えて神妙な面持ちを見せていますが、専門家は「反省しているフリの完成度が極めて高い」と警鐘を鳴らしています。',
            displaySubtitle: '現場確保の容疑犬「反省しているフリの完成度が極めて高い」',
            speaker: '報道アナウンサー'
          },
          {
            text: 'さらに口元には白い繊維がわずかに残存しており、動かぬ証拠を突きつけられた容疑犬は、現在視線を斜め45度に逸らして黙秘を続けています。',
            displaySubtitle: '口元に繊維残存も 容疑犬は斜め45度を見つめ黙秘継続中',
            speaker: '報道アナウンサー'
          },
          {
            text: '飼い主によりますと、夜の散歩の短縮など厳しいペナルティが科される見通しです。',
            displaySubtitle: '夜の散歩コース半減など 厳しいペナルティが科される見通し',
            speaker: '報道アナウンサー'
          }
        ]
      },
      documentary: {
        channelId: 'documentary',
        channelName: '情熱の流儀',
        badge: '密着520日',
        headline: '叱られているのではない。自分は今、愛されているのだ。不屈の魂。',
        subheadline: '怒声を全身で受け止める。破られた布地の向こうに見据えた、野生の真実。',
        tickerText: '情熱の流儀 ── 本能を抑えきれなかった日の悔恨。それでも犬は、明日もまた何かを噛み続けるだろう。命の鼓動。',
        speechParams: { rate: 0.88, pitch: 0.85 },
        lines: [
          {
            text: '怒られているとき、彼は決して目を逸らさない。いや、少しだけ逸らす。それが彼の誠実さだった。',
            displaySubtitle: '怒られているとき、彼は決して目を逸らさない。',
            speaker: '語り'
          },
          {
            text: '破壊したかったわけじゃない。クッションの中に眠る何かを、救い出したかっただけなんだ。',
            displaySubtitle: '「クッションの中に眠る何かを、救いたかった」',
            speaker: '語り'
          },
          {
            text: '飼い主の怒号が響く部屋で、そっと耳を寝かせる。痛みを知る者だけが持てる、優しい眼差し。',
            displaySubtitle: 'そっと耳を寝かせる。痛みを知る者だけが持てる優しい眼差し。',
            speaker: '語り'
          },
          {
            text: '『よし、許す』その一言を待つ尾の先が、わずかに揺れた。プロフェッショナル、ここに極まれり。',
            displaySubtitle: '「よし許す」その一言を待つ尾の先が、わずかに揺れた。',
            speaker: '語り'
          }
        ]
      },
      investigation: {
        channelId: 'investigation',
        channelName: '警視庁特別捜査班 EVIDENCE LOG',
        badge: 'EVIDENCE #03',
        headline: '【鑑識報告書】散乱綿の飛散角と耳の角度から割り出された計画的破壊工作',
        subheadline: '表情筋解析：困り眉は後天的な欺瞞工作／おやつ要求の確信犯',
        tickerText: 'ALERT: TARGET CANINE VERIFIED // DESTRUCTION DEGREE: SEVERE // REMORSE LEVEL: 0.00% // AIM: SNACK EXTORTION',
        speechParams: { rate: 1.1, pitch: 0.95 },
        lines: [
          {
            text: '鑑識の結果が出た。散乱した綿の飛散範囲は半径1.5メートル。偶発的な引っかき傷ではない。明らかな殺意を持って噛みちぎられている。',
            displaySubtitle: '飛散半径1.5m：明らかな意図をもって噛みちぎられた痕跡',
            evidencePoint: { x: 26, y: 72, label: '散乱綿（破裂点）', detail: '激しい咬合痕と綿の飛散を検出' },
            speaker: '特別捜査官'
          },
          {
            text: '被疑者の表情を見ろ。眉毛のあたりに同情を誘う陰影を作っているが、瞳孔は全く収縮していない。反省の情はゼロだ。',
            displaySubtitle: '表情筋解析：同情を誘う困り眉を演出 反省レベルは0.00％',
            evidencePoint: { x: 55, y: 38, label: '疑惑の瞳', detail: '心理的欺瞞反応を検知' },
            speaker: '特別捜査官'
          },
          {
            text: '視線の先を追跡しろ。飼い主の顔ではなく、明らかに台所のおやつストッカーを凝視している。怒られた後に貰えるボーナスを既に計算しているのだ。',
            displaySubtitle: '視線追跡：台所のおやつ保管棚をロックオン 示談金要求の構え',
            evidencePoint: { x: 62, y: 36, label: '視線ベクトル', detail: 'おやつ保管場所への固執' },
            speaker: '特別捜査官'
          },
          {
            text: '前足を揃えたポーズは刑の軽減を狙った偽装工作と断定する。この容疑者、過去にも同様の手口でボーロをせしめている常習犯だ。',
            displaySubtitle: '【調書確定】前足の直立は偽装工作 常習的ボーロ詐欺犯と断定',
            evidencePoint: { x: 52, y: 68, label: '揃えた前足', detail: '偽装された無実のアピール' },
            speaker: '特別捜査官'
          }
        ]
      }
    }
  }
];
