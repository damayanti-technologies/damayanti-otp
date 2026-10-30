import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'gray';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  const variantStyles = {
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      valueColor: 'text-white',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      valueColor: 'text-white',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      valueColor: 'text-amber-400',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      valueColor: 'text-rose-400',
    },
    gray: {
      border: 'hover:border-gray-500/40',
      iconBg: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      valueColor: 'text-gray-300',
    },
  }[variant];

  return (
    <div
      className={`bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 shadow-sm transition-all duration-200 ${variantStyles.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{title}</span>
        <div className={`p-2.5 rounded-lg ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <span className={`text-2xl font-bold tracking-tight ${variantStyles.valueColor}`}>{value}</span>
        {subtitle && <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};
