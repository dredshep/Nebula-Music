
import React, { useEffect, useState } from 'react';
import { Sparkles, X, Check, Rocket } from 'lucide-react';
import { APP_VERSION, CHANGELOG } from '../constants';

export const WhatsNewModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('nebula_version');
    if (lastSeenVersion !== APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('nebula_version', APP_VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const currentLog = CHANGELOG[0]; // Get the latest changelog

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 p-8 pb-10 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/30 rounded-full blur-3xl"></div>
            
            <button 
                onClick={handleClose} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/20 text-neutral-400 hover:text-white transition z-10"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4 transform -rotate-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">What's New</h2>
                <p className="text-primary font-mono text-sm uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Version {APP_VERSION}
                </p>
            </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-6 bg-neutral-900/50 backdrop-blur-xl flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-secondary" /> {currentLog.title}
            </h3>
            <ul className="space-y-4">
                {currentLog.changes.map((change, index) => (
                    <li key={index} className="flex items-start text-sm text-neutral-300 leading-relaxed">
                        <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 shrink-0" />
                        <span>{change}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-neutral-900/80">
            <button 
                onClick={handleClose}
                className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-primary hover:text-white transition shadow-lg flex items-center justify-center"
            >
                Got it!
            </button>
        </div>
      </div>
    </div>
  );
};
