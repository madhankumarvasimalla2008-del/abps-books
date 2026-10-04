import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | { value: string; positive?: boolean };
  isPositive?: boolean;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  description,
  className = '',
}) => {
  const changeText = typeof change === 'object' && change !== null ? change.value : change;
  const positive = typeof change === 'object' && change !== null ? (change.positive ?? true) : isPositive;

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#537D99]">{title}</span>
        <div className="p-2.5 bg-[#F7FCFD] text-[#011C40] rounded-lg border border-[#D4EBF0] shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#011C40]">{value}</span>
        {changeText && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              positive ? 'bg-[#EBF7FA] text-[#023859] border border-[#D4EBF0]' : 'bg-red-50 text-red-700 border border-red-200/60'
            }`}
          >
            {changeText}
          </span>
        )}
      </div>
      {description && <p className="mt-1.5 text-xs text-[#537D99] leading-normal">{description}</p>}
    </Card>
  );
};
