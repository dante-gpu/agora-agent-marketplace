import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'google';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  glass?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  glass = false,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#e1ffa6] to-[#9dff00] text-black shadow-lg shadow-[#e1ffa6]/20 hover:opacity-90',
    secondary: 'border border-[#e1ffa6] text-[#e1ffa6] hover:bg-[#e1ffa6]/10',
    outline: glass ? 'border border-white/10 text-gray-300 hover:bg-white/5' : 'border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-900',
    ghost: 'text-gray-300 hover:bg-white/5',
    google: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glass ? 'backdrop-blur-lg' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className="mr-2 h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;