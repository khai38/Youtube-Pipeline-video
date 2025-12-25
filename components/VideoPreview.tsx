
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Scene, VideoFormat, VideoDetails } from '../types';
import { decodeBase64, decodeAudioData } from '../services/geminiService';
import SoundWave from './SoundWave';

interface VideoPreviewProps {
  scenes: Scene[];
  videoFormat: VideoFormat;
  videoDetails: VideoDetails;
  setVideoDetails: React.Dispatch<React.SetStateAction<VideoDetails>>;
  onNext?: () => void;
  onBack: () => void;
  readOnly?: boolean;
}

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
    scenes, videoFormat, videoDetails, setVideoDetails, onNext, onBack, readOnly = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [musicFileName, setMusicFileName] = useState<string>("");
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentVoiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(null);
  const sceneStartTimeRef = useRef<number>(0);
  const currentDurationRef = useRef<number>(0);

  const initAudioCtx = () => {
      if (!audioCtxRef.current) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.connect(ctx.destination);
          
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;

          if (bgMusicRef.current) {
              const musicSource = ctx.createMediaElementSource(bgMusicRef.current);
              musicSource.connect(analyser);
          }
      }
      return { ctx: audioCtxRef.current, analyser: analyserRef.current };
  };

  const drawProgressiveSubtitles = (ctx: CanvasRenderingContext2D, lines: string[], centerX: number, baseY: number, totalProgress: number) => {
    const fontSize = videoFormat === 'landscape' ? 36 : 42;
    const lineHeight = fontSize * 1.3;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const totalChars = lines.join(' ').length;
    let processedChars = 0;

    lines.forEach((line, index) => {
        const y = baseY + (index * lineHeight);
        const lineLen = line.length;
        
        const lineStartPercent = processedChars / totalChars;
        const lineEndPercent = (processedChars + lineLen) / totalChars;
        
        let lineProgress = 0;
        if (totalProgress >= lineEndPercent) {
            lineProgress = 1;
        } else if (totalProgress <= lineStartPercent) {
            lineProgress = 0;
        } else {
            lineProgress = (totalProgress - lineStartPercent) / (lineEndPercent - lineStartPercent);
        }

        // Base text
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(line, centerX, y);
        
        // Highlighted text with clipping
        ctx.save();
        const textWidth = ctx.measureText(line).width;
        const startX = centerX - textWidth / 2;
        const clipWidth = textWidth * lineProgress;
        
        ctx.beginPath();
        ctx.rect(startX, y - fontSize, clipWidth, fontSize * 2);
        ctx.clip();
        
        ctx.fillStyle = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
        ctx.fillText(line, centerX, y);
        ctx.restore();

        processedChars += lineLen + 1;
    });
  };

  const drawVisualizer = () => {
    if (!overlayCanvasRef.current || !analyserRef.current || !isPlaying) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const renderFrame = () => {
        if (!isPlaying) return;
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const width = canvas.width;
        const height = canvas.height;

        // 1. Overlays
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, 0, width, height);
        const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
        vignette.addColorStop(0, "transparent");
        vignette.addColorStop(1, "rgba(0, 0, 0, 0.6)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // 2. Equalizer
        const barWidth = (width / bufferLength) * 2;
        let barHeight;
        let xPos = 0;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * (height * 0.12);
            ctx.fillRect(width / 2 + xPos, height - 30 - barHeight, barWidth - 1, barHeight);
            ctx.fillRect(width / 2 - xPos - barWidth, height - 30 - barHeight, barWidth - 1, barHeight);
            xPos += barWidth;
        }
        ctx.restore();

        // 3. Subtitles in Safe Zone
        if (videoDetails.showSubtitles && scenes[currentSceneIndex]) {
            const elapsed = Date.now() - sceneStartTimeRef.current;
            const progress = Math.min(elapsed / (currentDurationRef.current * 1000), 1);
            
            const words = scenes[currentSceneIndex].scene_text_vietnamese.split(' ');
            const mid = Math.floor(words.length / 2);
            const lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(l => l.length > 0);

            const safeZoneY = videoFormat === 'vertical' ? height * 0.65 : height * 0.75;
            
            // Background plate
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            const plateHeight = videoFormat === 'vertical' ? 160 : 120;
            ctx.fillRect(0, safeZoneY - 40, width, plateHeight);
            
            drawProgressiveSubtitles(ctx, lines, width / 2, safeZoneY, progress);
        }
        
        requestRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    videoRef.current?.pause();
    if (bgMusicRef.current) bgMusicRef.current.pause();
    if (currentVoiceSourceRef.current) {
        currentVoiceSourceRef.current.stop();
        currentVoiceSourceRef.current = null;
    }
    if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  }, []);

  const playScene = async (index: number) => {
      const scene = scenes[index];
      if (!scene || !scene.audioData) return;

      const { ctx, analyser } = initAudioCtx();
      if (!ctx || !analyser) return;
      if (ctx.state === 'suspended') await ctx.resume();

      if (currentVoiceSourceRef.current) {
          currentVoiceSourceRef.current.stop();
      }

      const decodedData = decodeBase64(scene.audioData);
      const audioBuffer = await decodeAudioData(decodedData, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      
      currentDurationRef.current = audioBuffer.duration;
      sceneStartTimeRef.current = Date.now();

      source.onended = () => {
          if (index < scenes.length - 1) {
              setIsTransitioning(true);
              setTimeout(() => {
                  setCurrentSceneIndex(index + 1);
                  setIsTransitioning(false);
              }, 100);
          } else {
              stopPlayback();
          }
      };

      currentVoiceSourceRef.current = source;
      source.start();
      videoRef.current?.play().catch(() => {});
      if (bgMusicRef.current) {
          bgMusicRef.current.volume = videoDetails.musicVolume;
          bgMusicRef.current.play().catch(() => {});
      }
      
      drawVisualizer();
  };

  useEffect(() => {
      if (isPlaying) {
          playScene(currentSceneIndex);
      } else {
          stopPlayback();
      }
  }, [isPlaying, currentSceneIndex]);

  useEffect(() => {
      if (bgMusicRef.current) {
          bgMusicRef.current.volume = videoDetails.musicVolume;
      }
  }, [videoDetails.musicVolume]);

  useEffect(() => {
      return () => {
          stopPlayback();
          if (audioCtxRef.current) audioCtxRef.current.close();
      };
  }, []);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setVideoDetails(prev => ({ ...prev, musicUrl: url }));
        setMusicFileName(file.name);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col items-center w-full">
        <audio ref={bgMusicRef} src={videoDetails.musicUrl} loop crossOrigin="anonymous" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            <div className="flex flex-col items-center">
                <div className={`w-full ${videoFormat === 'vertical' ? 'max-w-xs' : 'max-w-full'} bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl group relative`}>
                    <div className={`${videoFormat === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'} relative`}>
                        <video 
                            ref={videoRef}
                            src={scenes[currentSceneIndex]?.videoUrl} 
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                            loop muted playsInline
                        />
                        <canvas 
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none z-10"
                            width={1280}
                            height={720}
                        />
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-white/20 rounded-full backdrop-blur-md">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex justify-center w-full"><SoundWave isPlaying={isPlaying} /></div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-8 h-fit">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                        Cài đặt Video & Audio
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tải lên nhạc nền</label>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-grow py-3 px-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg hover:border-indigo-500 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <svg className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                    <span className="text-sm text-slate-300 truncate max-w-[150px]">{musicFileName || "Chọn tệp âm thanh"}</span>
                                </button>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="audio/*" 
                                    onChange={handleMusicUpload} 
                                    className="hidden" 
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase">Âm lượng nhạc nền</label>
                                <span className="text-xs font-mono text-indigo-400 font-bold">{Math.round(videoDetails.musicVolume * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={videoDetails.musicVolume} 
                                onChange={(e) => setVideoDetails({...videoDetails, musicVolume: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 appearance-none accent-indigo-500 rounded-full" 
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={videoDetails.showSubtitles} 
                                onChange={(e) => setVideoDetails({...videoDetails, showSubtitles: e.target.checked})}
                                className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${videoDetails.showSubtitles ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${videoDetails.showSubtitles ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Hiển thị Phụ đề</span>
                    </label>

                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] text-red-300 leading-relaxed italic">
                            * Phụ đề đã được căn chỉnh 2 dòng vào Vùng An Toàn (Safe Zone) giúp hiển thị tốt trên mọi thiết bị.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12 flex gap-4">
            <button onClick={() => {stopPlayback(); onBack();}} className="px-8 py-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 font-bold transition-all">Quay lại</button>
            <button onClick={() => {stopPlayback(); onNext?.();}} className="px-12 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                Tiếp tục Xuất Video
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
        </div>
    </div>
  );
};

export default VideoPreview;
