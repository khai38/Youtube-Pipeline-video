
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
    return <Loader text={mode === 'topic' ? "AI đang sáng tạo kịch bản, vui lòng chờ..." : "AI đang phân tích kịch bản và tìm video..."} />;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-100">Bắt đầu tạo Video của bạn</h2>
      <p className="mt-2 text-center text-slate-400">Chọn phương thức, định dạng và nguồn video bên dưới.</p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creation Mode Toggle */}
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

        {/* Format Selection Toggle */}
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

        {/* Video Source Selection */}
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
            {mode === 'topic' ? 'Chủ đề hoặc Tóm tắt sách' : 'Nội dung Kịch bản Chi tiết'}
           </label>
           <textarea
            id="contentInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
                mode === 'topic' 
                ? "Ví dụ: Tóm tắt sách 'Đắc Nhân Tâm' của Dale Carnegie..." 
                : "Dán toàn bộ nội dung kịch bản lời bình của bạn vào đây..."
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
             {mode === 'topic' ? 'Bắt đầu Sáng tạo Video' : 'Xử lý Kịch bản & Tìm Video'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TopicInput;
