import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export const RiskBadge = ({ riskLevel }) => {
  const level = (riskLevel || 'Low').toUpperCase();

  const getStyle = () => {
    switch (level) {
      case 'HIGH':
        return {
          container: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400 animate-pulse',
          icon: ShieldAlert,
          text: 'HIGH RISK'
        };
      case 'MODERATE':
        return {
          container: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          icon: Shield,
          text: 'MODERATE RISK'
        };
      case 'LOW':
      default:
        return {
          container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: ShieldCheck,
          text: 'LOW RISK'
        };
    }
  };

  const current = getStyle();
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${current.container}`}
      role="status"
      aria-label={`Academic Risk Assessment: ${current.text}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{current.text}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
    </div>
  );
};
export default RiskBadge;
