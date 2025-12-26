
import type { Scene, VideoFormat, OverlayMode, TransitionType } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { decodeBase64, decodeAudioData } from './geminiService';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async () => {
    if (ffmpeg) return ffmpeg;
    ffmpeg = new FFmpeg();
    const baseURL = 'https://aistudiocdn.com/ffmpeg.wasm@0.12.10/dist/esm'; // Updated to a stable CDN
    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    } catch (e) {
        console.error("FFmpeg load failed, falling back to unpkg", e);
        const fallbackURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${fallbackURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }
    return ffmpeg;
};

const drawRecIcon = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const padding = 40;
    const dotRadius = 8;
    const isVisible = Math.floor(time / 500) % 2 === 0;
    
    if (isVisible) {
        ctx.beginPath();
        ctx.arc(padding + dotRadius, padding + dotRadius, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#FF0000";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "red";
        ctx.fill();
    }
    
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = "white";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("REC", padding + dotRadius * 2.5 + 5, padding + dotRadius);
    ctx.restore();
};

const drawDust = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 40; i++) {
        const x = (Math.sin(i * 123.4 + time * 0.0001) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 567.8 + time * 0.00015) * 0.5 + 0.5) * height;
        const size = (Math.sin(i + time * 0.001) * 0.5 + 1) * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const drawLightLeaks = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const x = (Math.sin(time * 0.0005) * 0.5 + 0.5) * width;
    const y = (Math.cos(time * 0.0007) * 0.5 + 0.5) * height;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, width * 0.6);
    grad.addColorStop(0, "rgba(255, 100, 50, 0.15)");
    grad.addColorStop(0.5, "rgba(255, 200, 100, 0.05)");
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

export const renderVideo = async (
    scenes: Scene[],
    format: VideoFormat,
    musicUrl: string,
    musicVolume: number,
    showSubtitles: boolean,
    showProgressBar: boolean,
    overlayMode: OverlayMode,
    transitionType: TransitionType,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        const WIDTH = format === 'landscape' ? 1280 : 720;
        const HEIGHT = format === 'landscape' ? 720 : 1280;
        const canvas = (globalThis as any).document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas error"));

        // --- BƯỚC 1: PRE-FETCH TÀI NGUYÊN (TRÁNH KHỰNG KHI RENDER) ---
        onProgress(5);
        const preparedAssets = await Promise.all(scenes.map(async (scene, idx) => {
            if (!scene.videoUrl || !scene.audioData) return null;
            
            // Tải video về dưới dạng Blob cục bộ
            const videoBlob = await fetch(scene.videoUrl).then(r => r.blob());
            const localVideoUrl = URL.createObjectURL(videoBlob);
            
            // Giải mã sẵn Audio
            const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            const decodedData = decodeBase64(scene.audioData);
            const audioBuffer = await decodeAudioData(decodedData, audioCtx, 24000);
            
            onProgress(5 + Math.round((idx / scenes.length) * 15));
            return { localVideoUrl, audioBuffer };
        }));

        const validAssets = preparedAssets.filter(a => a !== null) as { localVideoUrl: string, audioBuffer: AudioBuffer }[];
        
        // --- BƯỚC 2: THIẾT LẬP GHI HÌNH ---
        const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        const destNode = audioCtx.createMediaStreamDestination();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.connect(destNode);

        let bgMusicEl: any = null;
        if (musicUrl) {
            bgMusicEl = new (globalThis as any).Audio(musicUrl);
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

        const recorder = new (window as any).MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e: any) => chunks.push(e.data);
        
        recorder.onstop = async () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            onProgress(95);
            try {
                const ff = await loadFFmpeg();
                await ff.writeFile('input.webm', await fetchFile(webmBlob));
                await ff.exec(['-i', 'input.webm', '-c:v', 'copy', '-c:a', 'libopus', 'output.mp4']);
                const data = await ff.readFile('output.mp4');
                validAssets.forEach(a => URL.revokeObjectURL(a.localVideoUrl));
                onProgress(100);
                resolve(new Blob([data], { type: 'video/mp4' }));
            } catch (err) {
                resolve(webmBlob);
            }
        };

        const videoEl = (globalThis as any).document.createElement('video');
        videoEl.crossOrigin = "anonymous";
        videoEl.muted = true;
        videoEl.playsInline = true;

        const possibleTransitions: TransitionType[] = ['fade', 'zoom', 'flash', 'blur'];
        let totalTime = 0;

        recorder.start();
        if (bgMusicEl) bgMusicEl.play().catch(() => {});

        // --- BƯỚC 3: VÒNG LẶP RENDER CHÍNH ---
        for (let i = 0; i < validAssets.length; i++) {
            const asset = validAssets[i];
            const originalScene = scenes[i];
            
            await new Promise<void>((res) => {
                videoEl.src = asset.localVideoUrl;
                videoEl.onloadeddata = async () => {
                    await videoEl.play();
                    
                    const voiceSource = audioCtx.createBufferSource();
                    voiceSource.buffer = asset.audioBuffer;
                    voiceSource.connect(analyser);
                    
                    const duration = asset.audioBuffer.duration;
                    const startTime = Date.now();
                    const transType = transitionType === 'random' 
                        ? possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)]
                        : transitionType;
                    
                    voiceSource.onended = () => res();
                    voiceSource.start();

                    const draw = () => {
                        const elapsed = Date.now() - startTime;
                        if (elapsed >= duration * 1000) return;

                        const sceneProgress = Math.min(elapsed / (duration * 1000), 1);
                        totalTime += 16; 

                        const ratio = Math.max(canvas.width / videoEl.videoWidth, canvas.height / videoEl.videoHeight);
                        const w = videoEl.videoWidth * ratio;
                        const h = videoEl.videoHeight * ratio;
                        
                        ctx.save();
                        const transDur = 500; 
                        if (elapsed < transDur) {
                            const tRatio = elapsed / transDur;
                            if (transType === 'fade') ctx.globalAlpha = tRatio;
                            if (transType === 'blur') ctx.filter = `blur(${(1 - tRatio) * 20}px)`;
                        }
                        if (transType === 'zoom') {
                            const zoomScale = 1 + (0.08 * (1 - sceneProgress));
                            ctx.translate(WIDTH/2, HEIGHT/2);
                            ctx.scale(zoomScale, zoomScale);
                            ctx.translate(-WIDTH/2, -HEIGHT/2);
                        }
                        ctx.drawImage(videoEl, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
                        if (transType === 'flash' && elapsed < transDur) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${1 - (elapsed / transDur)})`;
                            ctx.fillRect(0, 0, WIDTH, HEIGHT);
                        }
                        ctx.restore();

                        // Effects
                        ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
                        ctx.fillRect(0, 0, WIDTH, HEIGHT);
                        const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH * 0.9);
                        vignette.addColorStop(0, "transparent");
                        vignette.addColorStop(1, "rgba(15, 23, 42, 0.35)");
                        ctx.fillStyle = vignette;
                        ctx.fillRect(0, 0, WIDTH, HEIGHT);

                        if (overlayMode === 'dust' || overlayMode === 'cinematic') drawDust(ctx, WIDTH, HEIGHT, totalTime);
                        if (overlayMode === 'lightleak' || overlayMode === 'cinematic') drawLightLeaks(ctx, WIDTH, HEIGHT, totalTime);
                        drawRecIcon(ctx, totalTime);

                        if (showSubtitles) {
                            const safeZoneY = format === 'vertical' ? HEIGHT * 0.68 : HEIGHT * 0.78;
                            
                            // Phụ đề progressive
                            const text = originalScene.scene_text_vietnamese;
                            const fontSize = format === 'vertical' ? 48 : 40;
                            ctx.font = `bold ${fontSize}px sans-serif`;
                            const lines = wrapText(ctx, text, WIDTH * 0.82);
                            const lineHeight = fontSize * 1.4;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            lines.forEach((line, idx) => {
                                const y = safeZoneY + (idx * lineHeight);
                                ctx.shadowBlur = 0;
                                ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
                                ctx.lineWidth = fontSize * 0.18;
                                ctx.strokeText(line, WIDTH / 2, y);
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = "black";
                                ctx.fillStyle = "white";
                                ctx.fillText(line, WIDTH / 2, y);
                                
                                // Color highlighting
                                ctx.save();
                                const tw = ctx.measureText(line).width;
                                const clipW = tw * sceneProgress;
                                ctx.beginPath();
                                ctx.rect(WIDTH/2 - tw/2, y - fontSize, clipW, fontSize * 2);
                                ctx.clip();
                                ctx.fillStyle = "#FFD700";
                                ctx.fillText(line, WIDTH / 2, y);
                                ctx.restore();
                            });
                        }

                        // Audio Visualizer
                        analyser.getByteFrequencyData(dataArray);
                        const barWidth = (WIDTH / bufferLength) * 2;
                        let bx = 0;
                        ctx.save();
                        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                        for (let j = 0; j < bufferLength; j++) {
                            const bh = (dataArray[j] / 255) * (HEIGHT * 0.08);
                            ctx.fillRect(WIDTH / 2 + bx, HEIGHT - 30 - bh, barWidth - 2, bh);
                            ctx.fillRect(WIDTH / 2 - bx - barWidth, HEIGHT - 30 - bh, barWidth - 2, bh);
                            bx += barWidth;
                        }
                        ctx.restore();

                        if (showProgressBar) {
                            ctx.fillStyle = "rgba(255,255,255,0.1)";
                            ctx.fillRect(0, HEIGHT - 4, WIDTH, 4);
                            ctx.fillStyle = format === 'vertical' ? "#ff0066" : "#4f46e5";
                            ctx.fillRect(0, HEIGHT - 4, WIDTH * sceneProgress, 4);
                        }
                        requestAnimationFrame(draw);
                    };
                    draw();
                };
            });
            onProgress(20 + Math.round((i / validAssets.length) * 70));
        }
        recorder.stop();
        if (bgMusicEl) bgMusicEl.pause();
    });
};
