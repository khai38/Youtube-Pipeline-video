
import { GoogleGenAI, Type } from "@google/genai";
import type { Scene } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

// Initialize the Google AI client using the API key from environment variables
// to securely automate the process.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const PIXABAY_API_KEY = '52596467-57721889e8b1d5e08b0da484d';

const SCRIPT_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: 'A short, catchy Vietnamese title for the video based on the topic. Should be around 5-10 words.'
        },
        author: {
            type: Type.STRING,
            description: 'The author of the book if the topic is a book summary. Can be an empty string if not applicable.'
        },
        scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_text_vietnamese: {
                  type: Type.STRING,
                  description: 'The Vietnamese text for the voiceover for this scene.',
                },
                image_prompt_english: {
                  type: Type.STRING,
                  description: 'A short English video search query (max 3-5 keywords) to find stock video footage.',
                },
              },
              required: ["scene_text_vietnamese", "image_prompt_english"],
            },
        }
    },
    required: ["title", "author", "scenes"]
};


/**
 * Extracts a JSON object string from a larger text block.
 * Handles markdown code fences and other surrounding text.
 * @param text The raw text from the AI response.
 * @returns A string that should be a JSON object.
 */
const extractJsonObject = (text: string): string => {
    // First, try to extract from markdown code fences
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let potentialJson = text.trim();

    if (markdownMatch && markdownMatch[1]) {
        potentialJson = markdownMatch[1].trim();
    }
    
    // Find the first '{' and the last '}'
    const startIndex = potentialJson.indexOf('{');
    const lastIndex = potentialJson.lastIndexOf('}');
    
    if (startIndex !== -1 && lastIndex > startIndex) {
        return potentialJson.substring(startIndex, lastIndex + 1);
    }
    
    // If no object found, return the potential JSON as is for parsing attempt
    return potentialJson;
}

export const generateScript = async (input: string, mode: 'topic' | 'script' = 'topic'): Promise<{ title: string; author: string; scenes: Omit<Scene, 'id'>[] }> => {
    let rawResponseText = '';
    let prompt = "";
    
    if (mode === 'topic') {
        prompt = `Dựa trên chủ đề hoặc tóm tắt sau, hãy tạo nội dung cho một video. Vui lòng cung cấp: 1. Một tiêu đề video ngắn gọn, hấp dẫn bằng tiếng Việt ('title'). 2. Tên tác giả ('author') nếu chủ đề là tóm tắt sách, nếu không thì để trống. 3. Một kịch bản video sẵn sàng cho TTS bằng tiếng Việt, được chia thành các cảnh ngắn gọn ('scenes'). Hãy điều chỉnh số lượng cảnh (tối thiểu 5) dựa trên độ phức tạp của chủ đề. Đối với mỗi cảnh, hãy cung cấp văn bản tiếng Việt ('scene_text_vietnamese') và một cụm từ tìm kiếm video ngắn gọn bằng tiếng Anh (chỉ dùng từ khóa quan trọng, tối đa 3-5 từ) ('image_prompt_english'). Chủ đề: "${input}". QUAN TRỌNG: Chỉ trả về một đối tượng JSON hợp lệ, không có văn bản nào khác hoặc markdown.`;
    } else {
        prompt = `Dưới đây là nội dung kịch bản thô cho một video. Hãy phân tích và chuyển đổi nó thành định dạng JSON để làm video.
        1. 'title': Trích xuất hoặc tạo tiêu đề phù hợp từ nội dung.
        2. 'author': Tên tác giả nếu có trong văn bản, nếu không thì để trống.
        3. 'scenes': Chia toàn bộ văn bản đầu vào thành các cảnh nhỏ (scenes) để làm video.
           - 'scene_text_vietnamese': Giữ nguyên nội dung gốc của người dùng, chỉ chia nhỏ ra thành các câu/đoạn ngắn phù hợp để hiển thị và đọc.
           - 'image_prompt_english': Tạo câu lệnh tìm kiếm video stock bằng tiếng Anh (từ khóa đơn giản, tối đa 3-5 từ) mô tả nội dung của đoạn văn bản đó.
        
        Nội dung kịch bản: "${input}".
        QUAN TRỌNG: Chỉ trả về một đối tượng JSON hợp lệ, không có văn bản nào khác hoặc markdown.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: SCRIPT_RESPONSE_SCHEMA,
            },
        });

        rawResponseText = response.text;
        const jsonText = extractJsonObject(rawResponseText);
        const parsedScript = JSON.parse(jsonText);

        if (!parsedScript || typeof parsedScript !== 'object' || !Array.isArray(parsedScript.scenes)) {
          throw new Error("AI response is not in the expected object format with a scenes array.");
        }
        
        return parsedScript;

    } catch (error) {
        if (error instanceof SyntaxError) {
             console.error("Failed to parse JSON from AI response:", rawResponseText);
        }
        console.error("Error generating script:", error);
        throw new Error("Failed to generate script from Gemini API.");
    }
};

export const findVideo = async (prompt: string): Promise<{ videoUrl: string, thumbnailUrl: string }> => {
    // The Pixabay API has a 100 character limit for the search query.
    // Truncate the prompt to avoid a "400 Bad Request" error.
    const truncatedPrompt = prompt.substring(0, 99);
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(truncatedPrompt)}&video_type=film&safesearch=true&per_page=5`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Pixabay API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
            const video = data.hits[0];
            const videoFile = video.videos.medium || video.videos.large || video.videos.small;
            
            if (!videoFile) {
                 throw new Error("No suitable video format found.");
            }
            
            return {
                videoUrl: videoFile.url,
                thumbnailUrl: videoFile.thumbnail,
            };
        } else {
            // Fallback: try a broader search if the specific one fails
            // Simple logic: Take the first word (likely the subject) and maybe the last word (likely the context)?
            // Or just the first 2 words.
            const shorterPrompt = prompt.split(' ').slice(0, 2).join(' ');
            if (shorterPrompt && shorterPrompt !== prompt && shorterPrompt.length > 2) {
                const fallbackUrl = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(shorterPrompt)}&video_type=film&safesearch=true&per_page=3`;
                const fallbackResponse = await fetch(fallbackUrl);
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.hits && fallbackData.hits.length > 0) {
                        const video = fallbackData.hits[0];
                        const videoFile = video.videos.medium || video.videos.large || video.videos.small;
                        if (videoFile) {
                            return { videoUrl: videoFile.url, thumbnailUrl: videoFile.thumbnail };
                        }
                    }
                }
            }
            throw new Error("No videos found for the prompt.");
        }
    } catch (error) {
        console.error("Error finding video from Pixabay:", error);
        throw new Error("Failed to find video from Pixabay API.");
    }
};
