import React from 'react';
import { PlusCircle, Compass } from 'lucide-react';

interface HeaderProps {
  onNewProblem: () => void;
  hasActiveProblem: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNewProblem, hasActiveProblem }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#E3D9CC] bg-[#FAF7F2] sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark in Fraunces serif */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#C85A32] flex items-center justify-center text-white shadow-xs">
          <Compass className="w-4 h-4" />
        </div>
        <span className="text-xl font-bold font-serif-atelier tracking-tight text-[#2A2421]">
          Atelier Math
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#6B5E52]">
        <span className="hover:text-[#2A2421] transition-colors whitespace-nowrap shrink-0 cursor-default">
          Socratic Method
        </span>
        <span className="hover:text-[#2A2421] transition-colors whitespace-nowrap shrink-0 cursor-default">
          Calculus & Algebra
        </span>
        <span className="hover:text-[#2A2421] transition-colors whitespace-nowrap shrink-0 cursor-default">
          Interactive Slate
        </span>
        <span className="hover:text-[#2A2421] transition-colors whitespace-nowrap shrink-0 cursor-default">
          Concept Inquiries
        </span>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewProblem}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#C85A32] hover:bg-[#B34B26] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Problem</span>
        </button>
      </div>
    </header>
  );
};
