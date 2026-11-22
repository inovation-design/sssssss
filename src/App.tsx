import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BroadcastPlayer } from './components/BroadcastPlayer';
import { ChannelTabs } from './components/ChannelTabs';
import { PlayerControls } from './components/PlayerControls';
import { PresetSelector } from './components/PresetSelector';
import { ImageUploader } from './components/ImageUploader';
import { SettingsModal } from './components/SettingsModal';
import { PRESET_ITEMS } from './data/presets';
import { ChannelType, ChannelScript, PresetItem } from './types/broadcasting';
import { narrator, soundFX } from './utils/audio';
import { analyzeImageWithGemini } from './utils/gemini';

export default function App() {
  // カスタムAPIキー設定（サーバー側にデフォルトキーがあるため空でも動作）
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // プリセット & 画像状態
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(PRESET_ITEMS[0].id);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(PRESET_ITEMS[0].imageSrc);
  const [currentScripts, setCurrentScripts] = useState<Record<ChannelType, ChannelScript>>(PRESET_ITEMS[0].scripts);
  const [isCustomImage, setIsCustomImage] = useState(false);

  // プレイヤー状態
  const [currentChannel, setCurrentChannel] = useState<ChannelType>('news');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isCleanView, setIsCleanView] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeScript = currentScripts[currentChannel];

  // APIキー保存
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  // 高音質実況ナレーション音声の再生シーケンス
  const startSpeechSequence = useCallback((fromIndex = 0) => {
    const linesToSpeak = activeScript.lines.slice(fromIndex);
    if (linesToSpeak.length === 0) return;

    setIsPlaying(true);

    if (isMuted) {
      // ミュート時のビジュアル自動進行
      let idx = fromIndex;
      setCurrentLineIndex(idx);
      const timer = setInterval(() => {
        idx++;
        if (idx < activeScript.lines.length) {
          setCurrentLineIndex(idx);
        } else {
          clearInterval(timer);
          setIsPlaying(false);
        }
      }, 3500);
      return;
    }

    // ニューラルTTSストリーミングシーケンサー
    narrator.speakSequence(linesToSpeak, {
      channel: currentChannel,
      onLineStart: (relativeIndex) => {
        const absoluteIndex = fromIndex + relativeIndex;
        setCurrentLineIndex(absoluteIndex);

        // 捜査モードで証拠フォーカスがあるときは効果音
        if (currentChannel === 'investigation' && activeScript.lines[absoluteIndex]?.evidencePoint) {
          soundFX.playInvestigationLock();
        }
      },
      onComplete: () => {
        setIsPlaying(false);
      }
    });
  }, [activeScript, isMuted, currentChannel]);

  // 再生 / 一時停止トグル
  const handleTogglePlay = () => {
    if (isPlaying) {
      narrator.stop();
      setIsPlaying(false);
    } else {
      startSpeechSequence(currentLineIndex >= activeScript.lines.length - 1 ? 0 : currentLineIndex);
    }
  };

  // リプレイ（最初から再生）
  const handleRestart = () => {
    narrator.stop();
    setCurrentLineIndex(0);
    // チャンネル固有の番組開始チャイム音
    if (!isMuted) {
      if (currentChannel === 'news') soundFX.playNewsAlert();
      else if (currentChannel === 'documentary') soundFX.playDocumentaryChime();
      else if (currentChannel === 'investigation') soundFX.playInvestigationLock();
    }
    setTimeout(() => {
      startSpeechSequence(0);
    }, 300);
  };

  // 特定フレーズの選択
  const handleSelectLine = (index: number) => {
    narrator.stop();
    setCurrentLineIndex(index);
    if (isPlaying) {
      startSpeechSequence(index);
    }
  };

  // チャンネル切り替え
  const handleChangeChannel = (newChannel: ChannelType) => {
    if (newChannel === currentChannel) return;
    narrator.stop();
    setCurrentChannel(newChannel);
    setCurrentLineIndex(0);

    // チャンネル効果音
    if (!isMuted) {
      if (newChannel === 'news') soundFX.playNewsAlert();
      else if (newChannel === 'documentary') soundFX.playDocumentaryChime();
      else if (newChannel === 'investigation') soundFX.playInvestigationLock();
    }

    // 自動で実況再生開始
    setTimeout(() => {
      startSpeechSequence(0);
    }, 400);
  };

  // プリセット選択
  const handleSelectPreset = (preset: PresetItem) => {
    narrator.stop();
    setIsPlaying(false);
    setSelectedPresetId(preset.id);
    setCurrentImageSrc(preset.imageSrc);
    setCurrentScripts(preset.scripts);
    setIsCustomImage(false);
    setCurrentLineIndex(0);

    if (!isMuted) {
      soundFX.playCameraShutter();
      setTimeout(() => {
        if (currentChannel === 'news') soundFX.playNewsAlert();
        else if (currentChannel === 'documentary') soundFX.playDocumentaryChime();
        else if (currentChannel === 'investigation') soundFX.playInvestigationLock();
      }, 200);
    }

    setTimeout(() => {
      startSpeechSequence(0);
    }, 500);
  };

  // ユーザー画像のアップロード＆Gemini解析（APIキー入力不要！サーバーサイド完全自動）
  const handleImageUploaded = async (base64Data: string, mimeType: string) => {
    narrator.stop();
    setIsPlaying(false);

    try {
      setIsAnalyzing(true);
      setCurrentImageSrc(base64Data);
      setSelectedPresetId(null);
      setIsCustomImage(true);
      soundFX.playCameraShutter();

      // サーバー側のGemini 3.8 Flashで解析（apiKeyは設定されていれば送信）
      const analyzedScripts = await analyzeImageWithGemini(base64Data, mimeType, apiKey);
      setCurrentScripts(analyzedScripts);
      setCurrentLineIndex(0);
      setIsAnalyzing(false);

      // 解析完了直後に番組速報音＆自動実況再生
      if (!isMuted) {
        if (currentChannel === 'news') soundFX.playNewsAlert();
        else if (currentChannel === 'documentary') soundFX.playDocumentaryChime();
        else if (currentChannel === 'investigation') soundFX.playInvestigationLock();
      }

      setTimeout(() => {
        startSpeechSequence(0);
      }, 500);
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : '解析中にエラーが発生しました。';
      alert(`AI解析エラー: ${msg}`);
    }
  };

  // クリーンモード時 ESCキーで戻る
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCleanView) {
        setIsCleanView(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCleanView]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans">
      {/* ナビバー（クリーン表示時は非表示） */}
      {!isCleanView && (
        <Navbar
          onOpenSettings={() => setSettingsOpen(true)}
          isCustomImage={isCustomImage}
        />
      )}

      {/* メインコンテンツエリア */}
      <main className={`flex-1 flex flex-col justify-start px-2 sm:px-4 py-3 sm:py-6 ${isCleanView ? 'p-0' : ''}`}>
        
        {/* チャンネル選択タブ（クリーン表示時は非表示） */}
        {!isCleanView && (
          <ChannelTabs
            currentChannel={currentChannel}
            onChangeChannel={handleChangeChannel}
          />
        )}

        {/* 放送画面プレイヤー本体 */}
        <BroadcastPlayer
          imageSrc={currentImageSrc}
          script={activeScript}
          channel={currentChannel}
          currentLineIndex={currentLineIndex}
          isPlaying={isPlaying}
          aspectRatio={aspectRatio}
          isCleanView={isCleanView}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          onExitCleanView={() => setIsCleanView(false)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
        />

        {/* プレイヤーコントロールバー（クリーン表示時は非表示） */}
        {!isCleanView && (
          <>
            <PlayerControls
              isPlaying={isPlaying}
              totalLines={activeScript.lines.length}
              currentLineIndex={currentLineIndex}
              aspectRatio={aspectRatio}
              onTogglePlay={handleTogglePlay}
              onRestart={handleRestart}
              onToggleAspectRatio={() => setAspectRatio(prev => prev === '16:9' ? '9:16' : '16:9')}
              onEnterCleanView={() => setIsCleanView(true)}
              onSelectLine={handleSelectLine}
            />

            {/* AI画像アップローダー（端末側のAPIキー設定不要で直接利用可能！） */}
            <ImageUploader
              onImageSelected={handleImageUploaded}
              isAnalyzing={isAnalyzing}
            />

            {/* デモプリセットセレクター */}
            <PresetSelector
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* フッター */}
            <footer className="w-full max-w-4xl mx-auto mt-8 mb-4 text-center text-neutral-600 text-[11px] space-y-1">
              <p>AI BROADCAST STUDIO ── テレビ報道・密着ドキュメンタリー・特別捜査本部</p>
              <p className="text-neutral-500">
                Microsoft Edge Neural TTS 自然言語音声 ＆ Gemini マルチモーダル映像解析
              </p>
            </footer>
          </>
        )}
      </main>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
