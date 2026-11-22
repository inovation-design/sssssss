import React, { useState } from 'react';
import { 
  Zap, 
  Users, 
  Bot, 
  Plus, 
  LogIn, 
  RefreshCw, 
  HelpCircle, 
  Sparkles, 
  ShieldAlert, 
  Gamepad, 
  Copy, 
  Check 
} from 'lucide-react';
import { GameMode } from '../types/game';

interface LobbyProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  onQuickMatch: () => void;
  onCreateRoom: (roomName: string) => void;
  onJoinRoom: (roomId: string) => void;
  onStartBotMatch: (difficulty: 'easy' | 'normal' | 'hard') => void;
  roomList: Array<{ id: string; name: string; playerCount: number; maxPlayers: number; status: string }>;
  onRefreshRooms: () => void;
  isConnected: boolean;
}

const AVATAR_OPTIONS = ['⚡', '🔥', '🚀', '🤖', '👑', '⚔️', '🐱', '🎮'];
const COLOR_OPTIONS = [
  { name: 'Neon Cyan', hex: '#00f3ff' },
  { name: 'Neon Pink', hex: '#ff007f' },
  { name: 'Neon Green', hex: '#39ff14' },
  { name: 'Neon Amber', hex: '#ffaa00' }
];

export const Lobby: React.FC<LobbyProps> = ({
  playerName,
  setPlayerName,
  playerAvatar,
  setPlayerAvatar,
  playerColor,
  setPlayerColor,
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
  onStartBotMatch,
  roomList,
  onRefreshRooms,
  isConnected
}) => {
  const [roomNameInput, setRoomNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Player customization card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar preview */}
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 transition-transform transform group-hover:scale-105"
              style={{
                backgroundColor: `${playerColor}1c`,
                borderColor: playerColor,
                boxShadow: `0 0 20px ${playerColor}44`
              }}
            >
              {playerAvatar}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900"
              style={{ backgroundColor: playerColor }}
            />
          </div>

          {/* Nickname and color options */}
          <div className="flex-1 w-full space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                プレイヤー名（ニックネーム）
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                placeholder="名前を入力..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm font-medium text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Avatar selection */}
              <div>
                <span className="block text-xs text-slate-400 mb-1">アバター選択</span>
                <div className="flex items-center gap-1.5">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setPlayerAvatar(av)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                        playerAvatar === av
                          ? 'bg-slate-700 border-2 border-cyan-400 scale-110 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection */}
              <div>
                <span className="block text-xs text-slate-400 mb-1">イメージカラー</span>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => setPlayerColor(col.hex)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        playerColor === col.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode 1: Quick Match */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-5 shadow-xl transition-all hover:shadow-cyan-500/10 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              クイックマッチ
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                1 CLICK
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              待機中のプレイヤーと即座にマッチング！1対1でリアルタイムに陣地を取り合うスピードバトル。
            </p>
          </div>

          <button
            onClick={onQuickMatch}
            disabled={!isConnected}
            className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isConnected
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            {isConnected ? '今すぐ対戦を探す' : 'サーバー接続待ち'}
          </button>
        </div>

        {/* Mode 2: Custom Room */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/30 border border-pink-500/30 hover:border-pink-400 rounded-2xl p-5 shadow-xl transition-all hover:shadow-pink-500/10 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              ルームマッチ
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/20 text-pink-300 font-mono">
                ROOM
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              部屋を作って合言葉を友達にシェア、または友達の部屋コードを入力してプライベート対戦！
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isConnected}
              className="py-2.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-pink-600/30"
            >
              <Plus className="w-4 h-4" /> 部屋を作る
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              disabled={!isConnected}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <LogIn className="w-4 h-4" /> 部屋に入る
            </button>
          </div>
        </div>

        {/* Mode 3: Solo AI Bot */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-5 shadow-xl transition-all hover:shadow-emerald-500/10 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              ソロ・ボット練習
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                OFFLINE
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              サーバー不要でいつでも遊べる！賢いAIボットと領地獲得の腕試しや操作練習。
            </p>

            {/* Difficulty selection */}
            <div className="grid grid-cols-3 gap-1 mb-4">
              {(['easy', 'normal', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setBotDifficulty(diff)}
                  className={`py-1 text-xs rounded-lg font-medium transition-colors ${
                    botDifficulty === diff
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {diff === 'easy' ? '初級' : diff === 'normal' ? '中級' : '上級'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStartBotMatch(botDifficulty)}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
          >
            <Bot className="w-4 h-4" /> AIと今すぐ対戦
          </button>
        </div>
      </div>

      {/* Available Rooms List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              公開対戦ルーム一覧
            </h3>
            <span className="text-xs text-slate-400 font-mono">({roomList.length}室)</span>
          </div>
          <button
            onClick={onRefreshRooms}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
            title="更新"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {roomList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            現在公開されている待機部屋はありません。
            <br />
            「部屋を作る」または「クイックマッチ」で対戦を始めましょう！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomList.map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">{room.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                      ID: {room.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    人数: {room.playerCount} / {room.maxPlayers}人
                  </p>
                </div>
                <button
                  onClick={() => onJoinRoom(room.id)}
                  disabled={room.playerCount >= room.maxPlayers || room.status !== 'waiting'}
                  className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs transition-colors"
                >
                  参加する
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules / Guide banner */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong className="text-slate-200">基本ルール：</strong> 移動すると自分の色にマスが染まります。
            制限時間60秒でより多くの陣地を染めたプレイヤーの勝利！
          </span>
        </div>
        <div className="font-mono text-[11px] text-cyan-400">
          操作: [WASD / 矢印] 移動 ｜ [Space / 画面ボタン] エネルギー弾
        </div>
      </div>

      {/* Modal: Create Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">新しい対戦部屋を作成</h3>
            <label className="block text-xs text-slate-400 mb-1">部屋名</label>
            <input
              type="text"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value.slice(0, 24))}
              placeholder={`${playerName}の対戦部屋`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mb-4 outline-none focus:border-cyan-400"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  onCreateRoom(roomNameInput.trim() || `${playerName}の対戦部屋`);
                  setShowCreateModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-md"
              >
                作成する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Join Room with Code */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">合言葉（部屋コード）で参加</h3>
            <label className="block text-xs text-slate-400 mb-1">5桁のコードを入力</label>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="例: AB3X9"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white mb-4 outline-none focus:border-pink-400"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (joinCodeInput.trim()) {
                    onJoinRoom(joinCodeInput.trim());
                    setShowJoinModal(false);
                  }
                }}
                disabled={!joinCodeInput.trim()}
                className="flex-1 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs shadow-md"
              >
                参加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
