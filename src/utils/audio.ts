import { ChannelType } from '../types/broadcasting';

// Web Audio API Sound Generator for TV-grade sound effects
class SoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. 【NEWS 24】ニュース速報チャイム
  playNewsAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [587.33, 739.99, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }

  // 2. 【情熱の流儀】ドキュメンタリー風 ピアノ低音＆和音
  playDocumentaryChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [110.0, 164.81, 261.63];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.3);
      });
    } catch (e) {
      console.warn('Documentary chime failed', e);
    }
  }

  // 3. 【特別捜査本部】照準ロックオン・サイバー電子音
  playInvestigationLock() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [0, 0.08, 0.18].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(i === 2 ? 1800 : 1200, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch (e) {
      console.warn('Investigation sound failed', e);
    }
  }

  // カメラシャッター音
  playCameraShutter() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Shutter sound failed', e);
    }
  }
}

export const soundFX = new SoundFX();

// ----------------------------------------------------
// プロクオリティ・ナレーション再生マネージャー
// （インターネット Neural TTS優先 ＋ Web Speech API フォールバック）
// ----------------------------------------------------
export class BroadcastNarrator {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCancelled: boolean = false;
  private audioBlobCache = new Map<string, string>();

  public stop() {
    this.isCancelled = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * サーバーの高品質ニューラルTTSから音声Blobを取得
   */
  private async fetchNeuralAudio(text: string, channel: ChannelType): Promise<string> {
    const cacheKey = `${channel}_${text}`;
    if (this.audioBlobCache.has(cacheKey)) {
      return this.audioBlobCache.get(cacheKey)!;
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel })
    });

    if (!res.ok) {
      throw new Error(`TTS server responded with ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    this.audioBlobCache.set(cacheKey, blobUrl);
    return blobUrl;
  }

  /**
   * 単一フレーズを再生（ニューラルTTS優先）
   */
  private playPhrase(text: string, channel: ChannelType): Promise<void> {
    return new Promise(async (resolve) => {
      if (this.isCancelled) {
        resolve();
        return;
      }

      try {
        // 1. インターネット経由の超高音質ニューラル音声を取得・再生
        const audioUrl = await this.fetchNeuralAudio(text, channel);
        if (this.isCancelled) {
          resolve();
          return;
        }

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        // 安全タイマー（最長でも文字数*300ms + 3秒で次へ進める）
        const safetyTimer = setTimeout(() => {
          resolve();
        }, Math.max(3000, text.length * 300 + 3000));

        audio.onended = () => {
          clearTimeout(safetyTimer);
          resolve();
        };

        audio.onerror = () => {
          clearTimeout(safetyTimer);
          // エラー時はWeb Speech APIへフォールバック
          this.fallbackWebSpeech(text, resolve);
        };

        await audio.play();
      } catch (err) {
        // ネットワーク障害・オフライン時はWeb Speech APIでフォールバック
        console.warn('Neural TTS failed, using fallback:', err);
        this.fallbackWebSpeech(text, resolve);
      }
    });
  }

  private fallbackWebSpeech(text: string, resolve: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || this.isCancelled) {
      setTimeout(resolve, Math.max(2000, text.length * 150));
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utter;
    utter.lang = 'ja-JP';

    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
    if (voices.length > 0) utter.voice = voices[0];

    const safetyTimer = setTimeout(() => resolve(), Math.max(2500, text.length * 250));

    utter.onend = () => {
      clearTimeout(safetyTimer);
      resolve();
    };
    utter.onerror = () => {
      clearTimeout(safetyTimer);
      resolve();
    };

    window.speechSynthesis.speak(utter);
  }

  /**
   * シーケンス全体を順番に再生
   */
  public async speakSequence(
    lines: Array<{ text: string }>,
    options: {
      channel: ChannelType;
      onLineStart: (index: number) => void;
      onComplete: () => void;
    }
  ) {
    this.stop();
    this.isCancelled = false;

    for (let i = 0; i < lines.length; i++) {
      if (this.isCancelled) break;

      options.onLineStart(i);
      await this.playPhrase(lines[i].text, options.channel);

      // テレビ番組らしい自然な間（350ms）
      if (!this.isCancelled && i < lines.length - 1) {
        await new Promise(r => setTimeout(r, 350));
      }
    }

    if (!this.isCancelled) {
      options.onComplete();
    }
  }
}

export const narrator = new BroadcastNarrator();
