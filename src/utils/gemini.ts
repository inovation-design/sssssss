import { ChannelScript, ChannelType } from '../types/broadcasting';

interface AnalyzeImageResponse {
  news: ChannelScript;
  documentary: ChannelScript;
  investigation: ChannelScript;
}

export async function analyzeImageWithGemini(
  imageBase64: string,
  mimeType: string,
  apiKey?: string
): Promise<Record<ChannelType, ChannelScript>> {
  // サーバーの /api/analyze を呼び出し（サーバー側でデフォルトAPIキーを保持しているためAPIキー不要で動作）
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      apiKey: apiKey || ''
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `解析サーバーエラー (${response.status})`);
  }

  const parsed: AnalyzeImageResponse = await response.json();

  return {
    news: parsed.news,
    documentary: parsed.documentary,
    investigation: parsed.investigation
  };
}
