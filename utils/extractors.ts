
import { Platform } from '../types';

export const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const extractRumbleId = (url: string): string | null => {
  // Rumble URLs often look like: https://rumble.com/v12345-title.html
  const regex = /rumble\.com\/v([a-z0-9]+)-/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const detectPlatform = (url: string): Platform => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return Platform.YOUTUBE;
  if (url.includes('rumble.com')) return Platform.RUMBLE;
  return Platform.UNKNOWN;
};
