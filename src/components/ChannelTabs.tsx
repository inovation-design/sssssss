import React from 'react';
import { ChannelType } from '../types/broadcasting';
import { Radio, Film, ShieldAlert } from 'lucide-react';

interface ChannelTabsProps {
  currentChannel: ChannelType;
  onChangeChannel: (channel: ChannelType) => void;
}

export const ChannelTabs: React.FC<ChannelTabsProps> = ({
  currentChannel,
  onChangeChannel
}) => {
  const channels = [
    {
      id: 'news' as ChannelType,
      name: 'NEWS 24',
      sub: '緊急ニュース速報',
      desc: '重大スクープとして大真面目に過剰報道',
      icon: Radio,
      activeColor: 'bg-red-950/70 border-red-600 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.4)]',
      badgeBg: 'bg-red-600 text-white'
    },
    {
      id: 'documentary' as ChannelType,
      name: '情熱の流儀',
      sub: '密着ドキュメンタリー',
      desc: '本人の美学と孤独な葛藤を勝手に捏造',
      icon: Film,
      activeColor: 'bg-neutral-900 border-neutral-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]',
      badgeBg: 'bg-neutral-700 text-neutral-100'
    },
    {
      id: 'investigation' as ChannelType,
      name: '特別捜査本部',
      sub: 'プロファイリング尋問',
      desc: '細部の写り込みから深層心理を冷徹に鑑識',
      icon: ShieldAlert,
      activeColor: 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
      badgeBg: 'bg-emerald-600 text-black font-bold'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-3 px-2 sm:px-0">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isActive = currentChannel === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => onChangeChannel(ch.id)}
              className={`relative flex flex-col items-center sm:items-start p-2 sm:p-3 rounded-lg border transition-all text-left group ${
                isActive
                  ? ch.activeColor
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full justify-between mb-1">
                <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase ${
                  isActive ? ch.badgeBg : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {ch.name}
                </span>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                }`} />
              </div>

              <div className="font-bold text-xs sm:text-sm tracking-tight truncate w-full">
                {ch.sub}
              </div>

              <div className="hidden sm:block text-[11px] text-neutral-400 mt-1 line-clamp-1 leading-snug">
                {ch.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
