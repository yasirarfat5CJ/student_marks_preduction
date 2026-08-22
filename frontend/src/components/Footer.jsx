import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/60 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2 text-slate-400">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            <span className="font-display font-semibold text-white">EduPredict AI</span>
            <span className="text-sm">| Academic Performance Analytics</span>
          </div>
          <p className="text-center text-xs leading-5 text-slate-500 md:text-left">
            &copy; {new Date().getFullYear()} EduPredict AI
          </p>
          <div className="flex space-x-6 text-sm text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
