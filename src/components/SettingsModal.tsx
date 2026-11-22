import React, { useState } from 'react';
import { X, KeyRound, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl p-6 shadow-2xl relative text-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-red-500">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI本番解析 設定</h2>
            <p className="text-xs text-neutral-400">Gemini APIキーの登録</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-neutral-300 font-medium">使用モデル:</span>
            </div>
            <span className="font-mono text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800 px-2 py-0.5 rounded">
              gemini-3.8-flash
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Google Gemini API キー
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-500 font-mono text-xs"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              キーはお使いのブラウザ（LocalStorage）にのみ安全に保存され、外部サーバーへは送信されません。
            </p>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 space-y-1.5 text-neutral-400 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>APIキーをお持ちでない場合</span>
            </div>
            <p>
              Google AI Studioから無料でAPIキーを取得できます。
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium underline mt-1"
            >
              <span>Google AI Studio でキーを発行する</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all"
            >
              {savedNotice ? '保存しました！' : '保存する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
