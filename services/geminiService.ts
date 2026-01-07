
import { GoogleGenAI } from "@google/genai";
import { VideoMetadata, Platform, ThumbnailInfo } from "../types";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async fetchRumbleMetadata(url: string): Promise<VideoMetadata> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extraia o título exato e o URL da imagem de miniatura (thumbnail) de alta resolução para este vídeo do Rumble: ${url}. 
      Retorne os dados estritamente em formato JSON com as chaves "title" (string) e "thumbnailUrl" (string).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    try {
      const data = JSON.parse(response.text.trim());
      const thumbnails: ThumbnailInfo[] = [
        { url: data.thumbnailUrl, label: 'Resolução Máxima' }
      ];

      return {
        id: url.split('/').pop() || 'rumble-video',
        title: data.title || 'Vídeo do Rumble',
        platform: Platform.RUMBLE,
        originalUrl: url,
        thumbnails
      };
    } catch (error) {
      console.error("Erro ao processar resposta do Gemini:", error);
      throw new Error("Não foi possível extrair metadados do Rumble.");
    }
  }
}
