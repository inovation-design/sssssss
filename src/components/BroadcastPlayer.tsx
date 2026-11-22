import React, { useState, useEffect } from 'react';
import { ChannelScript, ChannelType } from '../types/broadcasting';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Radio, Clock, ShieldAlert } from 'lucide-react';

interface BroadcastPlayerProps {
  imageSrc: string;
  script: ChannelScript;
  channel: ChannelType;
  currentLineIndex: number;
  isPlaying: boolean;
  aspectRatio: '16:9' | '9:16';
  isCleanView: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onExitCleanView?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BroadcastPlayer: React.FC<BroadcastPlayerProps> = ({
  imageSrc,
  script,
  channel,
  currentLineIndex,
  isPlaying,
  aspectRatio,
  isCleanView,
  onTogglePlay,
  onRestart,
  onExitCleanView,
  isMuted,
  onToggleMute
}) => {
  // 現在時刻のリアルタイム時計
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLine = script.lines[currentLineIndex] || script.lines[0];

  return (
    <div
      className={`relative mx-auto overflow-hidden bg-black shadow-2xl transition-all duration-300 select-none ${
        aspectRatio === '16:9'
          ? 'w-full max-w-4xl aspect-video rounded-xl sm:border sm:border-neutral-800'
          : 'w-full max-w-[380px] aspect-[9/16] rounded-2xl sm:border sm:border-neutral-800'
      } ${isCleanView ? 'fixed inset-0 z-50 max-w-none w-screen h-screen rounded-none border-none flex items-center justify-center bg-black' : ''}`}
      onClick={() => {
        if (isCleanView && onExitCleanView) {
          onExitCleanView();
        }
      }}
    >
      {/* 放送フレームコンテナ */}
      <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${
        isCleanView && aspectRatio === '16:9' ? 'max-w-6xl aspect-video' : ''
      } ${isCleanView && aspectRatio === '9:16' ? 'max-h-screen aspect-[9/16]' : ''}`}>
        
        {/* 背景画像 ＋ ケンバーンズ効果（スローパン＆ズーム） */}
        <div className="absolute inset-0 overflow-hidden bg-neutral-950">
          <img
            src={imageSrc}
            alt="Broadcast Material"
            className={`w-full h-full object-cover origin-center transition-transform duration-1000 ${
              isPlaying
                ? channel === 'news'
                  ? 'kenburns-active-1'
                  : channel === 'documentary'
                  ? 'kenburns-active-2'
                  : 'scale-105'
                : 'scale-100'
            }`}
          />
          {/* チャンネルごとの画像フィルタ効果 */}
          {channel === 'news' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          )}
          {channel === 'documentary' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/70 mix-blend-multiply pointer-events-none" />
          )}
          {channel === 'investigation' && (
            <div className="absolute inset-0 scanline bg-emerald-950/20 mix-blend-overlay pointer-events-none" />
          )}
        </div>

        {/* ======================================================== */}
        {/* 1. 【NEWS 24】緊急ニュース速報 オーバーレイ */}
        {/* ======================================================== */}
        {channel === 'news' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
            {/* 上部ヘッダー（左上ロゴ＋LIVE表示、右上時計） */}
            <div className="flex items-start justify-between">
              {/* 左上: NEWS 24 立体ロゴバッジ */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white font-dela px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm shadow-lg border border-red-400 flex items-center gap-1.5 tracking-wider text-xs sm:text-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>NEWS 24</span>
                </div>
                <div className="bg-black/85 border border-red-600/70 text-red-400 font-bold px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs tracking-widest uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  <span>速報</span>
                </div>
              </div>

              {/* 右上: リアルタイム放送時刻 */}
              <div className="bg-black/75 border border-neutral-700 backdrop-blur-sm px-2.5 py-1 rounded shadow-md text-right">
                <div className="text-[9px] sm:text-[10px] text-neutral-400 font-medium tracking-tight">TOKYO 報道フロア</div>
                <div className="text-sm sm:text-lg font-mono-tech font-bold text-white tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400 inline" />
                  <span>{timeStr}</span>
                </div>
              </div>
            </div>

            {/* 下部: 報道テロップ＆ニュースティッカー */}
            <div className="w-full flex flex-col gap-1 sm:gap-1.5 mt-auto">
              {/* 上段: 緊急速報サブ見出しプレート */}
              <div className="self-start inline-flex items-center bg-black/90 border-l-4 border-red-600 px-3 py-1 text-white shadow-xl">
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 tracking-wider">
                  {script.headline}
                </span>
              </div>

              {/* 中段: 巨大メインテロッププレート（金枠・赤黒座布団） */}
              <div className="relative w-full bg-gradient-to-r from-neutral-950 via-red-950/90 to-neutral-950 border-y-2 border-amber-500/80 px-3 py-2 sm:px-5 sm:py-3.5 shadow-2xl backdrop-blur-md">
                <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] sm:text-[11px] font-black px-2 py-0.5 tracking-tighter">
                  {currentLine.speaker || '報道特番'}
                </div>
                <div className="mt-1 sm:mt-1.5 text-center">
                  <p className="text-white font-dela text-base sm:text-2xl tracking-wide leading-snug tv-telop-stroke text-amber-100">
                    {currentLine.displaySubtitle}
                  </p>
                </div>
              </div>

              {/* 下段: 画面下部を流れるニュースティッカー */}
              <div className="w-full bg-neutral-900 border-t border-neutral-700 py-0.5 sm:py-1 px-2 overflow-hidden flex items-center">
                <div className="bg-red-600 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.2 mr-2 whitespace-nowrap uppercase">
                  TICKER
                </div>
                <div className="overflow-hidden whitespace-nowrap w-full">
                  <div className="animate-ticker text-[10px] sm:text-xs text-neutral-300 font-medium">
                    {script.tickerText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. 【情熱の流儀】密着ドキュメンタリー オーバーレイ */}
        {/* ======================================================== */}
        {channel === 'documentary' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-7 z-20">
            {/* 上部: 静謐な番組ロゴ＆密着日数 */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-serif-jp text-xs sm:text-sm font-semibold tracking-[0.3em] text-neutral-300 border-b border-neutral-500 pb-0.5">
                  情熱の流儀
                </span>
                <span className="text-[10px] sm:text-xs font-light text-neutral-400 tracking-[0.2em] mt-1">
                  何者でもない日々に。
                </span>
              </div>
              <div className="text-right">
                <span className="font-serif-jp text-[11px] sm:text-xs text-neutral-300 tracking-widest bg-black/50 px-2 py-0.5 border border-neutral-700">
                  {script.badge}
                </span>
              </div>
            </div>

            {/* 下部: 黒背景＆白の明朝体テロップ（文学的・心に染みる間） */}
            <div className="w-full max-w-2xl mx-auto mb-2 sm:mb-4 text-center">
              <div className="inline-block bg-black/85 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-4 border-y border-neutral-700/60 shadow-2xl">
                <p className="font-serif-jp text-white text-sm sm:text-xl font-normal leading-relaxed tracking-[0.08em] drop-shadow-md">
                  {currentLine.displaySubtitle}
                </p>
                <div className="mt-2 text-[10px] sm:text-xs text-neutral-400 font-serif-jp tracking-widest flex items-center justify-center gap-2">
                  <span className="w-4 h-[1px] bg-neutral-600" />
                  <span>語り・ドキュメンタリー取材班</span>
                  <span className="w-4 h-[1px] bg-neutral-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. 【特別捜査本部】プロファイリング尋問 オーバーレイ */}
        {/* ======================================================== */}
        {channel === 'investigation' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
            {/* 監視カメラ ヘッダー */}
            <div className="flex items-start justify-between font-mono-tech text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500 px-2 py-0.5 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>REC [●]</span>
                </div>
                <div className="text-emerald-400 bg-black/70 px-2 py-0.5 border border-emerald-800">
                  CAM_04 // HQ_DIRECT
                </div>
              </div>
              <div className="text-right text-emerald-400 bg-black/70 px-2 py-0.5 border border-emerald-800">
                <span>{timeStr} : 429ms</span>
              </div>
            </div>

            {/* 画像上のターゲット照準枠アニメーション（evidencePointがある場合） */}
            {currentLine.evidencePoint && (
              <div
                className="absolute transition-all duration-700 ease-out z-30"
                style={{
                  left: `${currentLine.evidencePoint.x}%`,
                  top: `${currentLine.evidencePoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* パルスする赤い照準リング */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-crosshair">
                  {/* 四隅のブラケット */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500" />
                  {/* 中心円と十字 */}
                  <div className="absolute inset-3 rounded-full border border-red-500/70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  </div>
                </div>

                {/* 検出ラベルバッジ */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap bg-red-950/90 border border-red-500 text-red-200 text-[10px] sm:text-xs font-mono-tech px-2 py-0.5 shadow-lg">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <span>TARGET: {currentLine.evidencePoint.label}</span>
                  </div>
                  <div className="text-[9px] text-red-300 font-sans">{currentLine.evidencePoint.detail}</div>
                </div>
              </div>
            )}

            {/* 四隅のミリタリーマーカー */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-emerald-500/50" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-emerald-500/50" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-emerald-500/50" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-emerald-500/50" />

            {/* 下部: 鑑識捜査テロップ */}
            <div className="w-full mt-auto flex flex-col gap-1">
              <div className="bg-neutral-950/90 border border-emerald-500/80 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono-tech text-emerald-400 mb-1 border-b border-emerald-900 pb-1">
                  <span className="font-bold text-red-400">{script.badge} // PROFILE LOG</span>
                  <span>EVIDENCE INTEGRITY: 99.8%</span>
                </div>
                <p className="text-white font-mono-tech sm:font-sans font-bold text-xs sm:text-base tracking-wide text-emerald-100">
                  {currentLine.displaySubtitle}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* クリーンモード解除のガイド（クリーンモード時のみ表示） */}
        {isCleanView && (
          <div className="absolute top-4 right-4 z-40 bg-black/70 border border-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm animate-pulse pointer-events-none">
            画面タップで戻る（スクショ撮影チャンス！）
          </div>
        )}

        {/* 画面内オーバーレイ制御（クリーンモードでない時、ホバーまたはタップで出現） */}
        {!isCleanView && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="p-1.5 sm:p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-neutral-700 backdrop-blur-sm transition-transform active:scale-95"
              title={isMuted ? '音声オン' : 'ミュート'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="p-1.5 sm:p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-neutral-700 backdrop-blur-sm transition-transform active:scale-95"
              title={isPlaying ? '一時停止' : '再生'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestart();
              }}
              className="p-1.5 sm:p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-neutral-700 backdrop-blur-sm transition-transform active:scale-95"
              title="最初から再生"
            >
              <RotateCcw className="w-4 h-4 text-neutral-300" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
