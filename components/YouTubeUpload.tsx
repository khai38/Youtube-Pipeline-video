
import React, { useState, useEffect } from 'react';
import type { YouTubeUser } from '../types';

interface VideoDetails {
    title: string;
    description: string;
    privacy: 'public' | 'private';
    musicUrl: string;
    musicVolume: number;
}

interface YouTubeUploadProps {
  videoDetails: VideoDetails;
  setVideoDetails: React.Dispatch<React.SetStateAction<VideoDetails>>;
  onNext: () => void;
  onBack: () => void;
  user: YouTubeUser | null;
  onConnect: (clientId: string) => Promise<void>;
  onDisconnect: () => void;
  onUpload: () => Promise<void>;
  onDownload: () => Promise<void>;
  uploadProgress: number;
  isUploading: boolean;
  isDownloading: boolean;
  uploadError: string | null;
}

const GoogleIcon = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    </svg>
);

const YouTubeUpload: React.FC<YouTubeUploadProps> = ({ 
    videoDetails, 
    setVideoDetails, 
    onNext, 
    onBack, 
    user, 
    onConnect, 
    onDisconnect,
    onUpload,
    onDownload,
    uploadProgress,
    isUploading,
    isDownloading,
    uploadError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
      const storedId = localStorage.getItem('google_client_id');
      if (storedId) setClientId(storedId);
  }, []);

  const handleUpload = async () => {
    await onUpload();
  };
  
  const handleDownloadClick = async () => {
    await onDownload();
  }

  const handleConnectClick = async () => {
      if (!clientId.trim()) {
          // Fix: Access alert via window to bypass missing library error
          (window as any).alert("Vui lòng nhập Google Client ID");
          return;
      }
      localStorage.setItem('google_client_id', clientId);
      setIsConnecting(true);
      try {
        await onConnect(clientId);
      } catch (e) {
          console.error(e);
      } finally {
        setIsConnecting(false);
      }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Fix: Cast e.target to any to access name and value
    const { name, value } = e.target as any;
    setVideoDetails(prev => ({ ...prev, [name]: value }));
  };

  const renderProgressBar = (label: string) => (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-100">{label}</h2>
        <div className="w-full bg-slate-700 rounded-full h-2.5 mt-8">
            <div className="bg-indigo-500 h-2.5 rounded-full relative overflow-hidden" style={{ width: `${uploadProgress}%`, transition: 'width 0.2s linear' }}>
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
            </div>
        </div>
        <p className="mt-4 text-slate-300 font-mono text-lg">{uploadProgress}%</p>
        <p className="mt-2 text-xs text-slate-500">Quá trình này diễn ra theo thời gian thực để đảm bảo chất lượng video.</p>
    </div>
  );

  if (isUploading) {
    return renderProgressBar("Đang xử lý & Tải lên YouTube...");
  }

  if (isDownloading) {
    return renderProgressBar("Đang ghép & Tạo file Video...");
  }

  if (uploadError) {
      return (
           <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div className="bg-red-500/20 text-red-400 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-slate-100">Xảy ra lỗi</h3>
             <p className="mt-2 text-slate-400 max-w-md">{uploadError}</p>
             <button
                onClick={onBack}
                className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
             >
                 Quay lại
             </button>
           </div>
      );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6 mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-100">Xuất bản Video</h2>
            <p className="mt-1 text-slate-400 text-sm">Xem lại thông tin và chọn phương thức xuất bản.</p>
        </div>
        
        {user && (
            <div className="flex items-center gap-3 bg-slate-800 py-2 px-4 rounded-full border border-slate-700">
                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-600" />
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Đăng bởi</span>
                    <span className="text-sm font-semibold text-white">{user.name}</span>
                </div>
                <button onClick={onDisconnect} className="ml-2 text-xs text-red-400 hover:text-red-300 underline">Thoát</button>
            </div>
        )}
      </div>
      
      {/* 1. Form Section - Always Visible */}
      <div className="space-y-6 mb-8">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300">Tiêu đề</label>
          <input
            type="text"
            name="title"
            id="title"
            value={videoDetails.title}
            onChange={handleChange}
            className="mt-1 block w-full bg-slate-900 border border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-200"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300">Mô tả</label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={videoDetails.description}
            onChange={handleChange}
            className="mt-1 block w-full bg-slate-900 border border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-200 resize-none"
          />
        </div>
         <div>
          <label htmlFor="privacy" className="block text-sm font-medium text-slate-300">Quyền riêng tư (YouTube)</label>
          <select
            id="privacy"
            name="privacy"
            value={videoDetails.privacy}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-200"
          >
            <option value="private">Riêng tư</option>
            <option value="public">Công khai</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. YouTube Section */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-red-600/10 rounded-lg">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                 </div>
                 <h3 className="text-lg font-bold text-white">YouTube</h3>
              </div>
              
              <div className="flex-grow">
                 {!user ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">Kết nối tài khoản để đăng video trực tiếp.</p>
                         <div className="w-full">
                            <label className="block text-xs text-slate-400 mb-1">Google Cloud Client ID</label>
                            <input 
                                type="text" 
                                value={clientId}
                                // Fix: Cast e.target to HTMLInputElement
                                onChange={(e) => setClientId((e.target as HTMLInputElement).value)}
                                placeholder="Nhập Client ID..."
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleConnectClick}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center bg-white text-slate-700 hover:bg-slate-100 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm disabled:opacity-70"
                        >
                             {isConnecting ? (
                                 <span className="flex items-center">
                                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     Đang kết nối...
                                 </span>
                             ) : (
                                 <> <GoogleIcon /> Đăng nhập Google </>
                             )}
                        </button>
                    </div>
                 ) : (
                     <div className="space-y-4">
                        <p className="text-sm text-slate-400">Đã sẵn sàng tải lên video của bạn lên kênh <strong>{user.name}</strong>.</p>
                        <button
                            onClick={handleUpload}
                            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            Tải lên YouTube
                        </button>
                     </div>
                 )}
              </div>
          </div>

          {/* 3. Offline Section */}
           <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-bold text-white">Tải xuống (Offline)</h3>
              </div>
              
              <div className="flex-grow space-y-4">
                <p className="text-sm text-slate-400">Tải file video về máy tính hoặc lưu vào lịch sử ứng dụng để xem lại sau.</p>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-200">
                     Hệ thống sẽ ghép các cảnh lại với nhau. Quá trình xử lý có thể mất vài phút.
                     <br/><strong>Lưu ý:</strong> Video tải về sẽ có nhạc nền nhưng chưa có giọng đọc (TTS) do hạn chế của trình duyệt.
                </div>

                <div className="flex flex-col gap-3">
                     <button
                        onClick={handleDownloadClick}
                        disabled={isDownloading}
                        className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600"
                    >
                         {isDownloading ? (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         )}
                        Tải Video (Đầy đủ)
                    </button>
                    
                    <button
                        onClick={onNext}
                         className="w-full px-4 py-2 bg-slate-700 text-slate-200 font-medium rounded-lg hover:bg-slate-600 transition-colors text-sm"
                    >
                        Chỉ lưu & Hoàn tất
                    </button>
                </div>
              </div>
          </div>
      </div>
      
       <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            Quay lại
          </button>
        </div>
    </div>
  );
};

export default YouTubeUpload;