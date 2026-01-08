
import { GoogleGenAI } from "@google/genai";
import { VideoMetadata, Platform, ThumbnailInfo } from "../types";

export class GeminiService {
  private ai: any;

  constructor() {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async fetchRumbleMetadata(url: string): Promise<VideoMetadata> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise este link do Rumble: ${url}. 
        Encontre o título do vídeo e a URL direta da imagem de capa (thumbnail) em maior resolução disponível.
        Retorne APENAS um objeto JSON com: "title" e "thumbnailUrl".`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });

      const data = JSON.parse(response.text.trim());
      
      if (!data.thumbnailUrl) throw new Error("Thumbnail não encontrada.");

      const thumbnails: ThumbnailInfo[] = [
        { url: data.thumbnailUrl, label: 'Resolução Original (Rumble)' }
      ];

      return {
        id: url.split('/').pop()?.split('-')[0] || 'rumble-vid',
        title: data.title || 'Vídeo do Rumble',
        platform: Platform.RUMBLE,
        originalUrl: url,
        thumbnails
      };
    } catch (error) {
      console.error("Erro Gemini:", error);
      throw new Error("A IA não conseguiu extrair os dados deste link do Rumble. Verifique se a API_KEY está correta na Vercel.");
    }
  }
}
