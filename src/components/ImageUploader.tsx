import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isAnalyzing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイル（PNG, JPEG, WebP等）を選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageSelected(result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0 mt-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isAnalyzing) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-red-500 bg-red-950/20'
            : 'border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/60 hover:border-neutral-600'
        }`}
      >
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <div className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
              <span>AIマルチモーダル解析中...</span>
            </div>
            <div className="text-xs text-neutral-400">
              画像の些細な写り込みから、3番組分の辛口実況台本を執筆しています
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
                <UploadCloud className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <span>スクショや写真を投稿するだけで即座に自動実況！</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    APIキー設定済み
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  日常のLINE、散らかった部屋、カフェ、ペット…AIが大真面目にテレビ特番化
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ImageIcon className="w-4 h-4" />
                <span>写真・スクショを選ぶ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
