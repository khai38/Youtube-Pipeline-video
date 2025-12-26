
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
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const audioCtxRef = useRef<any>(null);

  const currentStyles = settings.styles || [];

  const toggleStyle = (styleId: string) => {
    let newStyles = [...currentStyles];
    if (newStyles.includes(styleId)) {
      newStyles = newStyles.filter(id => id !== styleId);
    } else {
      if (newStyles.length >= 2) {
        newStyles.shift();
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
      const matchesGender = genderFilter === 'all' || v.gender === genderFilter;
      return matchesSearch && matchesType && matchesGender;
    });
  }, [search, activeType, genderFilter]);

  const handlePreview = async (voiceId: string) => {
    if (isPreviewing) return;
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
        <p className="text-xs text-slate-500 mt-1">Cung cấp bộ sưu tập Premium vi-VN Chirp3-HD cao cấp nhất.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Cột Trái: Danh sách giọng */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Tìm kiếm giọng Premium..."
                value={search}
                onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                {(['All', 'Chirp 3: HD', 'Studio'] as const).map(type => (
                  <button key={type} onClick={() => setActiveType(type)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeType === type ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                    {type === 'All' ? 'Tất cả' : type}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                {(['all', 'male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setGenderFilter(g)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${genderFilter === g ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {g === 'all' ? 'Tất cả' : g === 'male' ? 'Nam' : 'Nữ'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {filteredVoices.length > 0 ? filteredVoices.map((voice) => (
              <div 
                key={voice.id}
                onClick={() => onSettingsChange({ ...settings, voiceId: voice.id })}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-4 group ${
                  settings.voiceId === voice.id ? 'bg-indigo-600/15 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-sm ${voice.gender === 'female' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                   {voice.gender === 'female' ? '♀' : '♂'}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${settings.voiceId === voice.id ? 'text-indigo-300' : 'text-slate-100'}`}>{voice.name}</span>
                    {voice.type === 'Chirp 3: HD' && (
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-black uppercase border border-indigo-500/30">PREMIUM</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{voice.description}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }} 
                  className={`p-2.5 rounded-full transition-all ${isPreviewing === voice.id ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-indigo-400 hover:scale-110 active:scale-95'}`}
                >
                  {isPreviewing === voice.id ? <div className="animate-pulse w-4 h-4 bg-white rounded-full"></div> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
              </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <p className="text-sm font-bold">Không tìm thấy giọng nói nào khớp bộ lọc</p>
                </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Styles & Settings */}
        <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 shadow-xl">
             <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sắc thái Cảm xúc & Micro</label>
                <span className="text-[9px] text-indigo-400 font-bold bg-indigo-400/10 px-2 py-0.5 rounded-full">{currentStyles.length}/2</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
                {VOICE_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`text-[9px] py-3 px-1.5 rounded-lg border transition-all font-bold leading-tight ${
                      currentStyles.includes(style.id) 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-6 shadow-xl">
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Tốc độ đọc</span>
                    <span className="text-indigo-400 font-mono">{settings.speed}x</span>
                 </div>
                 <input type="range" min="0.5" max="2.0" step="0.1" value={settings.speed} onChange={(e) => onSettingsChange({...settings, speed: parseFloat((e.target as HTMLInputElement).value)})} className="w-full h-1.5 bg-slate-700 appearance-none accent-indigo-500 rounded-full cursor-pointer" />
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Tông giọng (Pitch)</span>
                    <span className="text-indigo-400 font-mono">{settings.pitch}</span>
                 </div>
                 <input type="range" min="0.5" max="1.5" step="0.1" value={settings.pitch} onChange={(e) => onSettingsChange({...settings, pitch: parseFloat((e.target as HTMLInputElement).value)})} className="w-full h-1.5 bg-slate-700 appearance-none accent-indigo-500 rounded-full cursor-pointer" />
              </div>
          </div>
          
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                * Các style <b>Micro (Pro/Podcast)</b> thêm vào hơi thở và âm sắc thực tế của con người, giúp giọng đọc tự nhiên hơn 40%.
              </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mt-auto pt-4 border-t border-slate-800">
        <button onClick={onBack} className="px-6 py-2 text-xs text-slate-500 hover:text-white font-bold transition-all flex items-center gap-2 group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Quay lại
        </button>
        <button onClick={onNext} className="px-10 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs">
          Áp dụng & Tiếp tục
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </div>
  );
};

export default VoiceSelector;
