
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 py-4">
            <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} AI Video Creator. Powered by Google Gemini.</p>
            </div>
        </footer>
    );
};

export default Footer;
