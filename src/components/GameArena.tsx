import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  RotateCcw, 
  Crosshair, 
  Shield, 
  Zap, 
  Clock, 
  Send, 
  MessageSquare, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Room, Player } from '../types/game';
import { sounds } from '../utils/sound';

interface GameArenaProps {
  room: Room;
  myId: string;
  onMove: (dx: number, dy: number) => void;
  onShoot: () => void;
  onSendChat: (text: string, isStamp?: boolean) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const STAMPS = ['🔥', '💥', '👑', '⚡', '😂', '👍'];

const COLOR_MAP: Record<number, string> = {
  1: '#00f3ff', // Neon Cyan
  2: '#ff007f', // Neon Magenta
  3: '#39ff14', // Neon Green
  4: '#ffaa00'  // Neon Amber
};

export const GameArena: React.FC<GameArenaProps> = ({
  room,
  myId,
  onMove,
  onShoot,
  onSendChat,
  onToggleReady,
  onStartGame,
  onLeaveRoom
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [floatingStamps, setFloatingStamps] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const myPlayer = room.players[myId];
  const isHost = room.hostId === myId;
  const isPlaying = room.status === 'playing';
  const isWaiting = room.status === 'waiting';
  const players = Object.values(room.players);
  const totalCells = 20 * 20;

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in chat input, ignore game hotkeys
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!isPlaying) return;

      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1;
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          onShoot();
          sounds.playShoot();
          return;
        default:
          return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        onMove(dx, dy);
        sounds.playClaim();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onMove, onShoot]);

  // Scroll chat to bottom
  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room.chat, showChat]);

  // Handle stamp trigger
  const handleStamp = (emoji: string) => {
    onSendChat(emoji, true);
    sounds.playPowerup();

    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.floor(Math.random() * 60) + 20;
    setFloatingStamps((prev) => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingStamps((prev) => prev.filter((s) => s.id !== id));
    }, 1800);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 flex flex-col items-center">
      {/* Top Territory Bar & Countdown HUD */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Room info & code */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white hidden sm:inline">{room.name}</span>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-400 border border-slate-700 transition-colors"
              title="部屋コードをコピー"
            >
              <span>CODE: {room.id}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700">
            <Clock className={`w-4 h-4 ${room.timeRemaining <= 10 ? 'text-pink-500 animate-spin' : 'text-cyan-400'}`} />
            <span
              className={`font-mono text-base font-extrabold ${
                room.timeRemaining <= 10 ? 'text-pink-400 animate-pulse' : 'text-white'
              }`}
            >
              {room.timeRemaining}s
            </span>
          </div>

          {/* Actions & Leave */}
          <button
            onClick={onLeaveRoom}
            className="text-xs text-slate-400 hover:text-pink-400 font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            退出
          </button>
        </div>

        {/* Territory % Breakdown Gauge */}
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800 shadow-inner">
          {players.map((p) => {
            const pct = (p.territoryCount / totalCells) * 100;
            return (
              <div
                key={p.id}
                className="h-full transition-all duration-300 relative group"
                style={{
                  width: `${pct}%`,
                  backgroundColor: p.color
                }}
                title={`${p.name}: ${Math.round(pct)}%`}
              />
            );
          })}
        </div>

        {/* Player score pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
          {players.map((p) => {
            const pct = Math.round((p.territoryCount / totalCells) * 100);
            return (
              <div key={p.id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-slate-300 font-medium truncate max-w-[90px] sm:max-w-[120px]">
                  {p.name}
                </span>
                <span className="font-extrabold" style={{ color: p.color }}>
                  {pct}%
                </span>
                <span className="text-slate-500 text-[10px]">({p.score}pt)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Stamp Reactions Animation Layer */}
      <div className="relative w-full flex justify-center">
        {floatingStamps.map((stamp) => (
          <div
            key={stamp.id}
            className="absolute z-40 pointer-events-none text-4xl animate-bounce"
            style={{
              left: `${stamp.x}%`,
              bottom: '10%',
              animation: 'fadeUp 1.8s forwards'
            }}
          >
            {stamp.emoji}
          </div>
        ))}

        {/* Waiting Lobby Overlay (if not started yet) */}
        {isWaiting && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">対戦準備中</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono text-center">
              部屋コード: <span className="font-bold text-cyan-400 text-sm">{room.id}</span> を友達に伝えて対戦しよう！
            </p>

            {/* Players ready state list */}
            <div className="w-full max-w-sm space-y-2 mb-6">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.avatar}</span>
                    <span className="font-bold text-sm text-slate-200">{p.name}</span>
                    {p.id === room.hostId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        HOST
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                      p.isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.isReady ? 'READY 準備完了' : 'WAITING 待機中'}
                  </span>
                </div>
              ))}
            </div>

            {/* Start / Ready Buttons */}
            <div className="flex items-center gap-3 w-full max-w-sm">
              <button
                onClick={onToggleReady}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
                  myPlayer?.isReady
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                }`}
              >
                {myPlayer?.isReady ? '準備完了を解除' : '準備完了！'}
              </button>

              {isHost && (
                <button
                  onClick={onStartGame}
                  disabled={players.length < 2}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" /> バトル開始！
                </button>
              )}
            </div>
            {isHost && players.length < 2 && (
              <p className="text-[11px] text-amber-400/80 mt-2 font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> 相手が参加するのを待っています...
              </p>
            )}
          </div>
        )}

        {/* 20x20 Grid Game Arena */}
        <div 
          className="relative rounded-2xl p-2 bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden aspect-square w-full max-w-[540px]"
        >
          {/* Grid Background cells */}
          <div
            className="w-full h-full grid gap-[1px] bg-slate-900/60 p-[1px] rounded-xl"
            style={{
              gridTemplateColumns: 'repeat(20, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(20, minmax(0, 1fr))'
            }}
          >
            {room.grid.map((row, y) =>
              row.map((ownerIndex, x) => {
                const color = ownerIndex > 0 ? COLOR_MAP[ownerIndex] : undefined;
                return (
                  <div
                    key={`${x}-${y}`}
                    className="w-full h-full rounded-[2px] transition-colors duration-150 relative"
                    style={{
                      backgroundColor: color ? `${color}40` : '#0b1120',
                      border: color ? `1px solid ${color}80` : '1px solid rgba(255,255,255,0.03)'
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Powerups Layer */}
          {room.powerups.map((p) => {
            const leftPct = (p.x / 20) * 100;
            const topPct = (p.y / 20) * 100;
            return (
              <div
                key={p.id}
                className="absolute z-10 w-[5%] h-[5%] flex items-center justify-center text-xs animate-bounce"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`
                }}
              >
                {p.type === 'speed' ? '⚡' : p.type === 'shield' ? '🛡️' : p.type === 'bomb' ? '💣' : '💥'}
              </div>
            );
          })}

          {/* Projectiles Layer */}
          {room.projectiles.map((proj) => {
            const leftPct = (proj.x / 20) * 100;
            const topPct = (proj.y / 20) * 100;
            return (
              <div
                key={proj.id}
                className="absolute z-15 w-[3.5%] h-[3.5%] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  backgroundColor: proj.color,
                  boxShadow: `0 0 10px ${proj.color}`
                }}
              />
            );
          })}

          {/* Players Layer */}
          {players.map((p) => {
            const leftPct = (p.x / 20) * 100;
            const topPct = (p.y / 20) * 100;
            const isMe = p.id === myId;

            return (
              <div
                key={p.id}
                className="absolute z-20 w-[5%] h-[5%] flex items-center justify-center transition-all duration-75"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`
                }}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center rounded-md font-bold text-xs select-none shadow-md"
                  style={{
                    backgroundColor: p.color,
                    boxShadow: `0 0 12px ${p.color}`,
                    color: '#000'
                  }}
                >
                  <span className="scale-90">{p.avatar}</span>
                  {p.hasShield && (
                    <div className="absolute inset-0 rounded-md border-2 border-cyan-400 animate-ping pointer-events-none" />
                  )}
                  {isMe && (
                    <div className="absolute -top-4 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap bg-black/60 px-1 rounded">
                      YOU
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stamp / Reaction Quick Bar */}
      <div className="w-full max-w-[540px] flex items-center justify-between gap-1.5 mt-3 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <span className="text-[11px] text-slate-400 font-mono">リアクション:</span>
        <div className="flex items-center gap-1.5">
          {STAMPS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleStamp(emoji)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 hover:scale-125 text-base flex items-center justify-center transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
            showChat ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="チャットを開く"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Touch Virtual D-Pad & Action Button */}
      <div className="w-full max-w-[540px] sm:hidden grid grid-cols-2 gap-4 mt-4">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto">
          <div />
          <button
            onClick={() => {
              onMove(0, -1);
              sounds.playClaim();
            }}
            className="w-11 h-11 rounded-xl bg-slate-800 active:bg-cyan-500 text-slate-200 active:text-slate-950 flex items-center justify-center shadow-md text-lg"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />
          <button
            onClick={() => {
              onMove(-1, 0);
              sounds.playClaim();
            }}
            className="w-11 h-11 rounded-xl bg-slate-800 active:bg-cyan-500 text-slate-200 active:text-slate-950 flex items-center justify-center shadow-md text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onMove(0, 1);
              sounds.playClaim();
            }}
            className="w-11 h-11 rounded-xl bg-slate-800 active:bg-cyan-500 text-slate-200 active:text-slate-950 flex items-center justify-center shadow-md text-lg"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onMove(1, 0);
              sounds.playClaim();
            }}
            className="w-11 h-11 rounded-xl bg-slate-800 active:bg-cyan-500 text-slate-200 active:text-slate-950 flex items-center justify-center shadow-md text-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Shoot Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              onShoot();
              sounds.playShoot();
            }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 active:scale-95 text-white font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-pink-500/30"
          >
            <Crosshair className="w-6 h-6" />
            <span>SHOOT</span>
          </button>
        </div>
      </div>

      {/* Slide-in Chat Drawer */}
      {showChat && (
        <div className="w-full max-w-[540px] bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">ルーム内チャット</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-xs text-slate-500 hover:text-white"
            >
              閉じる
            </button>
          </div>

          <div className="h-32 overflow-y-auto space-y-1.5 pr-2 mb-2">
            {room.chat.map((msg) => (
              <div key={msg.id} className="text-xs">
                <span className="font-bold mr-1.5" style={{ color: msg.senderColor }}>
                  {msg.senderName}:
                </span>
                <span className="text-slate-200 font-sans">{msg.text}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                onSendChat(chatInput.trim());
                setChatInput('');
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.slice(0, 80))}
              placeholder="メッセージを入力..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
