
import React, { useState, useCallback, useRef } from 'react';
import type { Scene, Step, SavedVideo, YouTubeUser } from './types';
import { generateScript, findVideo } from './services/geminiService';
import { getUserInfo, uploadVideoToYouTube } from './services/youtubeService';
import { renderVideo } from './services/videoRenderer';
import Header from './components/Header';
import TopicInput from './components/TopicInput';
import StepTracker from './components/StepTracker';
import VideoFinder from './components/ImageGenerator';
import VideoPreview from './components/VideoPreview';
import YouTubeUpload from './components/YouTubeUpload';
import CompletionScreen from './components/CompletionScreen';
import Footer from './components/Footer';
import VideoHistory from './components/VideoHistory';

// Declare Google Identity Services types
declare var google: any;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'create' | 'history'>('create');
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<SavedVideo | null>(null);
  const [youtubeUser, setYoutubeUser] = useState<YouTubeUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('input');
  const [topic, setTopic] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Cache the rendered video blob to avoid re-rendering
  const renderedBlobRef = useRef<Blob | null>(null);

  const [videoDetails, setVideoDetails] = useState({
    title: '',
    description: '',
    author: '',
    privacy: 'private' as 'public' | 'private',
    musicUrl: '',
    musicVolume: 0.2,
  });

  const STEPS: { id: Step; name: string }[] = [
    { id: 'input', name: 'Nội dung' },
    { id: 'images', name: 'Tìm Video' },
    { id: 'preview', name: 'Xem trước' },
    { id: 'upload', name: 'Xuất Video' },
    { id: 'complete', name: 'Hoàn tất' }
  ];


  const handleTopicSubmit = useCallback(async (input: string, mode: 'topic' | 'script') => {
    setIsLoading(true);
    setError(null);
    setTopic(input);
    // Reset cached blob when new topic starts
    renderedBlobRef.current = null;
    try {
      const generatedScript = await generateScript(input, mode);
      setScenes(generatedScript.scenes.map((s, i) => ({ ...s, id: i })));
      setVideoDetails(prev => ({ 
        ...prev, 
        title: generatedScript.title,
        author: generatedScript.author,
        description: `Video được tạo bởi AI về "${generatedScript.title}". ${generatedScript.author ? `Dựa trên tác phẩm của ${generatedScript.author}.` : ''}`
      }));
      setStep('images');
    } catch (err) {
      setError('Không thể tạo kịch bản. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFindVideo = useCallback(async (sceneId: number, prompt: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: true, videoError: false } : s));
    try {
      const { videoUrl, thumbnailUrl } = await findVideo(prompt);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl, videoThumbnailUrl: thumbnailUrl, isGeneratingVideo: false } : s));
    } catch (err) {
      setError(`Không thể tìm video cho cảnh ${sceneId + 1}.`);
      console.error(err);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: false, videoError: true } : s));
    }
  }, []);

  const handleConnectYoutube = async (clientId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setAccessToken(tokenResponse.access_token);
              try {
                const userInfo = await getUserInfo(tokenResponse.access_token);
                setYoutubeUser(userInfo);
                resolve();
              } catch (e) {
                console.error("Failed to get user info", e);
                reject(e);
              }
            } else {
              reject(new Error("No access token received"));
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        console.error("Google Auth Error", err);
        reject(err);
      }
    });
  };

  const getOrRenderVideoBlob = async (onProgress: (p: number) => void): Promise<Blob> => {
    if (renderedBlobRef.current) {
        onProgress(100);
        return renderedBlobRef.current;
    }
    
    const blob = await renderVideo(
        scenes, 
        videoDetails.musicUrl, 
        videoDetails.musicVolume,
        onProgress
    );
    renderedBlobRef.current = blob;
    return blob;
  };

  const handleRealUpload = async () => {
    if (!accessToken) {
      setUploadError("Missing access token.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Render the full video
      // Use 0-50% for rendering phase
      const blob = await getOrRenderVideoBlob((p) => setUploadProgress(Math.floor(p / 2)));
      
      setUploadProgress(50); // Rendering done

      // 2. Upload to YouTube
      // Use 50-100% for upload phase
      await uploadVideoToYouTube(
        accessToken, 
        blob, 
        {
          title: videoDetails.title,
          description: videoDetails.description,
          privacy: videoDetails.privacy
        },
        (progress) => setUploadProgress(50 + Math.floor(progress / 2))
      );

      // 3. Save to history and Finish
      handleUploadComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!scenes.length) {
        setUploadError("No video data available to download.");
        return;
    }

    setIsDownloading(true);
    setUploadProgress(0); // Use uploadProgress for rendering progress too
    try {
        const blob = await getOrRenderVideoBlob((p) => setUploadProgress(p));
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Sanitize filename
        const safeTitle = videoDetails.title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '-').toLowerCase();
        // Detect extension based on blob type
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        a.download = `${safeTitle || 'video'}.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Save to history and finish
        handleUploadComplete();
    } catch (e) {
        console.error("Download failed", e);
        setUploadError("Không thể xử lý video. Vui lòng thử lại.");
    } finally {
        setIsDownloading(false);
        setUploadProgress(0);
    }
  };

  const handleDisconnectYoutube = () => {
    setYoutubeUser(null);
    setAccessToken(null);
    if (google && google.accounts && google.accounts.oauth2) {
       google.accounts.oauth2.revoke(accessToken, () => {console.log('Token revoked')});
    }
  }


  const handleReset = () => {
    setStep('input');
    setTopic('');
    setScenes([]);
    setError(null);
    setUploadError(null);
    renderedBlobRef.current = null;
    setVideoDetails({ 
        title: '', 
        description: '', 
        author: '', 
        privacy: 'private', 
        musicUrl: '', 
        musicVolume: 0.2 
    });
  };

  const handleUploadComplete = () => {
    // Save to history
    const newVideo: SavedVideo = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: videoDetails.title,
        author: videoDetails.author,
        description: videoDetails.description,
        scenes: scenes,
        musicUrl: videoDetails.musicUrl,
        musicVolume: videoDetails.musicVolume
    };
    setSavedVideos(prev => [newVideo, ...prev]);
    setStep('complete');
  };

  const handleViewChange = (view: 'create' | 'history') => {
      setCurrentView(view);
      setSelectedHistoryVideo(null);
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'input':
        return <TopicInput onSubmit={handleTopicSubmit} isLoading={isLoading} error={error} />;
      case 'images':
        return <VideoFinder scenes={scenes} onFindVideo={handleFindVideo} onNext={() => setStep('preview')} />;
      case 'preview':
        return <VideoPreview 
            scenes={scenes} 
            videoDetails={videoDetails} 
            setVideoDetails={setVideoDetails}
            onNext={() => setStep('upload')} 
            onBack={() => setStep('images')} 
        />;
      case 'upload':
        return (
            <YouTubeUpload 
                videoDetails={videoDetails} 
                setVideoDetails={setVideoDetails} 
                onNext={handleUploadComplete} 
                onBack={() => setStep('preview')}
                user={youtubeUser}
                onConnect={handleConnectYoutube}
                onDisconnect={handleDisconnectYoutube}
                onUpload={handleRealUpload}
                onDownload={handleDownload}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                isDownloading={isDownloading}
                uploadError={uploadError}
            />
        );
      case 'complete':
        return <CompletionScreen videoTitle={videoDetails.title} onReset={handleReset} />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        
        {currentView === 'create' ? (
             <div className="w-full max-w-4xl">
                <StepTracker steps={STEPS} currentStep={step} />
                <div className="mt-8 bg-slate-800/50 rounded-xl shadow-2xl p-6 md:p-10 border border-slate-700">
                    {renderCurrentStep()}
                </div>
            </div>
        ) : (
            <div className="w-full max-w-6xl">
                <div className="bg-slate-800/50 rounded-xl shadow-2xl p-6 md:p-10 border border-slate-700">
                    {selectedHistoryVideo ? (
                        <VideoPreview 
                            readOnly
                            scenes={selectedHistoryVideo.scenes} 
                            videoDetails={{
                                title: selectedHistoryVideo.title, 
                                author: selectedHistoryVideo.author,
                                description: selectedHistoryVideo.description,
                                privacy: 'private',
                                musicUrl: selectedHistoryVideo.musicUrl || '',
                                musicVolume: selectedHistoryVideo.musicVolume || 0.2
                            }}
                            setVideoDetails={() => {}} 
                            onBack={() => setSelectedHistoryVideo(null)} 
                        />
                    ) : (
                        <VideoHistory videos={savedVideos} onSelectVideo={setSelectedHistoryVideo} />
                    )}
                </div>
            </div>
        )}
       
      </main>
      <Footer />
    </div>
  );
};

export default App;
