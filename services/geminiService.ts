import { GoogleGenAI } from "@google/genai";
import { VideoMetadata, Platform, ThumbnailInfo } from "../types";

export class GeminiService {
  private ai: any;

  constructor() {
    let apiKey = "";
    try {
      apiKey = typeof process !== 'undefined' ? (process.env.API_KEY || "") : "";
    } catch (e) {
      console.error("API_KEY Access Error.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async fetchRumbleMetadata(url: string): Promise<VideoMetadata> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Rumble link: ${url}. 
        Identify the video title and the direct URL of the highest resolution cover image (thumbnail).
        Return ONLY a JSON object with keys: "title" and "thumbnailUrl".`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });

      const data = JSON.parse(response.text.trim());
      
      if (!data.thumbnailUrl) throw new Error("Thumbnail not found.");

      const thumbnails: ThumbnailInfo[] = [
        { url: data.thumbnailUrl, label: 'Original Resolution' }
      ];

      return {
        id: url.split('/').pop()?.split('-')[0] || 'rumble-vid',
        title: data.title || 'Rumble Video',
        platform: Platform.RUMBLE,
        originalUrl: url,
        thumbnails
      };
    } catch (error) {
      console.error("Gemini Error:", error);
      throw new Error("Unable to extract Rumble metadata. Please ensure API_KEY is set.");
    }
  }
}