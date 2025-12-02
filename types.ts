
export interface Scene {
  id: number;
  scene_text_vietnamese: string;
  image_prompt_english: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  isGeneratingVideo?: boolean;
  videoError?: boolean;
}

export type Step = 'input' | 'images' | 'preview' | 'upload' | 'complete';

export interface SavedVideo {
  id: string;
  createdAt: number;
  title: string;
  author: string;
  description: string;
  scenes: Scene[];
  musicUrl?: string;
  musicVolume?: number;
}

export interface YouTubeUser {
  name: string;
  email: string;
  avatarUrl: string;
}
