
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./geminiService";
import type { VoiceOption, VoiceSettings } from "../types";

export const CHIRP_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ trang trọng, sắc nét, âm tầng cao.', sampleRate: '24kHz' },
  { id: 'Puck', name: 'Puck HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam trẻ trung, năng động, nhịp điệu nhanh.', sampleRate: '24kHz' },
  { id: 'Charon', name: 'Charon Studio', gender: 'male', type: 'Studio', description: 'Giọng nam trầm ấm, chiều sâu tốt, phù hợp kể chuyện.', sampleRate: '24kHz' },
  { id: 'Zephyr', name: 'Zephyr Studio', gender: 'female', type: 'Studio', description: 'Giọng nữ nhẹ nhàng, trong trẻo, phù hợp review phim.', sampleRate: '24kHz' },
  { id: 'Fenrir', name: 'Fenrir HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam mạnh mẽ, uy lực, phù hợp tin tức.', sampleRate: '24kHz' },
];

export const VOICE_STYLES = [
  { id: 'inspirational', label: 'Động lực truyền cảm', instruction: 'inspirational and motivational' },
  { id: 'deep', label: 'Trầm ấm, sâu lắng', instruction: 'warm, deep, and reflective' },
  { id: 'expert', label: 'Bình tĩnh, chuyên gia', instruction: 'calm, authoritative, and professional' },
  { id: 'emotional', label: 'Kể chuyện cảm xúc', instruction: 'expressive storytelling with high emotion' },
  { id: 'cinematic', label: 'Cinematic, điện ảnh', instruction: 'epic cinematic style with dramatic pauses' },
  { id: 'casual', label: 'Gần gũi, đời thường', instruction: 'friendly, casual, and conversational' },
  { id: 'strong', label: 'Mạnh mẽ, quyết đoán', instruction: 'powerful and decisive' },
  { id: 'healing', label: 'Nhẹ nhàng, chữa lành', instruction: 'gentle, soothing, and soft' },
];

const PREVIEW_TEXT = "Chào bạn, đây là bản nghe thử giọng đọc cao cấp của tôi trong ứng dụng.";
const audioCache = new Map<string, string>(); 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateChirpAudio = async (text: string, settings: VoiceSettings, retryCount = 0): Promise<string> => {
  // Fix: Use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const speedText = settings.speed > 1.2 ? "nhanh" : settings.speed < 0.8 ? "chậm" : "bình thường";
  const pitchText = settings.pitch > 1.1 ? "cao" : settings.pitch < 0.9 ? "trầm" : "vừa phải";
  
  // Map selected style IDs to their English instructions
  const selectedStyles = settings.styles || [];
  const styleInstructions = VOICE_STYLES
    .filter(s => selectedStyles.includes(s.id))
    .map(s => s.instruction)
    .join(', ');

  const stylePart = styleInstructions ? `Style: ${styleInstructions}. ` : "";
  const formattedPrompt = `(Voice: ${settings.voiceId}, Speed: ${speedText}, Pitch: ${pitchText}. ${stylePart}) Say: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: formattedPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: settings.voiceId },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) throw new Error("Voice generation failed: No audio data returned.");
    return audioBase64;
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('resource_exhausted')) {
      if (retryCount < 5) {
        // More aggressive backoff for quota errors
        const waitTime = Math.pow(2, retryCount) * 3000 + Math.random() * 1000;
        console.warn(`Quota exceeded. Waiting ${Math.round(waitTime/1000)}s...`);
        await delay(waitTime);
        return generateChirpAudio(text, settings, retryCount + 1);
      }
      throw new Error("Hệ thống đang quá tải. Vui lòng quay lại 'Bước 3' và thử 'Tìm Lại' từng cảnh sau ít phút.");
    }
    console.error("TTS Generation error:", error);
    throw error;
  }
};

// Fix: Use any for AudioContext and return type in restricted environment
export const playVoicePreview = async (voiceId: string, audioCtx: any): Promise<any> => {
  let base64 = audioCache.get(voiceId);
  
  if (!base64) {
    const tempSettings: VoiceSettings = { voiceId, speed: 1, pitch: 1, volume: 1, styles: [] };
    base64 = await generateChirpAudio(PREVIEW_TEXT, tempSettings);
    audioCache.set(voiceId, base64);
  }

  const decoded = decodeBase64(base64);
  const buffer = await decodeAudioData(decoded, audioCtx, 24000);
  
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
  return source;
};