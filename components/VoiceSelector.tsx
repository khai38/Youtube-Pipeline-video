
import React, { useState, useRef, useMemo } from 'react';
import { CHIRP_VOICES, VOICE_STYLES, playVoicePreview } from '../services/voiceService';
import type { VoiceSettings, VoiceType } from '../types';

interface VoiceSelectorProps {
  characterName: string;
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  onNext: () => void;
  onBack: () => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ characterName, settings, onSettingsChange, onNext, onBack }) => {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<VoiceType | 'All'>('All');
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  // Fix: Use any for restricted environment type
  const audioCtxRef = useRef<any>(null);

  const currentStyles = settings.styles || [];

  const toggleStyle = (styleId: string) => {
    let newStyles = [...currentStyles];
    if (newStyles.includes(styleId)) {
      newStyles = newStyles.filter(id => id !== styleId);
    } else {
      // Giới hạn tối đa 2 style để đảm bảo AI xử lý tốt nhất
      if (newStyles.length >= 2) {
        newStyles.shift(); // Loại bỏ cái cũ nhất
      }
      newStyles.push(styleId);
    }
    onSettingsChange({ ...settings, styles: newStyles });
  };

  const filteredVoices = useMemo(() => {
    return CHIRP_VOICES.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = activeType === 'All' || v.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [search, activeType]);

  const handlePreview = async (voiceId: string) => {
    if (isPreviewing) return;
    // Fix: Access AudioContext on window via any
    if (!audioCtxRef.current) audioCtxRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    
    setIsPreviewing(voiceId);
    try {
      const source = await playVoicePreview(voiceId, audioCtxRef.current);
      source.onended = () => setIsPreviewing(null);
    } catch (e) {
      console.error(e);
      setIsPreviewing(null);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col w-full max-w-4xl mx-auto h-[75vh]">
      <div className="flex flex-col mb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          Chọn giọng cho: <span className="text-indigo-400">{characterName || 'Người dẫn chuyện'}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Cột Trái: Danh sách giọng */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex gap-2 mb-3">
             <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Tìm giọng..."
                value={search}
                // Fix: Cast e.target to HTMLInputElement
                onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <svg className="w-4 h-4 absolute left-3 top-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              {(['All', 'Chirp 3: HD', 'Studio'] as const).map(type => (
                <button key={type} onClick={() => setActiveType(type)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${activeType === type ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {type === 'All' ? 'Tất cả' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {filteredVoices.map((voice) => (
              <div 
                key={voice.id}
                onClick={() => onSettingsChange({ ...settings, voiceId: voice.id })}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                  settings.voiceId === voice.id ? 'bg-indigo-600/10 border-indigo-500 shadow-sm' : 'bg-slate-800/40 border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${voice.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                   {voice.gender === 'female' ? '♀' : '♂'}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{voice.name}</span>
                    <span className="text-[9px] bg-slate-700 text-slate-400 px-1 py-0.5 rounded uppercase">{voice.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{voice.description}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }} className="p-2 bg-slate-900 rounded-full hover:bg-slate-700 text-indigo-400">
                  {isPreviewing === voice.id ? <div className="animate-pulse w-3 h-3 bg-indigo-500 rounded-full"></div> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cột Phải: Styles & Settings */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 shadow-lg">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Sắc thái & Cảm xúc (Chọn tối đa 2)</label>
             <div className="grid grid-cols-2 gap-2">
                {VOICE_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`text-[10px] py-2 px-1 rounded-md border transition-all font-medium ${
                      currentStyles.includes(style.id) 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
              <div className="space-y-1">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Tốc độ</span>
                    <span className="text-indigo-400">{settings.speed}x</span>
                 </div>
                 {/* Fix: Cast e.target to HTMLInputElement */}
                 <input type="range" min="0.5" max="2" step="0.1" value={settings.speed} onChange={(e) => onSettingsChange({...settings, speed: parseFloat((e.target as HTMLInputElement).value)})} className="w-full h-1 bg-slate-700 accent-indigo-500 rounded-full" />
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Tông giọng</span>
                    <span className="text-indigo-400">{settings.pitch}</span>
                 </div>
                 {/* Fix: Cast e.target to HTMLInputElement */}
                 <input type="range" min="0.5" max="1.5" step="0.1" value={settings.pitch} onChange={(e) => onSettingsChange({...settings, pitch: parseFloat((e.target as HTMLInputElement).value)})} className="w-full h-1 bg-slate-700 accent-indigo-500 rounded-full" />
              </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mt-auto pt-6 border-t border-slate-800">
        <button onClick={onBack} className="px-6 py-2 text-sm text-slate-500 hover:text-white font-bold transition-colors">Quay lại</button>
        <button onClick={onNext} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
          Áp dụng & Tiếp tục
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </div>
  );
};

export default VoiceSelector;