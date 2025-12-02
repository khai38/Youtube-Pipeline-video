
import React from 'react';
import type { SavedVideo } from '../types';

interface VideoHistoryProps {
  videos: SavedVideo[];
  onSelectVideo: (video: SavedVideo) => void;
}

const VideoHistory: React.FC<VideoHistoryProps> = ({ videos, onSelectVideo }) => {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a1.5 1.5 0 01.45 2.12l-3.5 6A1.5 1.5 0 0115 19H4a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 014 4.5h5.5a1.5 1.5 0 011.06.44L15 10z" />
        </svg>
        <p className="text-xl text-slate-400">Chưa có video nào được tạo.</p>
        <p className="text-sm text-slate-500 mt-2">Hãy tạo video đầu tiên của bạn!</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-100 mb-8">Video đã tạo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {videos.map(video => (
         <div 
            key={video.id} 
            className="group bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 cursor-pointer hover:border-indigo-500 hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1" 
            onClick={() => onSelectVideo(video)}
         >
            <div className="h-40 bg-black relative overflow-hidden">
               {video.scenes[0]?.videoThumbnailUrl ? (
                 <img src={video.scenes[0].videoThumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                    No Preview
                 </div>
               )}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[1px]">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
               </div>
               <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-mono">
                  {video.scenes.length} cảnh
               </div>
            </div>
            <div className="p-4">
               <div className="flex justify-between items-start mb-1">
                   <h3 className="font-bold text-lg text-slate-100 truncate flex-1 pr-2" title={video.title}>{video.title}</h3>
               </div>
               <p className="text-xs text-slate-400 mb-3">{new Date(video.createdAt).toLocaleString('vi-VN')}</p>
               <p className="text-sm text-slate-300 line-clamp-2 h-10">{video.description}</p>
            </div>
         </div>
       ))}
      </div>
    </div>
  )
}

export default VideoHistory;
