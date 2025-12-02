
import React from 'react';

interface CompletionScreenProps {
  videoTitle: string;
  onReset: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ videoTitle, onReset }) => {
  return (
    <div className="text-center p-8 flex flex-col items-center animate-fade-in">
        <div className="bg-green-500/20 text-green-300 rounded-full h-20 w-20 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
      <h2 className="text-2xl font-bold text-slate-100">Tải lên hoàn tất!</h2>
      <p className="mt-2 text-slate-400">Video của bạn "{videoTitle}" đã được mô phỏng tải lên thành công.</p>
      <p className="mt-1 text-xs text-slate-500">(Lưu ý: Đây chỉ là một mô phỏng. Không có video nào được tải lên thực tế.)</p>
      
      <button
        onClick={onReset}
        className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all duration-300"
      >
        Tạo Video mới
      </button>
    </div>
  );
};

export default CompletionScreen;
