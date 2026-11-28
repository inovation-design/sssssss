# 写真から課題をAI解析する設定

課題管理表の写真解析は、Node.js サーバーの `/api/assignments/analyze-image` と Gemini API を使います。API キーはサーバーだけに設定し、ブラウザーには置きません。

## 初回設定

1. [Google AI Studio](https://aistudio.google.com/app/apikey) で Gemini API キーを作成します。
2. Windows の PowerShell を開き、リポジトリのフォルダーへ移動します。
3. 次のようにキーを環境変数へ設定してサーバーを起動します。

   ```powershell
   $env:GEMINI_API_KEY = "取得したAPIキー"
   npm run server
   ```

4. アプリと API サーバーを同じホストで公開する場合は、課題管理表を開き、写真を選んで「写真をAI解析」を押します。アプリが GitHub Pages など別ホストにある場合は、ビルド時に `VITE_ASSIGNMENT_API_URL` を API サーバーの HTTPS URL に設定してください。

サーバーを止めるときは、PowerShell で `Ctrl+C` を押します。別の PowerShell を開くたびに API キーの設定が必要です。キーをソースコードや GitHub にコミットしないでください。

## 注意

- 初期モデルは `gemini-3.1-flash-lite` です。必要ならサーバーの環境変数 `GEMINI_ASSIGNMENT_MODEL` で変更できます。
- API の無料枠・利用上限・データ取扱い条件は Google 側で変更される場合があります。画像を送る前に Google AI Studio の現在の条件を確認してください。
- 写真は解析時に Gemini API へ送信されます。氏名や個人情報が写っている写真は、不要な部分を切り取ってください。
- AI の読み取りは間違うことがあります。期限不明は空欄で表示され、登録前に内容を編集できます。
- 無料の Cloudflare Quick Tunnel は URL が変わり、サーバーを停止すると利用できません。常時利用するには、安定した HTTPS の API ホスティングが別途必要です。
- API サーバーをインターネットに公開すると、アクセス可能な人が解析を呼び出せます。まず自分だけで使う短時間の確認に限定し、継続公開する場合は認証と使用量制限を追加してください。
