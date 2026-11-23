# Cyber Battle Arena - オンライン対戦ゲーム

リアルタイム陣取りオンライン対戦ゲームのフルスタック環境です。
Socket.io による高速双方向通信サーバー、Vite + React 19 + TypeScript + Tailwind CSS v4 によるフロントエンド、およびオフライン練習用AIボットを完備しています。

---

## 🚀 起動方法

### 1. サーバーとフロントエンドを両方起動（開発時推奨）
```bash
npm run dev:all
```
- フロントエンド (Vite HMR): `http://localhost:5173`
- バックエンド (Socket.io): `http://localhost:3001`
※ Vite 側から `/socket.io` へのプロキシが設定されているため、ポート 5173 でそのまま対戦可能です。同一Wi-Fi内のスマホ等からも `http://<ローカルIP>:5173` で参加できます。

### 2. 本番配信用サーバー単体起動
```bash
npm run build
npm run server
```
- `dist/` にビルドされたフロントエンドと Socket.io サーバーが `http://localhost:3001` で一括稼働します。

---

## 🎮 ゲームモード

1. **⚡ クイックマッチ (Quick Match)**
   - 待機中のプレイヤーと即座に1対1でマッチングし、60秒の陣取りバトルを開始します。
2. **🗝️ ルームマッチ (Custom Room)**
   - 5桁の部屋コードを発行してプライベート部屋を作成、または合言葉を入力して友達と対戦できます。
3. **🤖 ソロ・AIボット練習 (Practice Mode)**
   - サーバー接続なし（オフライン）でもプレイ可能。初級・中級・上級のAIボットといつでも腕試しできます。

---

## 🕹️ 操作方法

- **移動：** `W`, `A`, `S`, `D` または `矢印キー`（スマホでは画面下部の十字キー）
- **エネルギー弾発射：** `スペースキー` または `Enter`（スマホでは `SHOOT` ボタン）
- **スタンプ・リアクション：** 画面下部の絵文字バーから即時エモート送信可能

### アイテム（パワーアップ）
- ⚡ **スピードアップ**：移動速度向上
- 🛡️ **シールド**：相手の攻撃を1回防御
- 💣 **ボム**：周囲3x3マスを一気に自分の領地に占領
- 💥 **4方向ブラスター**：上下左右に同時にエネルギー弾を発射

---

## 🛠️ 技術スタック

- **フロントエンド:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React, Socket.io-client, Firebase
- **バックエンド:** Node.js, Express 5, Socket.io, CORS
- **サウンド:** Web Audio API リアルタイムシンセサイザー（外部音声ファイル不要）

---

## Vercelで公開する場合

Vercelにはゲーム画面をデプロイし、Socket.IOサーバーはNode.jsを常時実行できるホストに別途デプロイします。現在のルームとプレイヤー状態はNodeサーバーのメモリにあるため、Vercel Functionsの複数インスタンスで直接動かす構成にはしていません。VercelのWebSocket対応だけではインスタンス間でルーム状態を共有できず、Redisなどの共有ストアが必要です。

1. このプロジェクトをGitHubリポジトリにpushします。
2. Renderで `New > Web Service` を選び、同じリポジトリを接続します。Build Commandは `npm ci && npm run build`、Start Commandは `npm start`、Health Check Pathは `/api/health` にします。発行されたHTTPS URLを控えます。RenderはWebSocket接続を受け付けます。
3. VercelでGitHubリポジトリをImportします。Build Commandは `npm run build`、Output Directoryは `dist` です（`vercel.json` に設定済み）。
4. VercelのEnvironment Variablesに `VITE_GAME_SERVER_URL` を追加し、手順2のサーバーURLを設定します（例: `https://your-game-server.example.com`）。
5. Vercelで再デプロイします。公開URLを開き、複数端末から同じ4桁ルームに参加できることを確認します。Renderの無料Web Serviceは15分間利用がないと休止するため、起動時に待ち時間が出ることがあります。

画像解析APIも使う場合は、`GEMINI_API_KEY` をNode.jsホストの環境変数に設定してください。APIキーをソースコードやVercelのフロントエンド環境変数に置かないでください。

