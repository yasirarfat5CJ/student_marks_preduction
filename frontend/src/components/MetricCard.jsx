import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral' }) => {
  const getTrendStyle = () => {
    switch (trendType) {
      case 'positive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'negative':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase font-sans">
          {title}
        </span>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/50">
            <Icon className="h-5 w-5 text-blue-400" />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-baseline justify-between">
        <div className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {value}
        </div>
        
        {trend && (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getTrendStyle()}`}>
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
export default MetricCard;
