
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Scene } from '../types';
import SoundWave from './SoundWave';

interface VideoDetails {
    title: string;
    author: string;
    description: string;
    privacy: 'public' | 'private';
    musicUrl: string;
    musicVolume: number;
}

interface VideoPreviewProps {
  scenes: Scene[];
  videoDetails: VideoDetails;
  setVideoDetails: React.Dispatch<React.SetStateAction<VideoDetails>>;
  onNext?: () => void;
  onBack: () => void;
  readOnly?: boolean;
}

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const PrevIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>;
const NextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16 6h2v12h-2zm-4.5 6L6 6v12z" /></svg>;

const VOICE_STYLES = [
  { name: 'Mặc định', rate: 0.9, pitch: 1.0 },
  { name: 'Chậm và Rõ ràng', rate: 0.75, pitch: 1.0 },
  { name: 'Nhanh và Năng động', rate: 1.1, pitch: 1.1 },
  { name: 'Trầm và Ấm áp', rate: 0.8, pitch: 0.8 },
  { name: 'Cao và Trong trẻo', rate: 1.0, pitch: 1.3 },
];

const MUSIC_TRACKS = [
    { name: 'Không sử dụng', url: '' },
    { name: 'Hứng khởi (Happy)', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { name: 'Thư giãn (Chill)', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_8b45610816.mp3' },
    { name: 'Kịch tính (Cinematic)', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3' },
    { name: 'Doanh nghiệp (Corporate)', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc584613c7.mp3' },
];

const VideoPreview: React.FC<VideoPreviewProps> = ({ scenes, videoDetails, setVideoDetails, onNext, onBack, readOnly = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [rate, setRate] = useState(VOICE_STYLES[0].rate);
  const [pitch, setPitch] = useState(VOICE_STYLES[0].pitch);

  const playNextSceneRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const getVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const viVoices = voices.filter(v => v.lang.startsWith('vi'));
      setAvailableVoices(viVoices);
      
      setSelectedVoice(current => {
          if (!current && viVoices.length > 0) {
              return viVoices[0];
          }
          return current;
      });
    };
    
    window.speechSynthesis.onvoiceschanged = getVoices;
    getVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    videoRef.current?.pause();
    if (audioRef.current) {
        audioRef.current.pause();
    }
  }, []);

  const changeScene = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < scenes.length && newIndex !== currentSceneIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSceneIndex(newIndex);
        setIsTransitioning(false);
      }, 300);
    } else if (newIndex >= scenes.length) {
      stopPlayback(); // Stop everything when done
    }
  }, [scenes.length, currentSceneIndex, stopPlayback]);

  const handleAutoPlayNextScene = useCallback(() => {
      changeScene(currentSceneIndex + 1);
  }, [changeScene, currentSceneIndex]);
  
  playNextSceneRef.current = handleAutoPlayNextScene;

  // Effect to handle audio play/pause
  useEffect(() => {
      if (audioRef.current && videoDetails.musicUrl) {
          audioRef.current.volume = videoDetails.musicVolume;
          if (isPlaying) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(error => console.log("Audio play prevented:", error));
              }
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying, videoDetails.musicUrl, videoDetails.musicVolume]);

  useEffect(() => {
    if (isPlaying && scenes[currentSceneIndex] && !isTransitioning) {
      videoRef.current?.play().catch(e => console.error("Video play failed:", e));

      const utterance = new SpeechSynthesisUtterance(scenes[currentSceneIndex].scene_text_vietnamese);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onend = () => {
        playNextSceneRef.current?.();
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying, currentSceneIndex, scenes, selectedVoice, isTransitioning, rate, pitch]);

  
  const handlePlayToggle = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
       if (window.speechSynthesis.getVoices().length === 0) {
        alert("Trình duyệt của bạn đang tải giọng nói. Vui lòng thử lại sau giây lát.");
        return;
      }
      if (availableVoices.length === 0) {
        console.warn("Không tìm thấy giọng nói tiếng Việt trên trình duyệt của bạn để phát âm thanh. Bản xem trước sẽ không có tiếng hoặc sử dụng giọng mặc định.");
      }

      if (currentSceneIndex === scenes.length - 1 && !window.speechSynthesis.speaking) {
        changeScene(0);
        if (audioRef.current) audioRef.current.currentTime = 0; // Restart music
      }
      setIsPlaying(true);
    }
  };

  const handleManualSceneChange = (direction: 'next' | 'prev') => {
    stopPlayback();
    if (direction === 'next') {
        changeScene(currentSceneIndex + 1);
    } else {
        changeScene(currentSceneIndex - 1);
    }
  }

  const handleBack = () => {
    stopPlayback();
    onBack();
  };
  
  const handleNext = () => {
    stopPlayback();
    if (onNext) onNext();
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    stopPlayback();
    const voice = availableVoices.find(v => v.name === e.target.value);
    setSelectedVoice(voice || null);
  }

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    stopPlayback();
    const styleName = e.target.value;
    const style = VOICE_STYLES.find(s => s.name === styleName);
    if (style) {
      setRate(style.rate);
      setPitch(style.pitch);
    }
  };

  const currentScene = scenes[currentSceneIndex];
  const progress = ((currentSceneIndex + 1) / scenes.length) * 100;
  
  const currentStyleName = VOICE_STYLES.find(s => s.rate === rate && s.pitch === pitch)?.name || 'Tùy chỉnh';
  const styleOptions = [...VOICE_STYLES];
  if (currentStyleName === 'Tùy chỉnh') {
      styleOptions.push({ name: 'Tùy chỉnh', rate, pitch });
  }

  return (
    <div className="animate-fade-in flex flex-col items-center">
        {/* Hidden audio element for background music */}
        <audio ref={audioRef} src={videoDetails.musicUrl} loop />

        <h2 className="text-2xl font-bold text-center text-slate-100">
            {readOnly ? `Xem lại: ${videoDetails.title}` : 'Xem trước Video'}
        </h2>
        <p className="mt-2 text-center text-slate-400">
            {readOnly ? 'Xem lại video đã tạo của bạn.' : 'Xem lại video của bạn và nghe lồng tiếng.'}
        </p>

        <div className="w-full max-w-2xl mt-4 space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
              {currentScene?.videoUrl ? (
                  <video 
                    ref={videoRef}
                    src={currentScene.videoUrl} 
                    key={currentScene.id} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    loop 
                    muted 
                    playsInline
                  />
              ) : (
                 <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <p className="text-slate-500">Video not available</p>
                </div>
              )}
               <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="max-w-md">
                        <h3 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-lg">{videoDetails.title}</h3>
                        {videoDetails.author && <p className="mt-2 text-base text-slate-300">Tác giả: {videoDetails.author}</p>}
                    </div>
                    
                    <div className="my-6">
                        <SoundWave isPlaying={isPlaying} />
                    </div>

                    <div className="flex items-center justify-center gap-6">
                        <button onClick={() => handleManualSceneChange('prev')} disabled={currentSceneIndex === 0} className="p-3 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"><PrevIcon /></button>
                        <button onClick={handlePlayToggle} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors shadow-lg">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={() => handleManualSceneChange('next')} disabled={currentSceneIndex === scenes.length - 1} className="p-3 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"><NextIcon /></button>
                    </div>
              </div>
            </div>

            <div>
                 <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <p className="text-center text-sm text-slate-400 font-mono">Cảnh {currentSceneIndex + 1} / {scenes.length}</p>
                <p className="text-center text-slate-300 p-4 bg-slate-900/50 rounded-md mt-2 min-h-[80px]">
                    {currentScene?.scene_text_vietnamese}
                </p>
            </div>

            <div className="pt-4 pb-2 px-4 bg-slate-900/50 rounded-md space-y-4">
                {/* Voice Control Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center border-b border-slate-700 pb-4">
                    <div className="md:col-span-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Giọng đọc (TTS)</h4>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-slate-400 mb-1">Giọng Đọc</label>
                        <select 
                            id="voice-select"
                            value={selectedVoice ? selectedVoice.name : ''}
                            onChange={handleVoiceChange}
                            disabled={availableVoices.length === 0}
                            className="block w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-200 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            {availableVoices.length > 0 ? (
                                availableVoices.map(voice => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))
                            ) : (
                                <option>Không có giọng đọc tiếng Việt</option>
                            )}
                        </select>
                         {availableVoices.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                                Không tìm thấy giọng đọc tiếng Việt. Giọng mặc định của trình duyệt sẽ được sử dụng.
                            </p>
                        )}
                    </div>

                     <div className="md:col-span-2">
                        <label htmlFor="style-select" className="block text-sm font-medium text-slate-400 mb-1">Phong cách</label>
                        <select 
                            id="style-select"
                            value={currentStyleName}
                            onChange={handleStyleChange}
                            className="block w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-200"
                        >
                            {styleOptions.map(style => (
                                <option key={style.name} value={style.name}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rate-slider" className="block text-sm font-medium text-slate-400 mb-1">Tốc độ ({rate.toFixed(2)})</label>
                        <input
                            id="rate-slider" type="range" min="0.5" max="1.5" step="0.05" value={rate}
                            onChange={(e) => { stopPlayback(); setRate(parseFloat(e.target.value)); }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div>
                         <label htmlFor="pitch-slider" className="block text-sm font-medium text-slate-400 mb-1">Cao độ ({pitch.toFixed(2)})</label>
                        <input
                            id="pitch-slider" type="range" min="0.5" max="1.5" step="0.05" value={pitch}
                            onChange={(e) => { stopPlayback(); setPitch(parseFloat(e.target.value)); }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>

                {/* Music Control Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                    <div className="md:col-span-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Thư viện âm thanh YouTube (Demo)</h4>
                        <label htmlFor="music-select" className="block text-sm font-medium text-slate-400 mb-1">Nhạc nền</label>
                         <select 
                            id="music-select"
                            value={videoDetails.musicUrl}
                            onChange={(e) => { 
                                stopPlayback(); 
                                setVideoDetails(prev => ({ ...prev, musicUrl: e.target.value })); 
                            }}
                            disabled={readOnly}
                            className="block w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-slate-200 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            {MUSIC_TRACKS.map(track => (
                                <option key={track.name} value={track.url}>
                                    {track.name}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="volume-slider" className="block text-sm font-medium text-slate-400 mb-1">Âm lượng nhạc nền ({Math.round(videoDetails.musicVolume * 100)}%)</label>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /></svg></span>
                            <input
                                id="volume-slider" type="range" min="0" max="1" step="0.05" 
                                value={videoDetails.musicVolume}
                                disabled={readOnly || !videoDetails.musicUrl}
                                onChange={(e) => { 
                                    setVideoDetails(prev => ({ ...prev, musicVolume: parseFloat(e.target.value) })); 
                                }}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                            />
                            <span className="text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleBack}
          className="px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          {readOnly ? 'Đóng' : 'Quay lại'}
        </button>
        {!readOnly && (
            <button
            onClick={handleNext}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105"
            >
            Tiếp tục
            </button>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;
