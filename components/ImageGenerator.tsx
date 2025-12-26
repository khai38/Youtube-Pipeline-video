
import React, { useEffect, useState } from 'react';
import type { Scene } from '../types';

interface VideoFinderProps {
  scenes: Scene[];
  onFindVideo: (sceneId: number, prompt: string, text: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SceneCard: React.FC<{ 
  scene: Scene; 
  onRetry: (newPrompt: string) => void 
}> = ({ scene, onRetry }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(scene.image_prompt_english);
  
  const isProcessing = scene.isGeneratingVideo || scene.isGeneratingAudio;
  const isDone = scene.videoUrl && scene.audioData;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    onRetry(tempPrompt);
  };

  return (
    <div className={`bg-slate-900/70 border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start transition-all duration-300 ${
      scene.videoError ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700'
    }`}>
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">Cảnh {scene.id + 1}</p>
            {isDone && !isProcessing && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Sẵn sàng
                </span>
            )}
        </div>
        
        <p className="text-slate-300 text-sm mb-4 leading-relaxed">{scene.scene_text_vietnamese}</p>
        
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Từ khóa tìm kiếm (English)</label>
            {isEditing || scene.videoError ? (
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text"
                        value={tempPrompt}
                        onChange={(e) => setTempPrompt((e.target as HTMLInputElement).value)}
                        placeholder="Nhập từ khóa tìm kiếm video..."
                        className="flex-grow bg-slate-900 border border-indigo-500/50 rounded px-2 py-1 text-xs text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors"
                    >
                        TÌM LẠI
                    </button>
                    {scene.videoError && (
                        <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold px-3 py-1 rounded"
                        >
                            HỦY
                        </button>
                    )}
                </form>
            ) : (
                <div className="flex items-center justify-between group">
                    <p className="text-xs text-slate-400 italic">"{scene.image_prompt_english}"</p>
                    {!isProcessing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            )}
        </div>

        {scene.videoError && !isEditing && (
            <div className="mt-3 flex items-center gap-2 text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-xs font-medium">Không tìm thấy video phù hợp. Hãy thử thay đổi từ khóa!</p>
            </div>
        )}
      </div>

      <div className="w-full md:w-64 h-36 flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 relative border border-slate-700 group shadow-inner">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Đang tải...</span>
          </div>
        ) : scene.videoThumbnailUrl ? (
          <>
            <img src={scene.videoThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                 </button>
            </div>
            {scene.audioData && (
                <div className="absolute top-2 right-2 bg-indigo-600 p-1.5 rounded-full shadow-lg border border-indigo-400/50">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>
            )}
          </>
        ) : scene.videoError ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
             <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
             </div>
             <button onClick={() => setIsEditing(true)} className="text-red-400 text-[10px] font-black uppercase underline hover:text-red-300">Thay đổi từ khóa</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
             <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-600 animate-spin-slow"></div>
             <span className="text-[10px] text-slate-500 uppercase font-black">Đợi hàng chờ</span>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoFinder: React.FC<VideoFinderProps> = ({ scenes, onFindVideo, onNext, onBack }) => {
  const allReady = scenes.every(s => !!s.videoUrl && !!s.audioData);

  useEffect(() => {
    const isProcessing = scenes.some(s => s.isGeneratingVideo || s.isGeneratingAudio);
    if (isProcessing) return;

    // Tìm scene đầu tiên chưa có video/audio và không đang bị lỗi
    const next = scenes.find(s => (!s.videoUrl || !s.audioData) && !s.videoError);
    if (next) {
      const timer = setTimeout(() => {
        onFindVideo(next.id, next.image_prompt_english, next.scene_text_vietnamese);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scenes, onFindVideo]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-100">Tìm kiếm Tài nguyên</h2>
            <p className="mt-1 text-slate-400 text-sm">AI đang chuẩn bị hình ảnh/video và giọng đọc HD cho kịch bản của bạn.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
            <span className="text-xs font-bold text-slate-300">
                {scenes.filter(s => s.videoUrl && s.audioData).length} / {scenes.length} hoàn tất
            </span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {scenes.map(scene => (
          <SceneCard 
            key={scene.id} 
            scene={scene} 
            onRetry={(newPrompt) => onFindVideo(scene.id, newPrompt, scene.scene_text_vietnamese)} 
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        {!allReady && (
            <p className="text-xs text-slate-500 italic">Vui lòng đợi hoặc chỉnh sửa các cảnh bị lỗi để tiếp tục...</p>
        )}
        <div className="flex gap-4">
            <button 
                onClick={onBack}
                className="px-8 py-4 bg-slate-800 text-slate-300 font-black uppercase tracking-widest rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Quay lại chọn giọng
            </button>
            <button 
                onClick={onNext} 
                disabled={!allReady} 
                className="px-12 py-4 bg-indigo-600 disabled:bg-slate-700 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
            >
            Xác nhận & Xem trước
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default VideoFinder;
