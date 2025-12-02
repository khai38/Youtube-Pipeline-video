import React, { useMemo } from 'react';

interface SoundWaveProps {
    isPlaying: boolean;
}

const SoundWave: React.FC<SoundWaveProps> = ({ isPlaying }) => {
    const barCount = 20;

    const bars = useMemo(() => Array.from({ length: barCount }).map(() => ({
        animationDuration: `${Math.random() * 0.5 + 0.8}s`,
        animationDelay: `${Math.random() * 0.5}s`,
    })), [barCount]);

    return (
        <div className="flex items-center justify-center gap-0.5 h-10 w-32">
            {bars.map((bar, i) => (
                <div
                    key={i}
                    className="w-1 bg-white/80"
                    style={{
                        transformOrigin: 'bottom',
                        animation: `sound-wave ${bar.animationDuration} ease-in-out ${bar.animationDelay} infinite alternate`,
                        animationPlayState: isPlaying ? 'running' : 'paused',
                        transform: 'scaleY(0.1)',
                        transition: 'transform 0.2s ease-out'
                    }}
                />
            ))}
        </div>
    );
};

export default SoundWave;
