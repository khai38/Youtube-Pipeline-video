
export type VideoFormat = 'landscape' | 'vertical';
export type VideoProvider = 'pixabay' | 'pexels' | 'both';

export interface Scene {
  id: number;
  character?: string; // Character name or "Narrator"
  scene_text_vietnamese: string;
  image_prompt_english: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  audioData?: string; 
  isGeneratingVideo?: boolean;
  isGeneratingAudio?: boolean;
  videoError?: boolean;
}

export type Step = 'input' | 'voice' | 'images' | 'preview' | 'upload' | 'complete';

export type VoiceType = 'Chirp 3: HD' | 'Studio' | 'Neural';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  type: VoiceType;
  description: string;
  sampleRate: string;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  styles?: string[]; // New: Array of selected emotion styles
}

export interface SavedVideo {
  id: string;
  createdAt: number;
  title: string;
  author: string;
  description: string;
  scenes: Scene[];
  format: VideoFormat;
  musicUrl?: string;
  musicVolume?: number;
  showSubtitles?: boolean;
  characterVoices: Record<string, VoiceSettings>;
}

export interface YouTubeUser {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface VideoDetails {
    title: string;
    author: string;
    description: string;
    privacy: 'public' | 'private';
    musicUrl: string;
    musicVolume: number;
    showSubtitles: boolean;
    showProgressBar: boolean;
}
