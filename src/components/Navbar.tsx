import React from 'react';
import { Settings, Tv, Sparkles, Volume2 } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  isCustomImage: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  isCustomImage
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* 左: ロゴ＆スタジオ表示 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-dela text-sm sm:text-base tracking-wider text-white">
                TV実況スタジオ
              </span>
              <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/40 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                LIVE AI
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 -mt-0.5 hidden sm:block">
              画像解析 × テレビ演出 × プロ高音質ナレーション
            </div>
          </div>
        </div>

        {/* 右: モードバッジ＆設定アイコン */}
        <div className="flex items-center gap-2">
          {/* 高音質ナレーションインジケーター */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">高音質ニューラルナレーション</span>
          </div>

          {/* 現在のモード表示 */}
          <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
            {isCustomImage ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">AI解析中</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>デモサンプル</span>
              </>
            )}
          </div>

          {/* 設定ボタン（詳細カスタム用） */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="システム設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
