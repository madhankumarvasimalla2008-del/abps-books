import React from 'react';

export interface ButtonStyleProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className = '',
}: ButtonStyleProps = {}): string {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-[#023859] text-white hover:bg-[#011C40] active:bg-[#00132C] focus-visible:ring-[#023859] shadow-xs',
    accent:
      'bg-[#54ACBF] text-[#011C40] font-semibold hover:bg-[#3D96A8] hover:text-white active:bg-[#2A7E8F] focus-visible:ring-[#54ACBF] shadow-xs',
    secondary:
      'bg-[#26658C] text-white hover:bg-[#1D4F6E] active:bg-[#163D54] focus-visible:ring-[#26658C] shadow-xs',
    outline:
      'border border-[#D4EBF0] text-[#011C40] bg-white hover:bg-[#F7FCFD] hover:border-[#54ACBF] active:bg-[#EFF8FA] focus-visible:ring-[#023859] shadow-xs',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-xs',
    ghost:
      'text-[#011C40] hover:text-[#023859] hover:bg-[#023859]/5 active:bg-[#023859]/10 focus-visible:ring-[#023859]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
    lg: 'text-base px-5 py-2.5 min-h-[46px] gap-2.5',
  };

  return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
