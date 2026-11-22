import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameArena } from './components/GameArena';
import { GameOverModal } from './components/GameOverModal';
import { Lobby } from './components/Lobby';
import { BotGameController } from './components/BotGameController';
import { Player, Room } from './types/game';

type PlayerProfile = { name: string; avatar: string; color: string };
type RoomSummary = { id: string; name: string; playerCount: number; maxPlayers: number; status: string };
type RoomResult = { ok: boolean; room?: Room; error?: string };

interface ServerToClientEvents {
  'room:update': (room: Room) => void;
  'rooms:update': (rooms: RoomSummary[]) => void;
  'game:error': (message: string) => void;
  'match:waiting': () => void;
}

interface ClientToServerEvents {
  'rooms:list': (callback: (rooms: RoomSummary[]) => void) => void;
  'room:create': (payload: { name: string; profile: PlayerProfile }, callback: (result: RoomResult) => void) => void;
  'room:join': (payload: { roomId: string; profile: PlayerProfile }, callback: (result: RoomResult) => void) => void;
  'match:quick': (profile: PlayerProfile, callback: (result: RoomResult) => void) => void;
  'room:leave': () => void;
  'player:ready': () => void;
  'game:start': () => void;
  'game:rematch': () => void;
  'player:move': (move: { dx: number; dy: number }) => void;
  'player:shoot': () => void;
  'room:chat': (message: { text: string; isStamp: boolean }) => void;
}

const PROFILE_KEY = 'cyber-battle-profile';
const DEFAULT_PROFILE: PlayerProfile = { name: '', avatar: '⚡', color: '#00f3ff' };

function getSavedProfile(): PlayerProfile {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
  } catch {
    // Ignore unavailable or malformed local profile data.
  }
  return DEFAULT_PROFILE;
}

export default function GameApp() {
  const [profile, setProfile] = useState<PlayerProfile>(getSavedProfile);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomList, setRoomList] = useState<RoomSummary[]>([]);
  const [toast, setToast] = useState('');
  const [botWinner, setBotWinner] = useState<Player | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const botControllerRef = useRef<BotGameController | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  activeRoomIdRef.current = room?.id || null;

  const showError = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/socket.io',
      reconnection: true,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('rooms:list', setRoomList);
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));
    socket.on('rooms:update', setRoomList);
    socket.on('room:update', (nextRoom) => {
      const socketId = socket.id;
      if ((socketId && nextRoom.players[socketId]) || nextRoom.id === activeRoomIdRef.current) setRoom(nextRoom);
    });
    socket.on('game:error', showError);
    socket.on('match:waiting', () => showError('対戦相手を探しています。相手が参加すると対戦が始まります。'));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showError]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => () => botControllerRef.current?.destroy(), []);

  const updateProfile = (key: keyof PlayerProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const clearBotGame = () => {
    botControllerRef.current?.destroy();
    botControllerRef.current = null;
    setBotWinner(null);
  };

  const leaveRoom = () => {
    clearBotGame();
    socketRef.current?.emit('room:leave');
    setRoom(null);
  };

  const createRoom = (name: string) => {
    socketRef.current?.emit('room:create', { name, profile }, (result) => {
      if (result.ok && result.room) setRoom(result.room);
      else showError(result.error || '部屋を作成できませんでした。');
    });
  };

  const joinRoom = (roomId: string) => {
    socketRef.current?.emit('room:join', { roomId, profile }, (result) => {
      if (result.ok && result.room) setRoom(result.room);
      else showError(result.error || '部屋に参加できませんでした。');
    });
  };

  const quickMatch = () => {
    socketRef.current?.emit('match:quick', profile, (result) => {
      if (result.ok && result.room) setRoom(result.room);
      else showError(result.error || 'マッチングを開始できませんでした。');
    });
  };

  const refreshRooms = () => {
    socketRef.current?.emit('rooms:list', setRoomList);
  };

  const startBotMatch = (difficulty: 'easy' | 'normal' | 'hard') => {
    leaveRoom();
    setBotDifficulty(difficulty);
    setRoom(null);
    botControllerRef.current = new BotGameController(
      profile,
      difficulty,
      (nextRoom) => setRoom({ ...nextRoom }),
      (winner) => setBotWinner(winner),
    );
  };

  const rematch = () => {
    if (room?.id === 'BOT-SOLO') startBotMatch(botDifficulty);
    else socketRef.current?.emit('game:rematch');
  };

  const activeWinner = room?.winner || botWinner;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-black tracking-wide text-cyan-300">CYBER BATTLE ARENA</h1>
            <p className="hidden text-[10px] text-slate-500 sm:block">リアルタイム陣取りオンライン対戦</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span className={isConnected ? 'text-emerald-300' : 'text-rose-300'}>
              {isConnected ? 'サーバー接続中' : 'サーバー接続待ち'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-2 pb-10">
        {room ? (
          <GameArena
            room={room}
            myId={room.id === 'BOT-SOLO' ? 'human' : socketRef.current?.id || ''}
            onMove={(dx, dy) => {
              if (room.id === 'BOT-SOLO') botControllerRef.current?.humanMove(dx, dy);
              else socketRef.current?.emit('player:move', { dx, dy });
            }}
            onShoot={() => {
              if (room.id === 'BOT-SOLO') botControllerRef.current?.humanShoot();
              else socketRef.current?.emit('player:shoot');
            }}
            onSendChat={(text, isStamp = false) => {
              if (room.id === 'BOT-SOLO') botControllerRef.current?.sendChat(text, isStamp);
              else socketRef.current?.emit('room:chat', { text, isStamp });
            }}
            onToggleReady={() => socketRef.current?.emit('player:ready')}
            onStartGame={() => socketRef.current?.emit('game:start')}
            onLeaveRoom={leaveRoom}
          />
        ) : (
          <Lobby
            playerName={profile.name}
            setPlayerName={(name) => updateProfile('name', name)}
            playerAvatar={profile.avatar}
            setPlayerAvatar={(avatar) => updateProfile('avatar', avatar)}
            playerColor={profile.color}
            setPlayerColor={(color) => updateProfile('color', color)}
            onQuickMatch={quickMatch}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onStartBotMatch={startBotMatch}
            roomList={roomList}
            onRefreshRooms={refreshRooms}
            isConnected={isConnected}
          />
        )}
      </main>

      {room && (room.status === 'finished' || botWinner) && (
        <GameOverModal
          room={room}
          winner={activeWinner}
          myId={room.id === 'BOT-SOLO' ? 'human' : socketRef.current?.id || ''}
          onRematch={rematch}
          onLeave={leaveRoom}
        />
      )}
      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-500/30 bg-slate-900 px-4 py-3 text-center text-sm text-slate-100 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
