
import React, { useEffect } from 'react';
import type { Scene } from '../types';

interface VideoFinderProps {
  scenes: Scene[];
  onFindVideo: (sceneId: number, prompt: string) => void;
  onNext: () => void;
}

const SceneCard: React.FC<{ scene: Scene; onRetry: () => void }> = ({ scene, onRetry }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start">
      <div className="flex-1">
        <p className="text-sm font-semibold text-indigo-400 mb-1">Cảnh {scene.id + 1}</p>
        <p className="text-slate-300">{scene.scene_text_vietnamese}</p>
      </div>
      <div className="w-full md:w-64 h-36 flex items-center justify-center bg-slate-800 rounded-md overflow-hidden flex-shrink-0">
        {scene.isGeneratingVideo ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs text-slate-400">Đang tìm...</span>
          </div>
        ) : scene.videoThumbnailUrl ? (
          <img src={scene.videoThumbnailUrl} alt={`Thumbnail for scene ${scene.id + 1}`} className="w-full h-full object-cover" />
        ) : scene.videoError ? (
          <div className="text-center p-2">
            <p className="text-red-400 text-sm mb-2">Tìm video thất bại</p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-slate-700 text-sm text-slate-200 font-semibold rounded-md hover:bg-slate-600 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
           <div className="flex flex-col items-center gap-2">
            <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1.5 1.5 0 01.45 2.12l-3.5 6A1.5 1.5 0 0115 19H4a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 014 4.5h5.5a1.5 1.5 0 011.06.44L15 10z" />
            </svg>
            <span className="text-xs text-slate-400">Đang đợi...</span>
          </div>
        )}
      </div>
    </div>
  );
};


const VideoFinder: React.FC<VideoFinderProps> = ({ scenes, onFindVideo, onNext }) => {
  const allVideosFound = scenes.every(s => !!s.videoUrl);
  
  // Pixabay has a generous rate limit, but a small delay is good practice.
  const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

  useEffect(() => {
    const isGenerating = scenes.some(scene => scene.isGeneratingVideo);
    if (isGenerating) {
      return;
    }

    const nextSceneToProcess = scenes.find(
      scene => !scene.videoUrl && !scene.videoError
    );

    if (nextSceneToProcess) {
      const timer = setTimeout(() => {
        onFindVideo(nextSceneToProcess.id, nextSceneToProcess.image_prompt_english);
      }, DELAY_BETWEEN_REQUESTS);
      
      return () => clearTimeout(timer);
    }
  }, [scenes, onFindVideo]);


  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-100">Tìm video cho mỗi cảnh</h2>
      <p className="mt-2 text-center text-slate-400">AI đang tự động tìm video phù hợp cho mỗi cảnh. Vui lòng chờ...</p>
      
      <div className="mt-8 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {scenes.map(scene => (
          <SceneCard 
            key={scene.id} 
            scene={scene} 
            onRetry={() => onFindVideo(scene.id, scene.image_prompt_english)} 
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onNext}
          disabled={!allVideosFound}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default VideoFinder;
