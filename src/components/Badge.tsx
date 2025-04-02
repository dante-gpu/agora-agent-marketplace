import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  glass?: boolean;
}

const Badge = ({ children, variant = 'default', size = 'md', glass = false }: BadgeProps) => {
  const variants = {
    default: glass ? 'bg-white/10 text-gray-300' : 'bg-gray-800/80 text-gray-300',
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-500 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${variants[variant]}
      ${sizes[size]}
      ${glass ? 'backdrop-blur-lg' : ''}
    `}>
      {children}
    </span>
  );
};

export default Badge;