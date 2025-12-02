
import type { Scene } from '../types';

export const renderVideo = async (
    scenes: Scene[],
    musicUrl: string,
    musicVolume: number,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Set HD Resolution
        const WIDTH = 1280;
        const HEIGHT = 720;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        if (!ctx) {
            reject(new Error("Could not create canvas context"));
            return;
        }

        // Setup Audio Context for Background Music mixing
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destNode = audioCtx.createMediaStreamDestination();
        let bgMusicSource: MediaElementAudioSourceNode | null = null;
        let bgMusicEl: HTMLAudioElement | null = null;

        if (musicUrl) {
            bgMusicEl = new Audio(musicUrl);
            bgMusicEl.crossOrigin = "anonymous";
            bgMusicEl.loop = true;
            bgMusicEl.volume = musicVolume;
            try {
                // Ensure audio allows cross origin processing
                bgMusicSource = audioCtx.createMediaElementSource(bgMusicEl);
                bgMusicSource.connect(destNode);
                bgMusicSource.connect(audioCtx.destination); // Also play to speakers so user hears it? Maybe mute for rendering.
            } catch (e) {
                console.warn("Could not connect audio source (CORS likely)", e);
            }
        }

        // Prepare MediaRecorder
        const canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Add Audio Track if exists
        if (destNode.stream.getAudioTracks().length > 0) {
            canvasStream.addTrack(destNode.stream.getAudioTracks()[0]);
        }

        const mimeTypes = [
            'video/mp4; codecs="avc1.424028, mp4a.40.2"',
            'video/webm; codecs=vp9',
            'video/webm'
        ];
        
        let selectedMimeType = '';
        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                selectedMimeType = type;
                break;
            }
        }

        if (!selectedMimeType) {
            reject(new Error("Trình duyệt không hỗ trợ ghi hình video (MediaRecorder)."));
            return;
        }

        const recorder = new MediaRecorder(canvasStream, {
            mimeType: selectedMimeType,
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: selectedMimeType });
            // Cleanup
            if (bgMusicEl) {
                bgMusicEl.pause();
                bgMusicEl.src = "";
            }
            audioCtx.close();
            resolve(blob);
        };

        recorder.start();
        if (bgMusicEl) bgMusicEl.play().catch(e => console.warn("Auto-play blocked for render", e));

        // Helper to draw video to canvas
        const videoEl = document.createElement('video');
        videoEl.crossOrigin = "anonymous";
        videoEl.muted = true; // Video tracks are visual only
        videoEl.playsInline = true;
        
        // Calculate total estimated duration for progress
        // Estimate: 5 seconds per scene + extra for long text? 
        // For simplicity, let's use a fixed duration calculation or just scene count.
        const totalScenes = scenes.length;

        try {
            for (let i = 0; i < totalScenes; i++) {
                const scene = scenes[i];
                if (!scene.videoUrl) continue;

                onProgress(Math.round((i / totalScenes) * 100));

                await new Promise<void>((resolveScene, rejectScene) => {
                    videoEl.src = scene.videoUrl!;
                    
                    // Logic to determine scene duration
                    // Standard heuristic: 0.4 seconds per word for reading speed
                    const wordCount = scene.scene_text_vietnamese.split(' ').length;
                    const sceneDuration = Math.max(5000, wordCount * 400); // Min 5 seconds
                    
                    videoEl.onloadeddata = () => {
                        videoEl.play();
                        
                        const startTime = Date.now();
                        
                        const drawFrame = () => {
                            if (Date.now() - startTime >= sceneDuration) {
                                resolveScene();
                                return;
                            }

                            // Center crop logic (cover)
                            const hRatio = canvas.width / videoEl.videoWidth;
                            const vRatio = canvas.height / videoEl.videoHeight;
                            const ratio = Math.max(hRatio, vRatio);
                            const centerShift_x = (canvas.width - videoEl.videoWidth * ratio) / 2;
                            const centerShift_y = (canvas.height - videoEl.videoHeight * ratio) / 2;

                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(
                                videoEl, 
                                0, 0, videoEl.videoWidth, videoEl.videoHeight,
                                centerShift_x, centerShift_y, videoEl.videoWidth * ratio, videoEl.videoHeight * ratio
                            );
                            
                            // Optional: Add Text Overlay (Subtitles)
                            // ctx.font = "24px Arial";
                            // ctx.fillStyle = "white";
                            // ctx.textAlign = "center";
                            // ctx.fillText(scene.scene_text_vietnamese, canvas.width/2, canvas.height - 50);

                            if (i === totalScenes - 1 && Date.now() - startTime >= sceneDuration - 50) {
                                // Close to end of last scene
                            } else {
                                requestAnimationFrame(drawFrame);
                            }
                        };
                        drawFrame();
                    };
                    
                    videoEl.onerror = (e) => {
                        console.error(`Error loading video for scene ${i}`, e);
                        resolveScene(); // Skip bad video but keep going
                    };
                });
            }
        } catch (err) {
            reject(err);
        } finally {
            recorder.stop();
        }
    });
};
