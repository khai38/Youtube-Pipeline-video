
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./geminiService";
import type { VoiceOption, VoiceSettings } from "../types";

export const CHIRP_VOICES: VoiceOption[] = [
  // Premium Vietnamese Chirp3-HD Voices
  { id: 'vi-VN-Chirp3-HD-Achernar', name: 'Achernar HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, sắc nét và chuyên nghiệp.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Achird', name: 'Achird HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, trầm ấm, độ chi tiết cao.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Algenib', name: 'Algenib HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, năng động và hiện đại.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Algieba', name: 'Algieba HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, uy lực và quyết đoán.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Alnilam', name: 'Alnilam HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, điềm tĩnh và tin cậy.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Aoede', name: 'Aoede HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, nhẹ nhàng và truyền cảm.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Autonoe', name: 'Autonoe HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, trong trẻo và thanh thoát.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Callirrhoe', name: 'Callirrhoe HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, sâu lắng và tinh tế.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Charon', name: 'Charon HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, lý tưởng cho kể chuyện Studio.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Despina', name: 'Despina HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, trẻ trung và linh hoạt.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Enceladus', name: 'Enceladus HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, mạnh mẽ và vang dội.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Erinome', name: 'Erinome HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, ấm áp và gần gũi.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Fenrir', name: 'Fenrir HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, sắc sảo và hiện đại.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Gacrux', name: 'Gacrux HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, sang trọng và quý phái.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Iapetus', name: 'Iapetus HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, trầm mặc và sâu sắc.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Kore', name: 'Kore HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium phổ biến, cân bằng tuyệt vời.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Laomedeia', name: 'Laomedeia HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, dịu dàng và êm ái.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Leda', name: 'Leda HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, mượt mà và tự nhiên.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Orus', name: 'Orus HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, trung tính và rõ ràng.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Puck', name: 'Puck HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, năng động, nhịp điệu nhanh.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Pulcherrima', name: 'Pulcherrima HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, lôi cuốn và đầy năng lượng.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Rasalgethi', name: 'Rasalgethi HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, nghiêm túc và chuyên gia.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Sadachbia', name: 'Sadachbia HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, ổn định và mạch lạc.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Sadaltager', name: 'Sadaltager HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, nam tính và ấm nồng.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Schedar', name: 'Schedar HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, truyền thống và vững chãi.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Sulafat', name: 'Sulafat HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, tinh khiết và rõ nét.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Umbriel', name: 'Umbriel HD', gender: 'male', type: 'Chirp 3: HD', description: 'Giọng nam Premium, huyền bí và cuốn hút.', sampleRate: '24kHz' },
  { id: 'vi-VN-Chirp3-HD-Vindemiatrix', name: 'Vindemiatrix HD', gender: 'female', type: 'Chirp 3: HD', description: 'Giọng nữ Premium, tự tin và hiện đại.', sampleRate: '24kHz' },
  
  // Studio Voices (Legacy/Alternative)
  { id: 'Zephyr', name: 'Zephyr Studio', gender: 'female', type: 'Studio', description: 'Giọng nữ nhẹ nhàng, trong trẻo, phù hợp review phim.', sampleRate: '24kHz' },
];

export const VOICE_STYLES = [
  // New "Real-Mic" Styles
  { id: 'studio_mic', label: 'Studio Micro (Pro)', instruction: 'professional studio voice-over recorded with a condenser microphone, clear natural human cadence, subtle audible breathing, rich mid-range tones' },
  { id: 'podcast_close', label: 'Podcast (Thân mật)', instruction: 'close-mic podcast style, intimate and warm, very natural conversational tone with soft pauses and realistic human breath work' },
  { id: 'home_raw', label: 'Giọng Mộc (Home Mic)', instruction: 'authentic home recording style using a USB microphone, slightly less processed, organic room presence, very honest and non-robotic' },
  { id: 'cinematic_mic', label: 'Truyền Lửa (Cinematic)', instruction: 'epic cinematic narration recorded through a high-end studio mic, slow dramatic pace, deep emotional resonance, clear intentional breaths' },
  
  // Existing Styles
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const speedText = settings.speed > 1.2 ? "nhanh" : settings.speed < 0.8 ? "chậm" : "bình thường";
  const pitchText = settings.pitch > 1.1 ? "cao" : settings.pitch < 0.9 ? "trầm" : "vừa phải";
  
  const selectedStyles = settings.styles || [];
  const styleInstructions = VOICE_STYLES
    .filter(s => selectedStyles.includes(s.id))
    .map(s => s.instruction)
    .join(', ');

  const stylePart = styleInstructions ? `Style: ${styleInstructions}. ` : "";
  const formattedPrompt = `(Voice: ${settings.voiceId}, Speed: ${speedText}, Pitch: ${pitchText}. ${stylePart}) Say strictly in Vietnamese: ${text}`;

  // Fix: Extract lowercase voice name as required by the API
  const apiVoiceName = settings.voiceId.includes('-') 
    ? settings.voiceId.split('-').pop()?.toLowerCase() 
    : settings.voiceId.toLowerCase();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: formattedPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: apiVoiceName },
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
