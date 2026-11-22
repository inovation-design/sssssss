import React from 'react';
import { PRESET_ITEMS } from '../data/presets';
import { PresetItem } from '../types/broadcasting';
import { Sparkles } from 'lucide-react';

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetItem) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>デモサンプル（APIキー不要・ワンタップ再生）</span>
        </div>
        <span className="text-[11px] text-neutral-500">3つの定番シチュエーション</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {PRESET_ITEMS.map((item) => {
          const isSelected = selectedPresetId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPreset(item)}
              className={`flex items-start gap-3 p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-neutral-800 border-red-500 shadow-md ring-1 ring-red-500'
                  : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
              }`}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-950 border border-neutral-800">
                <img
                  src={item.imageSrc}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{item.thumbnail}</span>
                  <div className="font-bold text-xs sm:text-sm text-neutral-100 truncate">
                    {item.title}
                  </div>
                </div>
                <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
