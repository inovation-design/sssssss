export type ChannelType = 'news' | 'documentary' | 'investigation';

export interface ScriptLine {
  text: string;              // 音声読み上げ用テキスト
  displaySubtitle: string;   // 画面表示用テロップ
  subNote?: string;          // 小見出しや注記
  speaker?: string;          // 話者（「報道アナウンサー」「語り：」「捜査官」）
  evidencePoint?: {          // 特別捜査本部用のフォーカス座標 (0-100%)
    x: number;
    y: number;
    label: string;
    detail: string;
  };
}

export interface ChannelScript {
  channelId: ChannelType;
  channelName: string;
  badge: string;             // 左上バッジ例: "BREAKING NEWS", "密着280日", "EVIDENCE #01"
  headline: string;          // メイン見出し
  subheadline: string;       // サブ見出し
  tickerText: string;        // 画面下部を流れるティッカー
  speechParams: {
    rate: number;            // 読み上げ速度 (0.8 ~ 1.2)
    pitch: number;           // ピッチ (0.7 ~ 1.3)
  };
  lines: ScriptLine[];
}

export interface PresetItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  imageSrc: string;
  scripts: Record<ChannelType, ChannelScript>;
}
