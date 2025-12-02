
import React, { useState } from 'react';
import Loader from './Loader';

interface TopicInputProps {
  onSubmit: (input: string, mode: 'topic' | 'script') => void;
  isLoading: boolean;
  error: string | null;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, isLoading, error }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'topic' | 'script'>('topic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim(), mode);
    }
  };

  if (isLoading) {
    return <Loader text={mode === 'topic' ? "AI đang sáng tạo kịch bản, vui lòng chờ..." : "AI đang phân tích kịch bản và tìm video..."} />;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-100">Bắt đầu tạo Video của bạn</h2>
      <p className="mt-2 text-center text-slate-400">Chọn phương thức tạo video bên dưới.</p>
      
      <div className="mt-6 flex justify-center">
        <div className="bg-slate-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => { setMode('topic'); setInput(''); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'topic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Từ Chủ đề
          </button>
          <button
            onClick={() => { setMode('script'); setInput(''); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'script' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Từ Kịch bản có sẵn
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
            className="w-full h-48 p-4 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none text-slate-200 placeholder-slate-500"
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        
        <div className="flex justify-center">
            <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
             {mode === 'topic' ? 'Tạo Kịch bản & Video' : 'Phân tích & Tìm Video'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TopicInput;
