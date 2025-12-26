
import React, { useState } from 'react';
import Loader from './Loader';
import { VideoFormat, VideoProvider } from '../types';

interface TopicInputProps {
  onSubmit: (input: string, mode: 'topic' | 'script', format: VideoFormat, provider: VideoProvider) => void;
  isLoading: boolean;
  error: string | null;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, isLoading, error }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'topic' | 'script'>('topic');
  const [format, setFormat] = useState<VideoFormat>('landscape');
  const [provider, setProvider] = useState<VideoProvider>('both');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), mode, format, provider);
    }
  };

  if (isLoading) {
    return <Loader text={mode === 'topic' ? "Research Agent đang phân tích cảm xúc và tạo kịch bản cinematic..." : "AI đang tối ưu hóa kịch bản cho video động lực..."} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
            AI VIDEO RESEARCH AGENT ACTIVE
        </span>
      </div>
      <h2 className="text-2xl font-bold text-center text-slate-100">Kiến tạo Video Động lực & Truyền cảm hứng</h2>
      <p className="mt-2 text-center text-slate-400">Hệ thống sẽ tự động ưu tiên các cảnh quay Cinematic và hùng vĩ.</p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Phương thức</span>
            <div className="bg-slate-900 p-1 rounded-lg flex w-full">
                <button
                    type="button"
                    onClick={() => { setMode('topic'); }}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    mode === 'topic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Từ Chủ đề
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('script'); }}
                    className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    mode === 'script' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Từ Kịch bản
                </button>
            </div>
        </div>

        <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Định dạng Video</span>
            <div className="bg-slate-900 p-1 rounded-lg flex w-full gap-1">
                <button
                    type="button"
                    onClick={() => setFormat('landscape')}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                        format === 'landscape' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 15l5-3-5-3v6z"/></svg>
                    YouTube
                </button>
                <button
                    type="button"
                    onClick={() => setFormat('vertical')}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                        format === 'vertical' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                    TikTok
                </button>
            </div>
        </div>

        <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Nguồn Video Stock</span>
            <div className="bg-slate-900 p-1 rounded-lg flex w-full gap-1">
                <button
                    type="button"
                    onClick={() => setProvider('pixabay')}
                    className={`flex-1 px-2 py-2 rounded-md text-[10px] font-bold transition-all ${
                        provider === 'pixabay' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    PIXABAY
                </button>
                <button
                    type="button"
                    onClick={() => setProvider('pexels')}
                    className={`flex-1 px-2 py-2 rounded-md text-[10px] font-bold transition-all ${
                        provider === 'pexels' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    PEXELS
                </button>
                <button
                    type="button"
                    onClick={() => setProvider('both')}
                    className={`flex-1 px-2 py-2 rounded-md text-[10px] font-bold transition-all ${
                        provider === 'both' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    CẢ HAI
                </button>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
           <label htmlFor="contentInput" className="block text-sm font-medium text-slate-300 mb-2">
            {mode === 'topic' ? 'Chủ đề hoặc Tóm tắt nội dung' : 'Nội dung Kịch bản Chi tiết'}
           </label>
           <textarea
            id="contentInput"
            value={input}
            onChange={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            placeholder={
                mode === 'topic' 
                ? "Ví dụ: Tóm tắt bài học về sự kiên trì từ vĩ nhân..." 
                : "Dán nội dung kịch bản truyền cảm hứng của bạn..."
            }
            className="w-full h-48 p-4 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none text-slate-200 placeholder-slate-500 shadow-inner"
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-md">{error}</p>}
        
        <div className="flex justify-center">
            <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-10 py-4 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed ${
                format === 'landscape' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'
            }`}
            >
             {mode === 'topic' ? 'Khởi tạo hành trình AI' : 'Xử lý & Tìm tài nguyên Cinematic'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TopicInput;
