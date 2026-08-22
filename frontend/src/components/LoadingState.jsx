import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const LoadingState = ({ message = 'Analyzing student performance...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center h-20 w-20">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-violet-500 border-l-transparent animate-spin duration-1000" />
        {/* Inner Counter-Spinning Ring */}
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-violet-400 border-b-transparent border-l-blue-400 animate-spin duration-700 reverse-spin" />
        {/* Brain Icon */}
        <BrainCircuit className="h-7 w-7 text-blue-400 animate-pulse" />
      </div>
      
      <h3 className="mt-6 text-lg font-bold tracking-tight text-white font-display">
        EduPredict Engine
      </h3>
      <p className="mt-2 text-sm text-slate-400 max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
};
export default LoadingState;
