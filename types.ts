
export enum Platform {
  YOUTUBE = 'YouTube',
  RUMBLE = 'Rumble',
  UNKNOWN = 'Desconhecido'
}

export interface ThumbnailInfo {
  url: string;
  label: string;
  width?: number;
  height?: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  platform: Platform;
  originalUrl: string;
  thumbnails: ThumbnailInfo[];
}

export interface DownloadHistoryItem {
  timestamp: number;
  metadata: VideoMetadata;
}
