import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-tomori-dark text-white px-4 pt-4 pb-3 shadow-sm sticky top-0 z-30">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-tomori-primary flex items-center justify-center border border-white/20 shadow-inner">
            <span className="text-amber-300 font-bold text-sm tracking-wider">灯</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base tracking-tight text-white">TOMORI PRICE</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium border border-amber-300/30">
                v0.1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-300 line-clamp-1">
              {subtitle || '撮るだけ、話すだけ。いつもの買い物をもっと賢く。'}
            </p>
          </div>
        </div>
        {title && (
          <div className="flex items-center text-xs font-semibold text-tomori-light bg-white/10 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
            {title}
          </div>
        )}
      </div>
    </header>
  );
};
