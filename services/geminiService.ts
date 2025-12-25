
import { GoogleGenAI, Type } from "@google/genai";
import type { Scene, VideoProvider } from '../types';

const PIXABAY_API_KEY = '52596467-57721889e8b1d5e08b0da484d';
const PEXELS_API_KEY = 'jymggzkZE6Ca05J27cPhmDzXY0uAdL9V4ShhgyxCNKFhEJVp9tseOgZf';

const SCRIPT_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        author: { type: Type.STRING },
        scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                character: { type: Type.STRING },
                scene_text_vietnamese: { type: Type.STRING },
                image_prompt_english: { type: Type.STRING },
              },
              required: ["character", "scene_text_vietnamese", "image_prompt_english"],
            },
        }
    },
    required: ["title", "author", "scenes"]
};

export const generateScript = async (input: string, mode: 'topic' | 'script' = 'topic'): Promise<{ title: string; author: string; scenes: Omit<Scene, 'id'>[] }> => {
    // Fix: Use process.env.API_KEY directly for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    let prompt = "";
    if (mode === 'topic') {
        prompt = `Dựa trên chủ đề sau, tạo kịch bản video tiếng Việt. Phân chia rõ ràng AI/Người kể chuyện hoặc Nhân vật đối thoại nếu có. 
        Trả về JSON: title, author, scenes (character, scene_text_vietnamese, image_prompt_english). Chủ đề: "${input}"`;
    } else {
        prompt = `Chuyển kịch bản sau sang JSON chuyên nghiệp. Phân loại người nói vào trường 'character'.
        Nội dung: "${input}"`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: SCRIPT_RESPONSE_SCHEMA,
            },
        });

        if (!response.text) {
            throw new Error("Empty response from Gemini API");
        }

        return JSON.parse(response.text);
    } catch (error: any) {
        console.error("Script generation error:", error);
        throw error;
    }
};

const findVideoFromPixabay = async (prompt: string, orientation: 'horizontal' | 'vertical') => {
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(prompt.substring(0, 90))}&video_type=film&orientation=${orientation}&safesearch=true&per_page=3`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
        const v = data.hits[0];
        return { 
            videoUrl: v.videos.medium.url, 
            thumbnailUrl: v.videos.medium.thumbnail,
            quality: 'medium'
        };
    }
    return null;
};

const findVideoFromPexels = async (prompt: string, orientation: 'horizontal' | 'vertical') => {
    const pexelsOrientation = orientation === 'horizontal' ? 'landscape' : 'portrait';
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(prompt.substring(0, 90))}&per_page=3&orientation=${pexelsOrientation}&size=medium`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': PEXELS_API_KEY
        }
    });
    
    const data = await response.json();
    if (data.videos && data.videos.length > 0) {
        const v = data.videos[0];
        // Find a suitable medium file, usually indexed 0 or filtered by quality
        const videoFile = v.video_files.find((f: any) => f.quality === 'hd') || v.video_files[0];
        return {
            videoUrl: videoFile.link,
            thumbnailUrl: v.image,
            quality: videoFile.quality
        };
    }
    return null;
};

export const findVideo = async (
    prompt: string, 
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    provider: VideoProvider = 'both'
): Promise<{ videoUrl: string, thumbnailUrl: string }> => {
    
    const tasks: Promise<any>[] = [];
    
    if (provider === 'pixabay' || provider === 'both') {
        tasks.push(findVideoFromPixabay(prompt, orientation).catch(() => null));
    }
    if (provider === 'pexels' || provider === 'both') {
        tasks.push(findVideoFromPexels(prompt, orientation).catch(() => null));
    }

    const results = await Promise.all(tasks);
    const validResults = results.filter(r => r !== null);

    if (validResults.length === 0) {
        throw new Error("No video found for prompt: " + prompt);
    }

    // Sort by quality preference (hd > medium) or just take the first if both same
    validResults.sort((a, b) => {
        if (a.quality === 'hd' && b.quality !== 'hd') return -1;
        if (a.quality !== 'hd' && b.quality === 'hd') return 1;
        return 0;
    });

    return { 
        videoUrl: validResults[0].videoUrl, 
        thumbnailUrl: validResults[0].thumbnailUrl 
    };
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix: Use any for missing AudioContext and AudioBuffer types in restricted environment
export async function decodeAudioData(
  data: Uint8Array,
  ctx: any,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<any> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}