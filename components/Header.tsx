
import React from 'react';

const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.267,4,12,4,12,4S5.733,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.733,2,12,2,12s0,4.267,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.733,20,12,20,12,20s6.267,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.267,22,12,22,12S22,7.733,21.582,6.186z M9.933,15.5V8.5l6.5,3.5L9.933,15.5z" />
    </svg>
);

interface HeaderProps {
    currentView?: 'create' | 'history';
    onViewChange?: (view: 'create' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView = 'create', onViewChange }) => {
    return (
        <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <YouTubeIcon />
                        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                            AI YouTube Video Creator
                        </h1>
                    </div>

                    {onViewChange && (
                        <nav className="flex bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => onViewChange('create')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    currentView === 'create' 
                                    ? 'bg-slate-700 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Tạo mới
                            </button>
                            <button
                                onClick={() => onViewChange('history')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    currentView === 'history' 
                                    ? 'bg-slate-700 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Video đã tạo
                            </button>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
