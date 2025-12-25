
import type { Scene, VideoFormat } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { decodeBase64, decodeAudioData } from './geminiService';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async () => {
    if (ffmpeg) return ffmpeg;
    ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
};

export const renderVideo = async (
    scenes: Scene[],
    format: VideoFormat,
    musicUrl: string,
    musicVolume: number,
    showSubtitles: boolean,
    showProgressBar: boolean,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const WIDTH = format === 'landscape' ? 1280 : 720;
        const HEIGHT = format === 'landscape' ? 720 : 1280;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        if (!ctx) return reject(new Error("Canvas error"));

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destNode = audioCtx.createMediaStreamDestination();
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.connect(destNode);

        let bgMusicEl: HTMLAudioElement | null = null;
        if (musicUrl) {
            bgMusicEl = new Audio(musicUrl);
            bgMusicEl.crossOrigin = "anonymous";
            bgMusicEl.loop = true;
            bgMusicEl.volume = musicVolume;
            const source = audioCtx.createMediaElementSource(bgMusicEl);
            source.connect(analyser);
        }

        const stream = canvas.captureStream(30);
        if (destNode.stream.getAudioTracks().length > 0) {
            stream.addTrack(destNode.stream.getAudioTracks()[0]);
        }

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        
        recorder.onstop = async () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            onProgress(95);
            try {
                const ff = await loadFFmpeg();
                await ff.writeFile('input.webm', await fetchFile(webmBlob));
                await ff.exec(['-i', 'input.webm', '-c:v', 'copy', '-c:a', 'libopus', 'output.mp4']);
                const data = await ff.readFile('output.mp4');
                onProgress(100);
                resolve(new Blob([data], { type: 'video/mp4' }));
            } catch (err) {
                resolve(webmBlob);
            }
        };

        recorder.start();
        if (bgMusicEl) bgMusicEl.play().catch(() => {});

        const videoEl = document.createElement('video');
        videoEl.crossOrigin = "anonymous";
        videoEl.muted = true;
        
        // Split text into 2 lines for better layout and safe zone
        const wrapToTwoLines = (text: string, maxWidth: number) => {
            const words = text.split(' ');
            const mid = Math.floor(words.length / 2);
            let line1 = words.slice(0, mid).join(' ');
            let line2 = words.slice(mid).join(' ');
            
            // Basic check if it exceeds width, but for subtitles we usually prefer 
            // a balanced 2-line split even if 1 line fits.
            return [line1, line2].filter(l => l.length > 0);
        };

        const drawProgressiveSubtitles = (lines: string[], centerX: number, baseY: number, totalProgress: number) => {
            const fontSize = format === 'landscape' ? 40 : 46;
            const lineHeight = fontSize * 1.3;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const totalChars = lines.join(' ').length;
            let processedChars = 0;

            lines.forEach((line, index) => {
                const y = baseY + (index * lineHeight);
                const lineLen = line.length;
                
                // Calculate line-specific progress based on global progress
                // progress = (currentPos - startPos) / lineLen
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

                // 1. Draw Shadow/Base
                ctx.shadowBlur = 6;
                ctx.shadowColor = "rgba(0,0,0,1)";
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fillText(line, centerX, y);

                // 2. Draw Highlight (Gold)
                ctx.save();
                const textWidth = ctx.measureText(line).width;
                const startX = centerX - textWidth / 2;
                const clipWidth = textWidth * lineProgress;
                
                ctx.beginPath();
                ctx.rect(startX, y - fontSize, clipWidth, fontSize * 2);
                ctx.clip();
                
                ctx.fillStyle = "#FFD700"; // Gold
                ctx.shadowBlur = 12;
                ctx.shadowColor = "rgba(255, 215, 0, 0.7)";
                ctx.fillText(line, centerX, y);
                ctx.restore();

                processedChars += lineLen + 1; // +1 for space/break
            });
        };

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            if (!scene.videoUrl || !scene.audioData) continue;
            onProgress(Math.round((i / scenes.length) * 90));

            const decodedData = decodeBase64(scene.audioData);
            const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000);
            const subtitleLines = wrapToTwoLines(scene.scene_text_vietnamese, WIDTH * 0.8);
            
            await new Promise<void>((res) => {
                videoEl.src = scene.videoUrl!;
                videoEl.onloadeddata = () => {
                    videoEl.play();
                    
                    const voiceSource = audioCtx.createBufferSource();
                    voiceSource.buffer = audioBuffer;
                    voiceSource.connect(analyser);
                    
                    const duration = audioBuffer.duration;
                    const startTime = Date.now();
                    
                    voiceSource.onended = () => res();
                    voiceSource.start();

                    const draw = () => {
                        const elapsed = Date.now() - startTime;
                        if (elapsed >= duration * 1000) return;

                        const sceneProgress = Math.min(elapsed / (duration * 1000), 1);

                        // 1. Draw Background Video
                        const ratio = Math.max(canvas.width / videoEl.videoWidth, canvas.height / videoEl.videoHeight);
                        const w = videoEl.videoWidth * ratio;
                        const h = videoEl.videoHeight * ratio;
                        ctx.drawImage(videoEl, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

                        // 2. Dark Overlay & Vignette
                        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
                        ctx.fillRect(0, 0, WIDTH, HEIGHT);
                        const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH * 0.8);
                        vignette.addColorStop(0, "transparent");
                        vignette.addColorStop(1, "rgba(0, 0, 0, 0.6)");
                        ctx.fillStyle = vignette;
                        ctx.fillRect(0, 0, WIDTH, HEIGHT);

                        // 3. Symmetrical Visualizer
                        analyser.getByteFrequencyData(dataArray);
                        const barWidth = (WIDTH / bufferLength) * 2;
                        let barHeight;
                        let bx = 0;
                        ctx.save();
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = "rgba(255, 255, 200, 0.4)";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                        for (let j = 0; j < bufferLength; j++) {
                            barHeight = (dataArray[j] / 255) * (HEIGHT * 0.1);
                            // Symmetrical around bottom-center
                            ctx.fillRect(WIDTH / 2 + bx, HEIGHT - 50 - barHeight, barWidth - 2, barHeight);
                            ctx.fillRect(WIDTH / 2 - bx - barWidth, HEIGHT - 50 - barHeight, barWidth - 2, barHeight);
                            bx += barWidth;
                        }
                        ctx.restore();

                        // 4. Subtitles in Safe Zone
                        // Vertical Safe Zone: center around 65% - 75% height to avoid TikTok/Reels UI
                        // Landscape Safe Zone: center around 80% height
                        if (showSubtitles) {
                            const safeZoneY = format === 'vertical' ? HEIGHT * 0.65 : HEIGHT * 0.75;
                            // Draw background plate for legibility
                            ctx.fillStyle = "rgba(0,0,0,0.5)";
                            const plateHeight = format === 'vertical' ? 180 : 140;
                            ctx.fillRect(0, safeZoneY - 40, WIDTH, plateHeight);
                            
                            drawProgressiveSubtitles(subtitleLines, WIDTH / 2, safeZoneY, sceneProgress);
                        }

                        // 5. Progress Bar
                        if (showProgressBar) {
                            ctx.fillStyle = "rgba(255,255,255,0.2)";
                            ctx.fillRect(0, HEIGHT - 4, WIDTH, 4);
                            ctx.fillStyle = format === 'vertical' ? "#ff0066" : "#4f46e5";
                            ctx.fillRect(0, HEIGHT - 4, WIDTH * sceneProgress, 4);
                        }
                        requestAnimationFrame(draw);
                    };
                    draw();
                };
            });
        }
        recorder.stop();
        if (bgMusicEl) bgMusicEl.pause();
    });
};
