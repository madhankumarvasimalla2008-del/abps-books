import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  icon,
  className = '',
  onDismiss,
}) => {
  const styles = {
    info: 'bg-blue-50/90 border-blue-200 text-blue-900',
    warning: 'bg-amber-50/90 border-amber-200 text-amber-900',
    success: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
    danger: 'bg-red-50/90 border-red-200 text-red-900',
  };

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
    danger: <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />,
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-xs ${styles[type]} ${className}`}
    >
      <div className="shrink-0 mt-0.5">{icon || defaultIcons[type]}</div>
      <div className="flex-1 min-w-0 text-sm">
        {title && <h4 className="font-semibold text-sm mb-1 leading-snug">{title}</h4>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 text-current opacity-70 hover:opacity-100 rounded-md transition-opacity"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
