
import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { Scene, Step, SavedVideo, YouTubeUser, VideoFormat, VideoDetails, VoiceSettings, VideoProvider } from './types';
import { generateScript, findVideo } from './services/geminiService';
import { generateChirpAudio } from './services/voiceService';
import { getUserInfo, uploadVideoToYouTube } from './services/youtubeService';
import { renderVideo } from './services/videoRenderer';
import Header from './components/Header';
import TopicInput from './components/TopicInput';
import StepTracker from './components/StepTracker';
import VoiceSelector from './components/VoiceSelector';
import VideoFinder from './components/ImageGenerator';
import VideoPreview from './components/VideoPreview';
import YouTubeUpload from './components/YouTubeUpload';
import CompletionScreen from './components/CompletionScreen';
import Footer from './components/Footer';
import VideoHistory from './components/VideoHistory';

declare var google: any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'create' | 'history'>('create');
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<SavedVideo | null>(null);
  const [youtubeUser, setYoutubeUser] = useState<YouTubeUser | null>(null);

  const [step, setStep] = useState<Step>('input');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('landscape');
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('both');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mapping of character names to their chosen voice settings
  const [characterVoices, setCharacterVoices] = useState<Record<string, VoiceSettings>>({});
  // Track which character we are currently selecting a voice for
  const [currentVoiceStepIndex, setCurrentVoiceStepIndex] = useState(0);

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const renderedBlobRef = useRef<Blob | null>(null);

  const [videoDetails, setVideoDetails] = useState<VideoDetails>({
    title: '', description: '', author: '', privacy: 'private', 
    musicUrl: '', musicVolume: 0.3, showSubtitles: true, showProgressBar: true
  });

  const STEPS: { id: Step; name: string }[] = [
    { id: 'input', name: 'Nội dung' },
    { id: 'voice', name: 'Giọng đọc' },
    { id: 'images', name: 'Xử lý' },
    { id: 'preview', name: 'Xem trước' },
    { id: 'upload', name: 'Xuất Video' },
    { id: 'complete', name: 'Hoàn tất' }
  ];

  // Get unique characters from generated scenes
  const characters = useMemo(() => {
    const set = new Set(scenes.map(s => s.character || 'Narrator'));
    return Array.from(set);
  }, [scenes]);

  const handleTopicSubmit = useCallback(async (input: string, mode: 'topic' | 'script', format: VideoFormat, provider: VideoProvider) => {
    setIsLoading(true);
    setError(null);
    setVideoFormat(format);
    setVideoProvider(provider);
    renderedBlobRef.current = null;
    try {
      const generatedScript = await generateScript(input, mode);
      setScenes(generatedScript.scenes.map((s, i) => ({ ...s, id: i })));
      
      // Initialize voice settings for each character
      const initialVoices: Record<string, VoiceSettings> = {};
      const uniqueChars = Array.from(new Set(generatedScript.scenes.map(s => s.character || 'Narrator')));
      uniqueChars.forEach(char => {
        initialVoices[char] = { voiceId: 'Kore', speed: 1.0, pitch: 1.0, volume: 1.0 };
      });
      setCharacterVoices(initialVoices);
      setCurrentVoiceStepIndex(0);

      setVideoDetails(prev => ({ 
        ...prev, 
        title: generatedScript.title,
        author: generatedScript.author,
        description: `Video tạo bởi AI: ${generatedScript.title}`
      }));
      setStep('voice');
    } catch (err) {
      setError('Lỗi kịch bản. Thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVoiceNext = () => {
    if (currentVoiceStepIndex < characters.length - 1) {
      setCurrentVoiceStepIndex(prev => prev + 1);
    } else {
      setStep('images');
    }
  };

  const handleProcessScene = useCallback(async (sceneId: number, prompt: string, text: string) => {
    // Luôn cập nhật image_prompt_english trong state nếu người dùng thay đổi từ khóa tìm kiếm
    setScenes(prev => prev.map(s => s.id === sceneId ? { 
        ...s, 
        image_prompt_english: prompt,
        isGeneratingVideo: true, 
        isGeneratingAudio: true,
        videoError: false // Reset lỗi khi bắt đầu xử lý lại
    } : s));
    
    try {
        const scene = scenes.find(s => s.id === sceneId);
        const charName = scene?.character || 'Narrator';
        const settings = characterVoices[charName];
        const orientation = videoFormat === 'landscape' ? 'horizontal' : 'vertical';

        const [videoRes, audioRes] = await Promise.all([
            findVideo(prompt, orientation, videoProvider),
            generateChirpAudio(text, settings)
        ]);

        setScenes(prev => prev.map(s => s.id === sceneId ? { 
            ...s, 
            videoUrl: videoRes.videoUrl, 
            videoThumbnailUrl: videoRes.thumbnailUrl, 
            audioData: audioRes,
            isGeneratingVideo: false, 
            isGeneratingAudio: false 
        } : s));
    } catch (err) {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: false, isGeneratingAudio: false, videoError: true } : s));
    }
  }, [scenes, characterVoices, videoFormat, videoProvider]);

  const handleDownload = async () => {
    if (!scenes.length) return;
    setIsDownloading(true);
    setUploadProgress(0);
    try {
        const blob = await renderVideo(
            scenes, videoFormat, videoDetails.musicUrl, videoDetails.musicVolume,
            videoDetails.showSubtitles, videoDetails.showProgressBar, (p) => setUploadProgress(p)
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoDetails.title || 'video'}.mp4`;
        a.click();
        handleUploadComplete();
    } catch (e) {
        setUploadError("Lỗi xuất video.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleUploadComplete = () => {
    const newVideo: SavedVideo = {
        id: Date.now().toString(), createdAt: Date.now(), title: videoDetails.title,
        author: videoDetails.author, description: videoDetails.description, scenes: scenes,
        format: videoFormat, musicUrl: videoDetails.musicUrl, musicVolume: videoDetails.musicVolume,
        showSubtitles: videoDetails.showSubtitles,
        characterVoices: characterVoices
    };
    setSavedVideos(prev => [newVideo, ...prev]);
    setStep('complete');
  };

  const handleReset = () => {
    setStep('input');
    setScenes([]);
    setCharacterVoices({});
    setVideoDetails({ 
        title: '', description: '', author: '', privacy: 'private', 
        musicUrl: '', musicVolume: 0.3, showSubtitles: true, showProgressBar: true
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        {currentView === 'create' ? (
             <div className="w-full max-w-4xl">
                <StepTracker steps={STEPS} currentStep={step} />
                <div className="mt-8 bg-slate-800/50 rounded-xl shadow-2xl p-6 md:p-10 border border-slate-700">
                    {step === 'input' && <TopicInput onSubmit={handleTopicSubmit} isLoading={isLoading} error={error} />}
                    {step === 'voice' && (
                      <VoiceSelector 
                        characterName={characters[currentVoiceStepIndex]} 
                        settings={characterVoices[characters[currentVoiceStepIndex]]} 
                        onSettingsChange={(newSettings) => setCharacterVoices(prev => ({ ...prev, [characters[currentVoiceStepIndex]]: newSettings }))} 
                        onNext={handleVoiceNext} 
                        onBack={() => currentVoiceStepIndex > 0 ? setCurrentVoiceStepIndex(i => i - 1) : setStep('input')} 
                      />
                    )}
                    {step === 'images' && <VideoFinder scenes={scenes} onFindVideo={handleProcessScene} onNext={() => setStep('preview')} />}
                    {step === 'preview' && <VideoPreview scenes={scenes} videoFormat={videoFormat} videoDetails={videoDetails} setVideoDetails={setVideoDetails} onNext={() => setStep('upload')} onBack={() => setStep('images')} />}
                    {step === 'upload' && <YouTubeUpload videoDetails={videoDetails} setVideoDetails={setVideoDetails} onNext={handleUploadComplete} onBack={() => setStep('preview')} user={youtubeUser} onConnect={async () => {}} onDisconnect={() => {}} onUpload={async()=>{}} onDownload={handleDownload} uploadProgress={uploadProgress} isUploading={isUploading} isDownloading={isDownloading} uploadError={uploadError} />}
                    {step === 'complete' && <CompletionScreen videoTitle={videoDetails.title} onReset={handleReset} />}
                </div>
            </div>
        ) : (
            <div className="w-full max-w-6xl">
                 <VideoHistory videos={savedVideos} onSelectVideo={setSelectedHistoryVideo} />
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
