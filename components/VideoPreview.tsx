
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Scene, VideoFormat, VideoDetails, OverlayMode, TransitionType } from '../types';
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
  const [sceneTransition, setSceneTransition] = useState<TransitionType>('none');
  const [musicFileName, setMusicFileName] = useState<string>("");
  
  const audioCtxRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const bgMusicRef = useRef<any>(null);
  const overlayCanvasRef = useRef<any>(null);
  const currentVoiceSourceRef = useRef<any>(null);
  const fileInputRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);
  const sceneStartTimeRef = useRef<number>(0);
  const currentDurationRef = useRef<number>(0);
  const totalTimeRef = useRef<number>(0);

  const initAudioCtx = () => {
      if (!audioCtxRef.current) {
          const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
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

  const drawRecIcon = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const padding = 40;
    const dotRadius = 10;
    const isVisible = Math.floor(time / 500) % 2 === 0;
    
    if (isVisible) {
        ctx.beginPath();
        ctx.arc(padding + dotRadius, padding + dotRadius, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#FF0000";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "red";
        ctx.fill();
    }
    
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "white";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("REC", padding + dotRadius * 2.5 + 5, padding + dotRadius);
    ctx.restore();
  };

  const drawDust = (ctx: any, width: number, height: number, time: number) => {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i * 123.4 + time * 0.0001) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 567.8 + time * 0.00015) * 0.5 + 0.5) * height;
        const size = (Math.sin(i + time * 0.001) * 0.5 + 1) * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  };

  const drawLightLeaks = (ctx: any, width: number, height: number, time: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const x = (Math.sin(time * 0.0005) * 0.5 + 0.5) * width;
    const y = (Math.cos(time * 0.0007) * 0.5 + 0.5) * height;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, width * 0.6);
    grad.addColorStop(0, "rgba(255, 100, 50, 0.12)");
    grad.addColorStop(0.5, "rgba(255, 200, 100, 0.04)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
  };

  const drawProgressiveSubtitles = (ctx: CanvasRenderingContext2D, text: string, centerX: number, baseY: number, totalProgress: number, canvasWidth: number) => {
    const isVertical = videoFormat === 'vertical';
    const baseFontSize = isVertical ? 44 : 36;
    const maxWidth = canvasWidth * 0.85;
    
    ctx.font = `bold ${baseFontSize}px sans-serif`;
    let lines = wrapText(ctx, text, maxWidth);
    
    let fontSize = baseFontSize;
    if (isVertical && lines.length > 2) {
        fontSize = Math.max(30, baseFontSize - (lines.length * 2));
        ctx.font = `bold ${fontSize}px sans-serif`;
        lines = wrapText(ctx, text, maxWidth);
    }

    const lineHeight = fontSize * 1.35;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const totalChars = text.length;
    let processedChars = 0;

    lines.forEach((line: string, index: number) => {
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

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
        ctx.lineWidth = fontSize * 0.15;
        ctx.strokeText(line, centerX, y);

        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillText(line, centerX, y);
        
        ctx.save();
        const textWidth = ctx.measureText(line).width;
        const startX = centerX - textWidth / 2;
        const clipWidth = textWidth * lineProgress;
        
        ctx.beginPath();
        ctx.rect(startX, y - fontSize, clipWidth, fontSize * 2);
        ctx.clip();
        
        ctx.fillStyle = "#FFD700";
        ctx.shadowBlur = 10;
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
        totalTimeRef.current += 16;

        const elapsed = Date.now() - sceneStartTimeRef.current;
        const sceneProgress = Math.min(elapsed / (currentDurationRef.current * 1000), 1);

        // --- Transitions ---
        ctx.save();
        const transDur = 500;
        if (elapsed < transDur) {
            const tRatio = elapsed / transDur;
            if (sceneTransition === 'fade') ctx.globalAlpha = tRatio;
            if (sceneTransition === 'blur') ctx.filter = `blur(${(1 - tRatio) * 15}px)`;
        }

        ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
        ctx.fillRect(0, 0, width, height);
        const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.9);
        vignette.addColorStop(0, "transparent");
        vignette.addColorStop(1, "rgba(15, 23, 42, 0.35)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        
        if (sceneTransition === 'flash' && elapsed < transDur) {
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - (elapsed / transDur)})`;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();

        // --- Overlays ---
        if (videoDetails.overlayMode === 'dust' || videoDetails.overlayMode === 'cinematic') {
            drawDust(ctx, width, height, totalTimeRef.current);
        }
        if (videoDetails.overlayMode === 'lightleak' || videoDetails.overlayMode === 'cinematic') {
            drawLightLeaks(ctx, width, height, totalTimeRef.current);
        }

        // --- REC Icon ---
        drawRecIcon(ctx, totalTimeRef.current);

        // --- Subtitles ---
        if (videoDetails.showSubtitles && scenes[currentSceneIndex]) {
            const text = scenes[currentSceneIndex].scene_text_vietnamese;
            const safeZoneY = videoFormat === 'vertical' ? height * 0.68 : height * 0.78;
            drawProgressiveSubtitles(ctx, text, width / 2, safeZoneY, sceneProgress, width);
        }

        // --- Visualizer ---
        const barWidth = (width / bufferLength) * 2;
        let xPos = 0;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * (height * 0.08);
            ctx.fillRect(width / 2 + xPos, height - 30 - barHeight, barWidth - 1, barHeight);
            ctx.fillRect(width / 2 - xPos - barWidth, height - 30 - barHeight, barWidth - 1, barHeight);
            xPos += barWidth;
        }
        ctx.restore();
        
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
        const ctx = (overlayCanvasRef.current as any).getContext('2d');
        ctx?.clearRect(0, 0, (overlayCanvasRef.current as any).width, (overlayCanvasRef.current as any).height);
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

      const possible: TransitionType[] = ['fade', 'zoom', 'flash', 'blur'];
      const chosen = videoDetails.transitionType === 'random' 
        ? possible[Math.floor(Math.random() * possible.length)]
        : videoDetails.transitionType;
      setSceneTransition(chosen);

      const decodedData = decodeBase64(scene.audioData);
      const audioBuffer = await decodeAudioData(decodedData, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      
      currentDurationRef.current = audioBuffer.duration;
      sceneStartTimeRef.current = Date.now();

      source.onended = () => {
          if (index < scenes.length - 1) {
              setCurrentSceneIndex(index + 1);
          } else {
              stopPlayback();
          }
      };

      currentVoiceSourceRef.current = source;
      source.start();
      (videoRef.current as any)?.play().catch(() => {});
      if (bgMusicRef.current) {
          (bgMusicRef.current as any).volume = videoDetails.musicVolume;
          (bgMusicRef.current as any).play().catch(() => {});
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
          (bgMusicRef.current as any).volume = videoDetails.musicVolume;
      }
  }, [videoDetails.musicVolume]);

  useEffect(() => {
      return () => {
          stopPlayback();
          if (audioCtxRef.current) audioCtxRef.current.close();
      };
  }, []);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        const url = (window as any).URL.createObjectURL(file);
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
                            className={`w-full h-full object-cover transition-transform duration-700 ${sceneTransition === 'zoom' && isPlaying ? 'scale-105' : 'scale-100'}`}
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

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-6 h-fit overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                                    onClick={() => (fileInputRef.current as any)?.click()}
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
                                onChange={(e) => setVideoDetails({...videoDetails, musicVolume: parseFloat((e.target as HTMLInputElement).value)})}
                                className="w-full h-1 bg-slate-700 appearance-none accent-indigo-500 rounded-full" 
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700 space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Chuyển cảnh (Transitions)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { id: 'random', label: '✨ NGẪU NHIÊN' },
                            { id: 'fade', label: 'Chồng mờ' },
                            { id: 'zoom', label: 'Thu phóng' },
                            { id: 'flash', label: 'Nháy trắng' },
                            { id: 'blur', label: 'Mờ ảo' }
                        ] as {id: TransitionType, label: string}[]).map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setVideoDetails({...videoDetails, transitionType: mode.id})}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    videoDetails.transitionType === mode.id 
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/20' 
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700 space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Lớp phủ động (CapCut Style)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { id: 'none', label: 'Không có' },
                            { id: 'dust', label: 'Hạt bụi' },
                            { id: 'lightleak', label: 'Ánh sáng' },
                            { id: 'cinematic', label: 'Cinematic' }
                        ] as {id: OverlayMode, label: string}[]).map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setVideoDetails({...videoDetails, overlayMode: mode.id})}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    videoDetails.overlayMode === mode.id 
                                    ? 'bg-indigo-600 border-indigo-400 text-white' 
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={videoDetails.showSubtitles} 
                                onChange={(e) => setVideoDetails({...videoDetails, showSubtitles: (e.target as HTMLInputElement).checked})}
                                className="sr-only" 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${videoDetails.showSubtitles ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${videoDetails.showSubtitles ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Hiển thị Phụ đề</span>
                    </label>

                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <p className="text-[10px] text-indigo-300 leading-relaxed italic">
                            * Hiệu ứng ghi hình động (.REC) được tự động thêm vào góc trái video để tăng tính chân thực.
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
