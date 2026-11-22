import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Smartphone, Tv, Camera, Share2, Check } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  totalLines: number;
  currentLineIndex: number;
  aspectRatio: '16:9' | '9:16';
  onTogglePlay: () => void;
  onRestart: () => void;
  onToggleAspectRatio: () => void;
  onEnterCleanView: () => void;
  onSelectLine: (index: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  totalLines,
  currentLineIndex,
  aspectRatio,
  onTogglePlay,
  onRestart,
  onToggleAspectRatio,
  onEnterCleanView,
  onSelectLine
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // フォールバック
      const dummy = document.createElement('input');
      dummy.value = window.location.href;
      document.body.appendChild(dummy);
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0 mt-3 space-y-3">
      {/* タイムライン / フレーズ進行バー */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {Array.from({ length: totalLines }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSelectLine(idx)}
            className={`flex-1 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              idx === currentLineIndex
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                : idx < currentLineIndex
                ? 'bg-neutral-600 hover:bg-neutral-500'
                : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            title={`フレーズ ${idx + 1}`}
          />
        ))}
      </div>

      {/* メイン操作ボタン群 */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-xl">
        {/* 左: 再生・巻き戻し */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-md ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>一時停止</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>実況再生</span>
              </>
            )}
          </button>

          <button
            onClick={onRestart}
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
            title="最初から再生"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">リプレイ</span>
          </button>
        </div>

        {/* 右: アスペクト比 / スクショモード / URL共有 */}
        <div className="flex items-center gap-2">
          {/* 16:9 / 9:16 比率切り替え */}
          <button
            onClick={onToggleAspectRatio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition-colors"
            title="画面比率切り替え"
          >
            {aspectRatio === '16:9' ? (
              <>
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>16:9 放送</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>9:16 縦型</span>
              </>
            )}
          </button>

          {/* クリーン全画面表示（スクショ用） */}
          <button
            onClick={onEnterCleanView}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 text-xs font-semibold transition-colors"
            title="UIを隠してスクショを撮る"
          >
            <Camera className="w-4 h-4" />
            <span>スクショ用表示</span>
          </button>

          {/* URLコピー */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition-colors"
            title="アプリURLをコピー"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">コピー完了</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>共有</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
