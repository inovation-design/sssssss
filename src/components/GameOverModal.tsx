import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Crosshair, Flag } from 'lucide-react';
import { Room, Player } from '../types/game';

interface GameOverModalProps {
  room: Room;
  winner: Player | null;
  myId: string;
  onRematch: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  room,
  winner,
  myId,
  onRematch,
  onLeave
}) => {
  const isMeWinner = winner?.id === myId;
  const players = Object.values(room.players);
  const totalCells = 20 * 20;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Glow backdrop */}
        <div 
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: winner?.color || '#00f3ff' }}
        />
        <div 
          className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: isMeWinner ? '#39ff14' : '#ff007f' }}
        />

        {/* Header result */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 mb-3 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8 text-slate-950 font-black" />
          </div>

          <h2 className="text-2xl font-black tracking-wide">
            {isMeWinner ? (
              <span className="text-emerald-400 neon-text-cyan">VICTORY ! 勝利！</span>
            ) : winner ? (
              <span className="text-pink-400 neon-text-pink">DEFEAT... 敗北</span>
            ) : (
              <span className="text-cyan-400">DRAW! 引き分け</span>
            )}
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            勝者：<span className="font-bold text-white">{winner?.name || 'なし'}</span> ({winner?.avatar})
          </p>
        </div>

        {/* Players performance stats */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            バトル戦績・領地獲得率
          </h3>
          {players.map((p) => {
            const territoryPercent = Math.round((p.territoryCount / totalCells) * 100);
            const isWinnerItem = p.id === winner?.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isWinnerItem
                    ? 'bg-slate-800/80 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border"
                    style={{
                      backgroundColor: `${p.color}22`,
                      borderColor: p.color,
                      color: p.color
                    }}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      {p.id === myId && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 font-mono">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Flag className="w-3 h-3 text-cyan-400" />
                        {territoryPercent}% 領地 ({p.territoryCount}マス)
                      </span>
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-pink-400" />
                        {p.kills} KO
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-mono font-extrabold text-amber-300">
                    {p.score + p.territoryCount * 10}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">SCORE</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <Home className="w-4 h-4" /> ロビーへ戻る
          </button>
          <button
            onClick={onRematch}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> もう1回対戦！
          </button>
        </div>
      </div>
    </div>
  );
};
